"""Coleta incremental. Live é isolado de replay e falhas preservam o último dado."""

import threading
import time
from collections import deque
from datetime import datetime
from .adaptive import next_batch_size
from .enrichment import metadata_enrichment
from .fanout import fetch_window
from .municipal_state import future_result, tracking_hint, tracking_pending

from .config import (
    COLLECTOR_BATCH_ADMISSION_SECONDS,
    COLLECTOR_BATCH_SIZE,
    COLLECTOR_MAX_BATCH_SIZE,
    COLLECTOR_WORKERS,
    FIRST_ELECTION,
    POLL_COLLECTING_SECONDS,
    POLL_FINISHED_SECONDS,
    POLL_LIVE_SECONDS,
    TSE_BACKOFF_SECONDS,
    TRACKING_SWEEP_SECONDS,
)
from .tse import (
    TSEClient,
    _integer,
    _object,
    _objects,
    config_url,
    election_round,
    parse_catalog,
    parse_result,
    result_url,
    tracking_url,
)


class LiveCollector:
    def __init__(
        self,
        client=None,
        on_national=None,
        on_units=None,
        on_progress=None,
        batch_size=COLLECTOR_BATCH_SIZE,
        clock=time.time,
        election=FIRST_ELECTION,
        monotonic=time.monotonic,
    ):
        self.election = str(election)
        self.round = election_round(self.election)
        self.client = client or TSEClient()
        self.on_national = on_national
        self.on_units = on_units
        self.on_progress = on_progress
        self.batch_size = min(COLLECTOR_MAX_BATCH_SIZE, max(1, batch_size))
        self.clock = clock
        self.monotonic = monotonic
        self.national = None
        self.national_confirmed = False
        self.units = {}
        self.catalog = {}
        self.pending = deque()
        self.queued = set()
        self.tracking_hints = {}
        self.last_tracking = None
        self.last_tracking_success = None
        self.tracking_failures = {}
        self.structural_states = set()
        self.collection_backoff = 0
        self.revisions = []
        self.errors = []
        self.last_success = None
        self.last_catalog = 0
        self.final_refresh_idg = None
        self.last_final_refresh = None
        self.stop_event = threading.Event()
        self.lock = threading.Lock()
        self.backoff_lock = threading.Lock()

    def _queue(self, scope):
        if scope not in self.queued:
            self.pending.append(scope)
            self.queued.add(scope)

    def _accept(self, previous, incoming):
        if previous:
            recovering = self._recovering_future(previous, incoming)
            if not recovering and incoming["idg"] == previous["idg"]:
                if metadata_enrichment(previous, incoming):
                    return True
                if incoming != previous:
                    self.errors.append(
                        "IDG repetido com conteúdo divergente; versão ignorada"
                    )
                return False
            if not recovering and incoming["generated_at"] <= previous["generated_at"]:
                self.errors.append("Versão antiga ou de ordem ambígua ignorada")
                return False
            decreased = incoming["sections_counted"] < previous[
                "sections_counted"
            ] or any(
                incoming["votes"].get(cid, 0) < n
                for cid, n in previous["votes"].items()
            )
            if decreased:
                self.revisions.append(
                    {
                        "scope": incoming["scope"],
                        "previous_idg": previous["idg"],
                        "idg": incoming["idg"],
                        "generated_at": incoming["generated_at"],
                        "reason": "Correção oficial posterior com redução de contagens",
                    }
                )
                self.revisions = self.revisions[-100:]
        return True

    def _recovering_future(self, previous, incoming):
        """Corrige estado com relógio futuro sem admitir rollback ordinário."""
        limit = self.clock() + 60
        return (
            datetime.fromisoformat(previous["generated_at"]).timestamp() > limit
            and datetime.fromisoformat(incoming["generated_at"]).timestamp() <= limit
        )

    def _load_catalog(self):
        fetched = self.client.fetch(config_url(self.election))
        if fetched.status != "ok":
            return fetched
        catalog = parse_catalog(fetched.data, self.election)
        self.catalog = {
            unit["scope"]: dict(self.catalog.get(unit["scope"], {}), **unit)
            for unit in catalog
        }
        # O catálogo corrente define o estado ativo; o histórico persistido
        # continua preservando as observações de abrangências removidas.
        self.units = {s: value for s, value in self.units.items() if s in self.catalog}
        self.pending = deque(s for s in self.pending if s in self.catalog)
        self.queued = set(self.pending)
        self.tracking_hints = {
            s: hint for s, hint in self.tracking_hints.items() if s in self.catalog
        }
        self.tracking_failures = {
            uf: error for uf, error in self.tracking_failures.items() if uf in self._states()
        }
        self.last_catalog = self.clock()
        self.structural_states.clear()
        for scope in self.catalog:
            if scope not in self.units or future_result(self.units[scope], self.clock()):
                self._queue(scope)
        return fetched

    def _states(self):
        return sorted({item["uf"].lower() for item in self.catalog.values()} - {"zz"})

    def _tracking(self):
        """Varredura das UFs por prazo próprio, sem esperar uma volta por ciclo."""
        states = self._states()
        missing = [uf for uf in states if uf not in self.structural_states]
        full_sweep = (
            self.last_tracking is None
            or self.clock() - self.last_tracking >= TRACKING_SWEEP_SECONDS
        )
        if full_sweep:
            targets = states
        elif missing:
            targets = missing
        else:
            return
        # No máximo oito em voo; um bloqueio impede reposição da janela.
        def fetch(uf):
            return uf, self.client.fetch(tracking_url(uf, self.election))

        def stopped():
            return self.stop_event.is_set() or bool(self.collection_backoff)
        for uf, fetched in fetch_window(targets, fetch, stopped, COLLECTOR_WORKERS):
            try:
                self._apply_tracking(uf, fetched)
            except (ValueError, KeyError, TypeError) as exc:
                self.tracking_failures[uf] = "EA15 inválido"
                self.errors.append(uf + ": " + type(exc).__name__)
        if not self.collection_backoff and not self.stop_event.is_set():
            # Tentativas apenas de UFs faltantes não adiam as UFs saudáveis.
            if full_sweep:
                self.last_tracking = self.clock()
            if not self.tracking_failures and set(states) == self.structural_states:
                self.last_tracking_success = self.clock()
        if any(uf in self.structural_states for uf in missing):
            # Ordenar só quando chega estrutura nova preserva a justiça das
            # retentativas: um detalhe que falha não volta sempre à frente.
            self.pending = deque(
                sorted(
                    self.pending,
                    key=lambda scope: (
                        scope == "zz",
                        (
                            self.catalog[scope].get("sections_total", 0) <= 0
                            and self.units.get(scope, {}).get("sections_total", 0) <= 0
                        ),
                        self.catalog[scope].get("electorate", 0),
                        self.catalog[scope].get("sections_total", 0),
                    ),
                    reverse=True,
                )
            )

    def _apply_tracking(self, uf, fetched):
        """EA15 fornece estrutura e pistas; jamais substitui votos do EA20."""
        self.tracking_failures[uf] = "Consulta EA15 incompleta ou inválida"
        if fetched.status != "ok":
            self.errors.append(uf + ": " + (fetched.error or fetched.status))
            if fetched.status == "backoff":
                self.collection_backoff = max(self.collection_backoff, fetched.retry_at)
            return
        raw = _object(fetched.data)
        if (
            str(raw.get("ele")) != self.election
            or str(raw.get("t")) != str(self.round)
            or raw.get("f") != "o"
        ):
            self.errors.append("EA15 de eleição ou ambiente inesperado: " + uf)
            return
        updates = []
        for entry in _objects(raw.get("abr", [])):
            scope = uf + str(entry["cdabr"]).zfill(5)
            if entry.get("tpabr") not in ("mu", "mun") or scope not in self.catalog:
                continue
            sections = _integer(_object(entry["s"])["ts"])
            electors = _integer(_object(entry["e"])["te"])
            hint = tracking_hint(entry)
            updates.append((scope, sections, electors, hint))
        expected = {
            scope for scope, meta in self.catalog.items() if meta["uf"].lower() == uf
        }
        received = {item[0] for item in updates}
        if received != expected or len(received) != len(updates):
            self.errors.append("Cadastro EA15 incompleto para " + uf)
            return
        for scope, sections, electors, hint in updates:
            self.catalog[scope]["sections_total"] = sections
            self.catalog[scope]["electorate"] = electors
            if self.tracking_hints.get(scope) != hint:
                self.tracking_hints[scope] = hint
                self._queue(scope)
        self.structural_states.add(uf)
        self.tracking_failures.pop(uf, None)
        self._queue("zz")

    def _fetch_unit(self, scope):
        response = self.client.fetch(result_url(scope, self.election))
        if response.status != "ok":
            if response.status == "backoff":
                with self.backoff_lock:
                    self.collection_backoff = max(
                        self.collection_backoff, response.retry_at
                    )
            return scope, None, response.error, response.status
        try:
            value = parse_result(response.data, scope, self.election)
            if future_result(value, self.clock()):
                return scope, None, "Horário municipal futuro", "invalid"
            if not value["divulgation_allowed"]:
                return scope, None, "Votação não divulgável pelo TSE", "awaiting"
            return scope, value, None, "ok"
        except (ValueError, KeyError, TypeError) as exc:
            return scope, None, str(exc), "invalid"

    def _refresh_final_units(self):
        """O nacional final não certifica a conclusão dos detalhes municipais."""
        if not self.national["official_final"]:
            return
        changed = self.final_refresh_idg != self.national["idg"]
        retry_due = (
            not self.pending
            and not self._coherent()
            and self.last_final_refresh is not None
            and self.clock() - self.last_final_refresh >= POLL_FINISHED_SECONDS
        )
        if changed or retry_due:
            for scope in self.catalog:
                self._queue(scope)
            self.final_refresh_idg = self.national["idg"]
            self.last_final_refresh = self.clock()

    def cycle(self):
        """Um ciclo limitado: nacional primeiro e municípios sob prazo de admissão."""
        with self.lock:
            return self._cycle()

    def _cycle(self):
        self.errors = []
        self.national_confirmed = False
        self.collection_backoff = 0
        if self.stop_event.is_set():
            return self._payload("collecting", "Coleta encerrada localmente")
        response = self.client.fetch(result_url(election=self.election))
        if response.status != "ok":
            return self._payload(response.status, response.error, response.retry_at)
        try:
            incoming = parse_result(response.data, "br", self.election)
        except (ValueError, KeyError, TypeError) as exc:
            return self._payload("error", "EA20 nacional inválido: " + str(exc))
        if not incoming["divulgation_allowed"]:
            return self._payload(
                "awaiting", "TSE ainda não autorizou divulgação da votação"
            )
        if self._accept(self.national, incoming):
            self.national = incoming
            self.last_success = self.clock()
            if self.on_national:
                self.on_national(dict(incoming))
        else:
            self.last_success = self.clock()
        self.national_confirmed = incoming == self.national
        if self.stop_event.is_set():
            return self._payload("collecting", "Coleta encerrada localmente")
        try:
            if not self.catalog or self.clock() - self.last_catalog > 86400:
                catalog_response = self._load_catalog()
                if catalog_response.status != "ok":
                    return self._payload(
                        catalog_response.status,
                        catalog_response.error,
                        catalog_response.retry_at,
                    )
            self._refresh_final_units()
            if self.stop_event.is_set():
                return self._payload("collecting", "Coleta encerrada localmente")
            self._tracking()
            if self.stop_event.is_set():
                return self._payload("collecting", "Coleta encerrada localmente")
            if self.collection_backoff:
                return self._payload(
                    "backoff",
                    "TSE suspendeu temporariamente as consultas",
                    self.collection_backoff,
                )
        except (ValueError, KeyError, TypeError) as exc:
            return self._payload("error", "Catálogo/EA15 inválido: " + str(exc))
        batch = []
        # Uma UF sem EA15 não bloqueia detalhes das UFs já estruturadas.
        # Visitar cada pendência no máximo uma vez evita girar na fila incompleta.
        for _ in range(len(self.pending)):
            if len(batch) >= self.batch_size:
                break
            scope = self.pending.popleft()
            self.queued.remove(scope)
            if scope == "zz" or self.catalog[scope]["uf"].lower() in self.structural_states:
                batch.append(scope)
            else:
                self._queue(scope)
        self._collect_batch(batch)
        if self.on_units:
            self.on_units(self.snapshot_units())
        if self.collection_backoff:
            return self._payload(
                "backoff",
                "Coleta municipal suspensa após bloqueio",
                self.collection_backoff,
            )
        status = "collecting" if self.pending else "live"
        if self.national["official_final"] and not self.pending and self._coherent():
            status = "finished"
        return self._payload(status)

    def _collect_batch(self, batch):
        unfinished = set(batch)
        started = self.monotonic()
        deadline = started + COLLECTOR_BATCH_ADMISSION_SECONDS
        completed = errors = 0
        def stopped():
            return (
                self.stop_event.is_set() or bool(self.collection_backoff)
                or self.monotonic() >= deadline
            )
        try:
            for scope, value, error, status in fetch_window(
                batch, self._fetch_unit, stopped, COLLECTOR_WORKERS
            ):
                unfinished.remove(scope)
                completed += 1
                errors += status != "ok"
                if value and self._accept(self.units.get(scope), value):
                    self.units[scope] = value
                elif value and value != self.units.get(scope):
                    # Uma réplica CDN atrasada ou ambígua não satisfaz a pista
                    # EA15: manter a unidade pendente até obter versão válida.
                    self._queue(scope)
                    errors += 1
                elif status != "ok":
                    self._queue(scope)
                    if error:
                        self.errors.append(scope + ": " + error)
                    if status == "backoff":
                        self.collection_backoff = max(
                            self.collection_backoff, self.clock() + TSE_BACKOFF_SECONDS
                        )
                if value and tracking_pending(self.tracking_hints.get(scope), self.units.get(scope)):
                    self._queue(scope)
        finally:
            self.batch_size = next_batch_size(
                self.batch_size, completed, self.monotonic() - started, errors,
                bool(unfinished), bool(self.collection_backoff) or self.stop_event.is_set(),
            )
            # Ordem original preserva justiça, inclusive após exceção/stop/backoff.
            for scope in batch:
                if scope in unfinished:
                    self._queue(scope)

    def snapshot_units(self):
        """Metadados são separados dos votos: unidade ausente nunca vira zero oficial."""
        return [
            dict(meta, result=None if future_result(self.units.get(scope), self.clock())
                 else self.units.get(scope))
            for scope, meta in self.catalog.items()
        ]

    def _coherent(self):
        if any(future_result(value, self.clock()) for value in self.units.values()):
            return False
        national = self.national
        counted = sum(x["sections_counted"] for x in self.units.values())
        sections_total = sum(x["sections_total"] for x in self.units.values())
        votes = {}
        for unit in self.units.values():
            for candidate, value in unit["votes"].items():
                votes[candidate] = votes.get(candidate, 0) + value
        return bool(
            national
            and self.catalog
            and set(self.units) == set(self.catalog)
            and counted == national["sections_counted"]
            and sections_total == national["sections_total"]
            and votes == national["votes"]
        )

    def _payload(self, status, error=None, retry_at=0):
        national = self.national
        total = len(self.catalog)
        polling_status = status
        if status in ("live", "finished", "collecting") and (
            self.tracking_failures or self.errors
        ):
            status = "degraded"
        progress = {
            "units_received": len(self.units),
            "units_total": total,
            "units_pending": len(self.pending),
            "coherent": self._coherent(),
            "structural_states_received": len(self.structural_states),
            "structural_states_total": len(self._states()),
            "last_success": self.last_success,
            "last_tracking_success": self.last_tracking_success,
            "tracking_failed_states": sorted(self.tracking_failures),
            "revision_count": len(self.revisions),
            "errors": self.errors[-10:],
        }
        if self.on_progress:
            self.on_progress(progress)
        interval = (
            max(POLL_COLLECTING_SECONDS, retry_at - self.clock())
            if retry_at
            else (
                POLL_FINISHED_SECONDS
                if polling_status == "finished" and not self.pending
                else (
                    POLL_COLLECTING_SECONDS
                    if polling_status == "collecting" or self.pending
                    else POLL_LIVE_SECONDS
                )
            )
        )
        return {
            "status": status,
            "national": national,
            "units": self.snapshot_units(),
            "progress": progress,
            "revisions": list(self.revisions),
            "error": error,
            "next_poll_seconds": interval,
            "retry_at": retry_at,
        }

    def run(self, stop_event=None):
        stopped = stop_event or self.stop_event
        while not stopped.is_set():
            try:
                payload = self.cycle()
            except Exception as exc:
                payload = self._payload(
                    "error", "Falha de coleta: " + type(exc).__name__
                )
            stopped.wait(payload["next_poll_seconds"])

    def stop(self):
        self.stop_event.set()
