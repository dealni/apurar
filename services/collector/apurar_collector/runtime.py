"""Processo único headless; nenhuma requisição pública dispara coleta."""

import fcntl
import hashlib
import json
import logging
import math
import threading
from contextlib import contextmanager
from datetime import datetime
from pathlib import Path

from .core.collector import LiveCollector
from .core.config import TSE_BACKOFF_SECONDS
from .core.municipal_state import future_collection, future_municipalities
from .core.store import Store
from .core.tse import TSEClient
from .publisher import LocalBucket, Publisher
from .history import History
from .input_signature import destination_signature, input_signature, reusable
from .publication_archive import archive_confirmed
from .publication_confirmation import RemoteConfirmation, remote_matches
from .snapshot import build, encode, history_point, municipalities, now

LOGGER = logging.getLogger("apurar.collector")


def atomic(path, value):
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = path.with_suffix(path.suffix + ".tmp")
    temporary.write_bytes(encode(value))
    temporary.replace(path)


@contextmanager
def exclusive(state_dir):
    state_dir = Path(state_dir)
    state_dir.mkdir(parents=True, exist_ok=True)
    with (state_dir / "collector.lock").open("a") as handle:
        try:
            fcntl.flock(handle, fcntl.LOCK_EX | fcntl.LOCK_NB)
        except BlockingIOError as exc:
            raise RuntimeError("Já existe coletor usando este diretório") from exc
        try:
            yield
        finally:
            fcntl.flock(handle, fcntl.LOCK_UN)


class RecordingClient(TSEClient):
    def __init__(self, state_dir, **kwargs):
        super().__init__(on_block=self._remember_block, **kwargs)
        self.archive = Path(state_dir) / "raw"
        self.recorded_urls = set()
        self.backoff_path = Path(state_dir) / "tse-backoff.json"
        self.backoff_until = 0
        self.backoff_lock = threading.Lock()
        self._restore_block()

    def _remember_block(self, retry_at):
        with self.backoff_lock:
            self.backoff_until = max(self.backoff_until, retry_at)
            atomic(self.backoff_path, {"retry_at": self.backoff_until})

    def _restore_block(self):
        try:
            value = json.loads(self.backoff_path.read_text())
            retry_at = value["retry_at"]
            if isinstance(retry_at, bool) or not isinstance(retry_at, (int, float)) or not math.isfinite(retry_at) or retry_at < 0:
                raise ValueError("Pausa inválida")
        except FileNotFoundError:
            return
        except (OSError, ValueError, TypeError, KeyError, OverflowError):
            LOGGER.warning("Registro de pausa TSE inválido; aguardando pausa de segurança")
            retry_at = self.clock() + TSE_BACKOFF_SECONDS
            self.limiter.defer(TSE_BACKOFF_SECONDS)
            try:
                self._remember_block(retry_at)
            except OSError:
                LOGGER.warning("Falha ao registrar pausa de segurança TSE")
            return
        self.backoff_until = retry_at
        self.limiter.defer(max(0, retry_at - self.clock()))

    def fetch(self, url):
        fetched = super().fetch(url)
        if fetched.status == "ok" and (fetched.changed or url not in self.recorded_urls):
            # O cache HTTP já foi atualizado. Uma falha de disco precisa deixar
            # a captura pendente, inclusive quando a próxima resposta for 304.
            self.recorded_urls.discard(url)
            body = encode({"url": url, "collected_at": now(), "data": fetched.data})
            sha = hashlib.sha256(body).hexdigest()
            path = self.archive / (sha + ".json")
            path.parent.mkdir(parents=True, exist_ok=True)
            temporary = path.with_suffix(".tmp")
            temporary.write_bytes(body)
            temporary.replace(path)
            self.recorded_urls.add(url)
        return fetched


