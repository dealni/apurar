"""Coleta suplementar incremental oficial com quota e estado compartilháveis."""
import json
import math
import time
import threading
from datetime import datetime, timezone
from pathlib import Path

from .core.config import TIMING
from .core.fanout import fetch_window
from .supplemental_tse import BASE, parse_supplemental, pending_item, supplemental_url
from .supplemental_temporal import future_timestamp

RESOURCE = Path(__file__).resolve().parents[1] / "resources" / "exterior-geography.json"


def _target(scope, name, election, office, kind, **metadata):
    uf = scope[:2].upper()
    identifier = f"{uf}:{scope[2:]}" if len(scope) == 7 else f"{uf}:aggregate"
    return {"id": identifier, "scope": scope, "name": name, "election": election,
            "office": office, "uf": uf, "kind": kind, **metadata,
            "source_url": supplemental_url(scope, election, office)}


def catalog_targets(raw, election, geography):
    if not isinstance(raw, dict) or raw.get("f") != "o":
        raise ValueError("Catálogo suplementar não oficial")
    if election not in ("6258", "6260") or not isinstance(raw.get("abr"), list):
        raise ValueError("Catálogo suplementar incompatível")
    targets = []
    for state in raw["abr"]:
        uf = state["cd"].lower()
        office = "governor" if election == "6260" else "president"
        if office == "governor":
            targets.append(_target(uf, state["ds"], election, office, "governor"))
        for city in state["mu"]:
            code = str(city["cd"]).zfill(5)
            scope = uf + code
            kind = "city" if uf == "zz" else "governor_municipality"
            metadata = geography.get(code, {}) if uf == "zz" else ({"ibge_code": city["cdi"]} if city.get("cdi") is not None else {})
            target = _target(scope, city["nm"], election, office, kind, tse_code=code, **metadata)
            if uf == "zz" or office == "governor":
                targets.append(target)
    if len({(t["election"], t["id"]) for t in targets}) != len(targets):
        raise ValueError("Identidade duplicada no catálogo suplementar")
    return targets


def country_results(cities):
    groups = {}
    for city in cities:
        if city.get("country_code"):
            groups.setdefault(city["country_code"], []).append(city)
    result = []
    for iso, members in sorted(groups.items()):
        known = [m for m in members if m["status"] == "available"]
        base = {"id": iso, "scope": iso, "election": "6258", "office": "president",
                "uf": "ZZ", "name": members[0]["country"], "country": members[0]["country"],
                "country_code": iso, "source_url": None, "kind": "country"}
        item = pending_item(base)
        item["coverage"] = {"available": len(known), "total": len(members)}
        if known:
            item.update(status="available", stale=len(known) < len(members) or any(m["stale"] for m in known))
            item["as_of"] = min(m["as_of"] for m in known) if all(m["as_of"] for m in known) else None
            item["generated_at"] = min(m["generated_at"] for m in known)
            item["sections"] = {k: sum(m["sections"][k] for m in known) for k in ("total", "counted")}
            item["totals"] = {k: sum(m["totals"][k] for m in known) if all(m["totals"][k] is not None for m in known) else None for k in item["totals"]}
            candidates = {}
            for member in known:
                for candidate in member["candidates"]:
                    value = candidates.setdefault(candidate["id"], {**candidate, "votes": 0})
                    value["votes"] += candidate["votes"]
            item["candidates"] = list(candidates.values())
        result.append(item)
    return result


