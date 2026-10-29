"""Arquivo integral de referências confirmadas; não reconstrói observações ausentes."""
import hashlib
import logging
import sqlite3
from contextlib import closing
from pathlib import Path

from .archive_confirmation import (
    confirmation_key, recently_confirmed, confirm, forget, forget_destination,
)
from .archive_objects import (
    confirm_object, confirm_observations, forget_references, reject_regression,
)
from .snapshot import encode, now
from .history import sample_rows
from .publisher import MAX_OBJECT_BYTES

LOGGER = logging.getLogger("apurar.collector.archive")


class PublicationArchive:
    def __init__(self, state_dir, local, remote=None):
        self.path = Path(state_dir) / "publication-archive.sqlite3"
        self.path.parent.mkdir(parents=True, exist_ok=True)
        self.local, self.remote = local, remote

    def _open(self):
        connection = sqlite3.connect(self.path)
        connection.execute(
            "CREATE TABLE IF NOT EXISTS publications ("
            "sequence INTEGER PRIMARY KEY, family TEXT, identity TEXT, body TEXT, "
            "UNIQUE(family, identity))"
        )
        return connection

    def observe(self, family, pointer, source_as_of, observed_at=None, limit=500):
        if (family not in ("core", "supplemental")
                or type(limit) is not int or not 2 <= limit <= 500):
            raise ValueError("Família ou limite de arquivo inválido")
        if not pointer["key"].startswith("live/6258/"):
            raise ValueError("Arquivo aceita apenas publicação oficial ao vivo")
        # Identidade pelo lote, não pelo horário da fonte: correções são observações.
        identity = hashlib.sha256(encode(pointer)).hexdigest()
        body = {"id": f"{family}-{identity}", "family": family,
                "observed_at": observed_at or now(), "source_as_of": source_as_of,
                "pointer": pointer}
        with closing(self._open()) as connection:
            connection.execute(
                "INSERT OR IGNORE INTO publications (family,identity,body) VALUES (?,?,?)",
                (family, identity, encode(body).decode()),
            )
            connection.commit()
            count, observations = sample_rows(connection, "publications", limit)
        index = {"schema_version": 1, "election": "6258", "mode": "live",
                 "started_at": observations[0]["observed_at"],
                 "updated_at": observations[-1]["observed_at"],
                 "total_observations": count, "sampled": count > limit,
                 "truncated": count > limit, "observations": observations}
        self._publish(index)
        return index

    def _publish(self, index):
        body = encode(index)
        if len(body) > MAX_OBJECT_BYTES:
            raise ValueError("Arquivo excede limite de publicação")
        sha = hashlib.sha256(body).hexdigest()
        key = f"live/6258/archive/{sha}.json"
        pointer = encode({"schema_version": 1, "key": key, "sha256": sha,
                          "updated_at": index["updated_at"]})
        cache_key = confirmation_key(self.path, self.local, self.remote, sha)
        cached = recently_confirmed(cache_key)
        if not cached:
            forget_destination(cache_key)
        try:
            destinations = [self.local] if cached else [self.local, self.remote]
            # Uma restauração antiga nunca substitui o índice mais recente,
            # inclusive quando observações distintas têm o mesmo timestamp.
            with closing(self._open()) as connection:
                for publisher in destinations:
                    fallback = self.remote if publisher is self.local else self.local
                    reject_regression(publisher, index, connection, fallback)
            if not cached:
                confirm_observations(self.path, self.local, self.remote,
                                     index["observations"])
            # Nenhum ponteiro avança antes de todos os objetos estarem legíveis.
            for publisher in destinations:
                self._confirm_object(publisher, key, body)
            for publisher in destinations:
                self._confirm_pointer(publisher, pointer)
            if not cached:
                confirm(cache_key, self.local, self.remote)
        except Exception:
            forget(cache_key)
            forget_references(self.path, self.local, self.remote)
            raise

    @staticmethod
    def _confirm_object(publisher, key, body):
        confirm_object(publisher, key, body)
    @staticmethod
    def _confirm_pointer(publisher, pointer):
        if publisher is not None:
            if publisher.bucket.get("live/6258/archive-latest.json") != pointer:
                publisher.bucket.put("live/6258/archive-latest.json", pointer, "no-store")
                if publisher.bucket.get("live/6258/archive-latest.json") != pointer:
                    raise ValueError("Ponteiro de arquivo não confirmado")


def archive_confirmed(state_dir, local, remote, family, pointer, source_as_of):
    """Falha de arquivo tem diagnóstico próprio e nunca retém votos oficiais."""
    status = Path(state_dir) / "archive-status.json"
    try:
        index = PublicationArchive(state_dir, local, remote).observe(
            family, pointer, source_as_of
        )
        value = {"status": "ok", "checked_at": now(),
                 "total_observations": index["total_observations"]}
    except Exception as error:  # Arquivo é independente do recibo eleitoral.
        LOGGER.warning("Falha no arquivo de publicações confirmadas: %s", error)
        value = {"status": "error", "checked_at": now(), "error": str(error)}
    try:
        temporary = status.with_suffix(".tmp")
        temporary.write_bytes(encode(value))
        temporary.replace(status)
    except OSError:
        LOGGER.exception("Falha ao registrar saúde do arquivo")