class Runtime:
    def __init__(self, prior, state_dir, output, remote=None, *, projection_enabled=True, projection_reason=None,
                 confirmation_clock=None):
        self.prior, self.state_dir = prior, Path(state_dir)
        self.local = Publisher(LocalBucket(output))
        self.remote = remote
        self.projection_enabled = projection_enabled
        self.projection_reason = projection_reason
        self._input_signatures = {}
        self._remote_confirmation = RemoteConfirmation(confirmation_clock)
        self.state_dir.mkdir(parents=True, exist_ok=True)

    def emit(self, collection, *, mode, collected_at=None, _retry=True):
        stamp = collected_at or now()
        limit = datetime.fromisoformat(stamp).timestamp()
        if mode == "live" and future_collection(collection, limit):
            raise ValueError("Horário municipal futuro; publicação interrompida")
        if _retry:
            self.retry_pending(mode=mode)
        receipt_path = self.state_dir / f"publication-{mode}.json"
        receipt = json.loads(receipt_path.read_text()) if receipt_path.exists() else None
        fingerprint = input_signature(collection, self.prior, mode,
                                      self.projection_enabled, self.projection_reason)
        if receipt and self._input_signatures.get(mode) == (fingerprint, receipt["signature"]):
            if self._confirmed(receipt, mode):
                source_time = receipt["snapshot"]["source"]["as_of"]
                if datetime.fromisoformat(source_time) <= datetime.fromisoformat(stamp) <= datetime.fromisoformat(now()):
                    return self._unchanged(receipt, stamp, mode)
        snapshot = build(
            collection, self.prior, mode=mode, collected_at=stamp, published_at=now(),
            projection_enabled=self.projection_enabled,
            projection_reason=self.projection_reason,
        )
        cities = municipalities(collection)
        material = dict(snapshot)
        material.pop("snapshot_id")
        material.pop("published_at")
        material["source"] = {
            key: value
            for key, value in snapshot["source"].items()
            if key != "collected_at"
        }
        signature = hashlib.sha256(encode([material, cities])).hexdigest()
        if (
            receipt
            and receipt["signature"] == signature
            and receipt.get("remote") == bool(self.remote)
            and self._confirmed(receipt, mode)
        ):
            self._remember_input(mode, fingerprint, receipt)
            return self._unchanged(receipt, stamp, mode)
        points = History(self.state_dir, mode).observe(history_point(snapshot))
        history = {
            "schema_version": 1,
            "election": "6258",
            "snapshot_id": snapshot["snapshot_id"],
            "points": points,
        }
        cities["snapshot_id"] = snapshot["snapshot_id"]
        pointer = self.local.publish(snapshot, cities, history)
        pending = {
            "signature": signature,
            "snapshot": snapshot,
            "pointer": pointer,
            "remote": bool(self.remote),
            "previous_pointer": receipt["pointer"] if receipt else None,
            "collection": collection,
            "input_signature": fingerprint if reusable(snapshot) else None,
        }
        # O lote local já está completo; recuperar upload não exige consultar o TSE.
        atomic(self.state_dir / f"pending-{mode}.json", pending)
        return self._complete(pending, cities, history, mode)

    def _confirmed(self, receipt, mode):
        try:
            return self._confirm(receipt, mode)
        except Exception:
            self._remote_confirmation.forget(mode)
            raise

    def _confirm(self, receipt, mode):
        if receipt.get("remote") != bool(self.remote):
            self._remote_confirmation.forget(mode)
            return False
        if receipt.get("destinations") != self._destinations():
            self._remote_confirmation.forget(mode)
            return False
        pointer = receipt["pointer"]
        if self.local.bucket.get(f"{mode}/6258/latest.json") != encode(pointer):
            self._remote_confirmation.forget(mode)
            return False
        for reference in (pointer, pointer["municipalities"], pointer["history"]):
            body = self.local.bucket.get(reference["key"])
            if body is None or hashlib.sha256(body).hexdigest() != reference["sha256"]:
                self._remote_confirmation.forget(mode)
                return False
        if self.local.bucket.get(pointer["key"]) != encode(receipt["snapshot"]):
            self._remote_confirmation.forget(mode)
            return False
        cities = json.loads(self.local.bucket.get(pointer["municipalities"]["key"]))
        if mode == "live":
            limit = datetime.fromisoformat(receipt["snapshot"]["source"]["collected_at"]).timestamp()
            collection = json.loads((self.state_dir / f"collection-{mode}.json").read_text())
            if future_municipalities(cities, limit) or future_collection(collection, limit):
                self._remote_confirmation.forget(mode)
                return False
        if not self.remote:
            return True
        key = self._remote_confirmation.key(self._destinations(), self.local, self.remote, pointer)
        if self._remote_confirmation.recent(mode, key):
            return True
        if not remote_matches(self.remote, pointer, mode):
            self._repair_remote(receipt, mode)
        if key != self._remote_confirmation.key(self._destinations(), self.local, self.remote, pointer):
            raise RuntimeError("Destino alterado durante a confirmação remota")
        self._remote_confirmation.remember(mode, key)
        return True

    def _repair_remote(self, receipt, mode):
        # Reenvia a geração original; recalcular a mesma entrada daria a ela
        # um horário novo e poderia encobrir outro escritor mais recente.
        collection = json.loads((self.state_dir / f"collection-{mode}.json").read_text())
        pending = {**receipt, "collection": collection, "remote_repair": True}
        atomic(self.state_dir / f"pending-{mode}.json", pending)
        self.retry_pending(mode=mode)

    def _destinations(self):
        return {"local": destination_signature(self.local),
                "remote": destination_signature(self.remote)}

    def _remember_input(self, mode, fingerprint, receipt):
        if fingerprint and reusable(receipt["snapshot"]):
            self._input_signatures[mode] = fingerprint, receipt["signature"]
        else:
            self._input_signatures.pop(mode, None)

    def _unchanged(self, receipt, stamp, mode):
        snapshot = receipt["snapshot"]
        atomic(self.state_dir / f"heartbeat-{mode}.json", {
            "checked_at": stamp, "source_as_of": snapshot["source"]["as_of"],
            "snapshot_id": snapshot["snapshot_id"], "changed": False,
        })
        if mode == "live":
            archive_confirmed(self.state_dir, self.local, self.remote, "core",
                              receipt["pointer"], snapshot["source"]["as_of"])
        return snapshot, receipt["pointer"]

    def _complete(self, pending, cities, history, mode):
        self._remote_confirmation.forget(mode)
        if pending["remote"] and not self.remote:
            raise RuntimeError("Pendência remota exige publicador R2 configurado")
        snapshot, pointer = pending["snapshot"], pending["pointer"]
        destinations = self._destinations()
        remote_key = None
        if self.remote:
            remote_key = self._remote_confirmation.key(destinations, self.local, self.remote, pointer)
            if not pending.get("remote_repair") or not remote_matches(self.remote, pointer, mode):
                self.remote.publish(snapshot, cities, history)
        if (destinations != self._destinations() or (self.remote and remote_key !=
                self._remote_confirmation.key(destinations, self.local, self.remote, pointer))):
            raise RuntimeError("Destino alterado durante a publicação; repetir confirmação")
        pending = {**pending, "remote": bool(self.remote), "destinations": destinations}
        atomic(self.state_dir / f"snapshot-{mode}.json", snapshot)
        atomic(self.state_dir / f"collection-{mode}.json", pending["collection"])
        atomic(
            self.state_dir / f"publication-{mode}.json",
            {key: value for key, value in pending.items() if key not in ("collection", "remote_repair")},
        )
        (self.state_dir / f"pending-{mode}.json").unlink(missing_ok=True)
        self._remember_input(mode, pending.get("input_signature"), pending)
        if self.remote:
            self._remote_confirmation.remember(mode, remote_key)
        if mode == "live":
            archive_confirmed(self.state_dir, self.local, self.remote, "core",
                              pointer, snapshot["source"]["as_of"])
        return snapshot, pointer

    def retry_pending(self, *, mode):
        path = self.state_dir / f"pending-{mode}.json"
        if not path.exists():
            return None
        pending = json.loads(path.read_text())
        pointer = pending["pointer"]
        values = []
        for reference in (pointer, pointer["municipalities"], pointer["history"]):
            body = self.local.bucket.get(reference["key"])
            if body is None or hashlib.sha256(body).hexdigest() != reference["sha256"]:
                raise ValueError("Lote pendente local ausente ou corrompido")
            values.append(json.loads(body))
        if values[0] != pending["snapshot"] or values[0]["mode"] != mode:
            raise ValueError("Snapshot pendente incompatível")
        limit = datetime.fromisoformat(pending["snapshot"]["source"]["collected_at"]).timestamp()
        if mode == "live" and (future_municipalities(values[1], limit)
                               or future_collection(pending["collection"], limit)):
            # Preservar evidência local, sem reenviar o lote inválido nem prender
            # a próxima coleta válida numa retentativa impossível.
            digest = hashlib.sha256(path.read_bytes()).hexdigest()
            path.replace(path.with_name(f"rejected-pending-{mode}-{digest}.json"))
            self._remote_confirmation.forget(mode)
            LOGGER.warning("Pendência municipal futura isolada; aguardando coleta válida")
            return None
        if not self.projection_enabled and pending["snapshot"]["projection"]["available"]:
            # A recuperação também respeita a chave operacional desta execução.
            return self.emit(pending["collection"], mode=mode, _retry=False)
        return self._complete(pending, values[1], values[2], mode)