def _restored_item(item, target):
    if not isinstance(item, dict) or not pending_item(target).keys() <= item.keys():
        raise ValueError("Resultado persistido incompleto")
    if any(item[field] != target[field]
           for field in ("id", "scope", "election", "office", "kind", "source_url")):
        raise ValueError("Identidade persistida divergente")
    if (item["status"] not in ("available", "awaiting", "withheld", "error", "backoff")
            or type(item["stale"]) is not bool or not isinstance(item["candidates"], list)):
        raise ValueError("Resultado persistido inválido")
    for field in ("as_of", "generated_at"):
        if item[field] is not None:
            stamp = datetime.fromisoformat(item[field])
            if stamp.tzinfo is None:
                raise ValueError("Horário persistido sem fuso")
    for field in ("sections", "totals"):
        if not isinstance(item[field], dict) or not pending_item(target)[field].keys() <= item[field].keys():
            raise ValueError("Contagens persistidas incompletas")
        if any(value is not None and (type(value) is not int or value < 0)
               for value in item[field].values()):
            raise ValueError("Contagens persistidas inválidas")
    for candidate in item["candidates"]:
        if (not isinstance(candidate, dict)
                or not all(isinstance(candidate.get(key), str) for key in ("id", "name", "party", "status", "validity"))
                or candidate.get("votes") is not None and (type(candidate["votes"]) is not int or candidate["votes"] < 0)):
            raise ValueError("Candidatura persistida inválida")
    if item["status"] == "available":
        _available_item(item)
    # Migrar somente depois de validar o estado original: substituir antes
    # ocultaria horários malformados ou posteriores à geração persistida.
    if target["uf"] == "ZZ" and item["as_of"] is not None:
        item = {**item, "as_of": item["generated_at"]}
    return item


def _available_item(item):
    sections = item["sections"]
    if (item["generated_at"] is None
            or any(type(sections[key]) is not int for key in ("total", "counted"))
            or sections["counted"] > sections["total"]
            or any(type(candidate.get("votes")) is not int for candidate in item["candidates"])):
        raise ValueError("Resultado disponível persistido incompleto")
    if item["as_of"] is None:
        if sections["counted"] or any(item["totals"][key] for key in ("valid", "blank", "null", "turnout")):
            raise ValueError("Votação persistida sem horário oficial")
    elif datetime.fromisoformat(item["as_of"]) > datetime.fromisoformat(item["generated_at"]):
        raise ValueError("Totalização persistida posterior à geração oficial")


def _schedule_time(value):
    return type(value) in (int, float) and math.isfinite(value)


