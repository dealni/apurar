"""Referências públicas confirmadas no destino, com cache remoto curto e limitado."""
import hashlib
import json
import time
from collections import OrderedDict

from .archive_confirmation import confirmation_key, CONFIRMATION_TTL_SECONDS
from .diagnostics import instant
from .publisher import MAX_OBJECT_BYTES
from .recovery_archive import observation, reference
from .snapshot import encode

_references = OrderedDict()
MAX_REFERENCE_CONFIRMATIONS = 2000


def forget_references(state, local, remote):
    destination = confirmation_key(state, local, remote, "")[:3]
    for key in tuple(_references):
        if key[:3] == destination:
            _references.pop(key, None)


def _cached(key):
    previous = _references.get(key)
    if previous is None:
        return False
    monotonic, wall, _buckets = previous
    if not (0 <= time.monotonic() - monotonic < CONFIRMATION_TTL_SECONDS
            and 0 <= time.time() - wall < CONFIRMATION_TTL_SECONDS):
        _references.pop(key, None)
        return False
    _references.move_to_end(key)
    return True


def confirm_object(publisher, key, body):
    if publisher is None:
        return
    if len(body) > MAX_OBJECT_BYTES:
        raise ValueError("Objeto de arquivo excede limite de publicação")
    previous = publisher.bucket.get(key)
    if previous is not None and previous != body:
        raise ValueError("Objeto de arquivo divergente")
    if previous is None:
        publisher.bucket.put(key, body, "public, max-age=31536000, immutable")
        if publisher.bucket.get(key) != body:
            raise ValueError("Arquivo não confirmado")


class _Sources:
    def __init__(self, local, remote, known=None):
        self.publishers = (local, remote)
        self.objects = {}
        self.known = known or {}

    def get(self, key):
        for publisher in self.publishers:
            if publisher is not None:
                body = publisher.bucket.get(key)
                if body is not None:
                    if len(body) > MAX_OBJECT_BYTES:
                        raise ValueError("Referência de arquivo excede limite")
                    self.objects[key] = body
                    return body
        return self.known.get(key)


def confirm_observations(state, local, remote, entries):
    # A publicação pública exige apenas sua amostra (até 500 observações).
    # O ensaio de recuperação continua conferindo o SQLite integral.
    for entry in entries:
        # Inclui metadados da observação, além da identidade do lote.
        digest = hashlib.sha256(encode(entry)).hexdigest()
        key = confirmation_key(state, local, remote, digest)
        if _cached(key):
            continue
        identity = hashlib.sha256(encode(entry["pointer"])).hexdigest()
        if entry["id"] != f"{entry['family']}-{identity}":
            raise ValueError("Identidade de arquivo divergente")
        sources = _Sources(local, remote)
        observation(sources, entry)
        try:
            for publisher in (local, remote):
                for object_key, body in sources.objects.items():
                    confirm_object(publisher, object_key, body)
            _references[key] = (time.monotonic(), time.time(), (local, remote))
            _references.move_to_end(key)
            while len(_references) > MAX_REFERENCE_CONFIRMATIONS:
                _references.popitem(last=False)
        except Exception:
            _references.pop(key, None)
            raise


def reject_regression(publisher, candidate, connection, fallback=None):
    if publisher is None:
        return
    raw = publisher.bucket.get("live/6258/archive-latest.json")
    if raw is None:
        return
    pointer = json.loads(raw)
    # Índice ausente pode usar o outro destino ou a reconstrução de SHA igual.
    # Conteúdo presente e corrompido continua sendo recusado, sem sobrescrita.
    candidate_body = encode(candidate)
    candidate_sha = hashlib.sha256(candidate_body).hexdigest()
    known = {f"live/6258/archive/{candidate_sha}.json": candidate_body}
    previous = reference(_Sources(publisher, fallback, known), pointer, "archive")
    count = previous.get("total_observations")
    if (pointer.get("schema_version") != 1
            or previous.get("schema_version") != 1
            or previous.get("election") != "6258" or previous.get("mode") != "live"
            or previous.get("updated_at") != pointer.get("updated_at")
            or type(count) is not int or count < 1
            or not isinstance(previous.get("observations"), list)
            or not 1 <= len(previous["observations"]) <= min(500, count)):
        raise ValueError("Índice de arquivo anterior inválido")
    if (count > candidate["total_observations"]
            or instant(previous["updated_at"]) > instant(candidate["updated_at"])):
        raise ValueError("Arquivo anterior ao índice atual; verificar restauração")
    # Contagem e horário iguais não autorizam substituir outra trajetória.
    for entry in previous["observations"]:
        identity = hashlib.sha256(encode(entry["pointer"])).hexdigest()
        row = connection.execute(
            "SELECT body FROM publications WHERE family = ? AND identity = ?",
            (entry["family"], identity),
        ).fetchone()
        if row is None or json.loads(row[0]) != entry:
            raise ValueError("Trajetória de arquivo divergente; verificar restauração")