class LiveSession:
    def __init__(self, state_dir, client=None):
        state_dir = Path(state_dir)
        state_dir.mkdir(parents=True, exist_ok=True)
        self.store = Store(state_dir / "live-6258.sqlite3")
        self.store.discard_incompatible("6258", 2)
        self.collector = LiveCollector(
            client or RecordingClient(state_dir), election="6258"
        )
        restored = self.store.official()
        self.collector.national = restored.get("br")
        self.collector.units.update({k: v for k, v in restored.items() if k != "br"})

    def cycle(self):
        collection = self.collector.cycle()
        national = collection.get("national")
        if national:
            self.store.save_official(national)
        for wrapper in collection["units"]:
            if wrapper.get("result"):
                self.store.save_official(wrapper["result"])
        if collection["status"] in ("error", "backoff", "invalid", "awaiting", "degraded"):
            # Nacional confirmado independe da disponibilidade do fanout municipal.
            if (
                national
                and self.collector.national_confirmed
            ):
                LOGGER.warning(
                    "Nacional confirmado preservado; sincronização municipal: %s",
                    collection["status"],
                )
                collection["projection_block_reason"] = (
                    "Projeção suspensa: coleta municipal parcial; "
                    "os totais oficiais nacionais permanecem atualizados."
                )
                return collection, collection
            LOGGER.warning("Coleta sem publicação: %s", collection["status"])
            return None, collection
        return collection, collection

    def close(self):
        self.collector.stop()
        self.store.close()