class SupplementalCollector:
    """step é limitado; falhas preservam dados, cursores e proveniência anterior."""

    def __init__(self, client, state_dir, clock=time.time, monotonic=time.monotonic):
        self.client, self.clock, self.monotonic = client, clock, monotonic
        self.detail_retry = {}
        self.path = Path(state_dir) / "supplemental-state.json"
        self.geography = json.loads(RESOURCE.read_text())
        self.targets, self.items, self.cursors = {}, {}, {"detail": 0}
        self.catalog_checked_at, self.last_error = 0, None
        self.blocked_until = 0
        if self.path.exists():
            self._restore()

    def _restore(self):
        try:
            saved = json.loads(self.path.read_text())
            if saved.get("schema_version") != 1 or saved.get("election") != "6258":
                raise ValueError("Estado suplementar incompatível")
            if not isinstance(saved["targets"], dict) or not isinstance(saved["items"], dict):
                raise ValueError("Estado suplementar deve ser objeto")
            targets = {key: target for key, target in saved["targets"].items()
                       if target.get("kind") in ("governor", "city", "governor_municipality")}
            for target in targets.values():
                if target.get("zone") or target["source_url"] != supplemental_url(
                        target["scope"], target["election"], target["office"]):
                    raise ValueError("Fonte persistida inválida")
            items = {key: _restored_item(saved["items"][key], target)
                     for key, target in targets.items()}
            cursor = saved["cursors"].get("detail", 0)
            checked_at = saved.get("catalog_checked_at", 0)
            blocked_until = saved.get("blocked_until", 0)
            retry = {key: due for key, due in saved.get("detail_retry", {}).items()
                     if key in targets}
            if (type(cursor) is not int or cursor < 0
                    or not _schedule_time(checked_at)
                    or not _schedule_time(blocked_until)
                    or any(not _schedule_time(due) for due in retry.values())):
                raise ValueError("Agenda suplementar inválida")
            self.targets, self.items = targets, items
            self.cursors = {"detail": cursor}
            self.catalog_checked_at, self.detail_retry = checked_at, retry
            self.blocked_until = blocked_until
        except (ValueError, KeyError, TypeError, AttributeError):
            self.last_error = "Estado suplementar inválido; aguardando nova consulta oficial"

    def _save(self):
        self.path.parent.mkdir(parents=True, exist_ok=True)
        value = {"schema_version": 1, "election": "6258", "targets": self.targets,
                 "items": self.items, "cursors": self.cursors,
                 "catalog_checked_at": self.catalog_checked_at,
                 "blocked_until": self.blocked_until,
                 "detail_retry": self.detail_retry}
        temporary = self.path.with_suffix(".tmp")
        temporary.write_text(json.dumps(value, ensure_ascii=False, separators=(",", ":")))
        temporary.replace(self.path)

    def _catalogs(self, stopped=None, deadline=float("inf")):
        if self.catalog_checked_at and self.clock() - self.catalog_checked_at < 3600:
            return
        all_ok = True
        for election in ("6258", "6260"):
            if (stopped and stopped.is_set()) or self.monotonic() >= deadline:
                all_ok = False
                break
            fetched = self.client.fetch(f"{BASE}/{election}/config/mun-e{int(election):06d}-cm.json")
            if fetched.status != "ok":
                all_ok = False
                self.last_error = fetched.error or fetched.status
                if fetched.status == "backoff":
                    self._block(fetched.retry_at)
                    break
                continue
            try:
                refreshed = {election + ":" + target["id"]: target
                             for target in catalog_targets(fetched.data, election, self.geography)}
                removed = {key for key, target in self.targets.items()
                           if target["election"] == election and key not in refreshed}
                for key in removed:
                    self.targets.pop(key)
                    self.items.pop(key, None)
                    self.detail_retry.pop(key, None)
                for key, target in refreshed.items():
                    self.targets[key] = target
                    self.items[key] = {**self.items.get(key, pending_item(target)), **target}
            except (KeyError, ValueError, TypeError, AttributeError):
                all_ok = False
                self.last_error = "Catálogo suplementar inválido"
        self.catalog_checked_at = self.clock() if all_ok else self.clock() - 3540
        if all_ok:
            self.last_error = None

    def _fetch(self, key):
        target = self.targets[key]
        fetched = self.client.fetch(target["source_url"])
        if fetched.status == "ok":
            try:
                parsed = parse_supplemental(fetched.data, target)
                now = self.clock()
                if any(future_timestamp(parsed[field], now)
                       for field in ("as_of", "generated_at")):
                    raise ValueError("Horário suplementar futuro")
                previous = self.items[key]
                previous_stamp = previous.get("generated_at")
                # Um relógio anteriormente adiantado não pode impedir a
                # recuperação pela geração oficial corrigida, mesmo com menos votos.
                if previous_stamp and not future_timestamp(previous_stamp, now):
                    incoming_time = datetime.fromisoformat(parsed["generated_at"])
                    previous_time = datetime.fromisoformat(previous_stamp)
                    if incoming_time < previous_time:
                        raise ValueError("Versão suplementar anterior ao estado persistido")
                    # Uma réplica divergente no mesmo instante não comprova uma
                    # correção oficial. Estado de rede e metadados do catálogo
                    # não fazem parte das contagens que identificam a versão.
                    fields = ("as_of", "sections", "totals", "candidates",
                              "official_final", "official_totalization_final")
                    if incoming_time == previous_time and any(
                            previous.get(field) != parsed.get(field) for field in fields):
                        raise ValueError("Versão suplementar de ordem ambígua")
                self.items[key] = parsed
                return "ok", 0
            except (KeyError, TypeError, ValueError, AttributeError):
                status = "error"
        else:
            status = fetched.status
        old = self.items[key]
        self.items[key] = {**old, "stale": old["status"] == "available" or old["stale"],
                           "fetch_status": status}
        if old["status"] != "available":
            self.items[key]["status"] = status if status in ("awaiting", "backoff") else "error"
        return status, max(self.clock() + 30, fetched.retry_at)

    def _safe_fetch(self, key):
        try:
            status, retry_at = self._fetch(key)
        except (OSError, ValueError, KeyError, TypeError, AttributeError):
            status, retry_at = "error", self.clock() + 30
            self.items[key] = {**self.items[key], "stale": True, "fetch_status": "error"}
        return key, status, retry_at

    def _record(self, key, status, retry_at):
        if status == "ok":
            self.detail_retry.pop(key, None)
        else:
            self.detail_retry[key] = retry_at
            if status == "backoff":
                self._block(retry_at)

    def _block(self, retry_at):
        self.blocked_until = max(self.blocked_until, retry_at,
                                 self.clock() + TIMING["blockSeconds"])

    def _schedule(self):
        now = self.clock()
        backoff = max(0, self.blocked_until - now)
        if backoff:
            return {"next_poll_seconds": backoff, "backoff_seconds": backoff}
        values = list(self.items.values())
        if any(item["status"] == "awaiting" and self.detail_retry.get(key, 0) <= now
               for key, item in self.items.items()):
            delay = TIMING["collectingSeconds"]
        elif (values and not self.last_error and all(
                item["status"] == "available" and item.get("official_final")
                and not item["stale"] for item in values)):
            delay = TIMING["finishedSeconds"]
        else:
            delay = TIMING["liveSeconds"]
        return {"next_poll_seconds": delay, "backoff_seconds": 0}

    def _detail_keys(self, detail, limit, selected):
        keys = []
        for _ in range(len(detail)):
            cursor = self.cursors["detail"] % len(detail)
            key = detail[cursor]
            self.cursors["detail"] = cursor + 1
            if key not in selected and self.detail_retry.get(key, 0) <= self.clock():
                keys.append(key)
                selected.add(key)
                if len(keys) >= limit:
                    break
        return keys

    def _jobs(self, groups, budget):
        for key in groups["governor"]:
            if self.detail_retry.get(key, 0) <= self.clock():
                yield key
        detail = groups["city"] + groups["governor_municipality"]
        selected = set()
        for _ in range(max(0, budget)):
            keys = self._detail_keys(detail, 1, selected)
            if not keys:
                break
            yield keys[0]

    def _work(self, groups, budget, stopped, deadline):
        blocked = False
        def halted():
            return blocked or stopped.is_set() or self.monotonic() >= deadline
        jobs = self._jobs(groups, budget)
        for key, status, retry_at in fetch_window(jobs, self._safe_fetch, halted, 8):
            self._record(key, status, retry_at)
            blocked = blocked or status == "backoff"

    def step(self, budget=128, stop_event=None, max_seconds=15):
        stopped = stop_event or threading.Event()
        deadline = self.monotonic() + max(0, max_seconds)
        if stopped.is_set() or self.blocked_until > self.clock():
            return self.payload()
        self._catalogs(stopped, deadline)
        groups = {kind: [k for k, t in self.targets.items() if t["kind"] == kind]
                  for kind in ("governor", "city", "governor_municipality")}
        if self.blocked_until <= self.clock():
            self._work(groups, budget, stopped, deadline)
        self._save()
        return self.payload()

    def payload(self):
        values = list(self.items.values())
        cities = [v for v in values if v["kind"] == "city"]
        return {"schema_version": 1, "election": "6258", "mode": "live",
                "updated_at": datetime.fromtimestamp(self.clock(), timezone.utc).isoformat(),
                "governors": [v for v in values if v["kind"] == "governor"],
                "governor_municipalities": [v for v in values if v["kind"] == "governor_municipality"],
                "exterior": {"cities": cities, "countries": country_results(cities)},
                "zones": [],
                "capabilities": {"governor": True, "exterior_city": True,
                    "exterior_country": True, "zones": False, "neighborhoods": False},
                "coverage": {**self._schedule(), "pending": sum(v["status"] == "awaiting" for v in values),
                    "errors": sum(v.get("fetch_status", v["status"]) in ("error", "backoff") for v in values) + int(bool(self.last_error)),
                    "total": len(values), "available": sum(v["status"] == "available" for v in values),
                    "catalog_error": self.last_error,
                    "zones": {"total": 0, "available": 0, "pending": 0}}}
