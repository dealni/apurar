"""Deduplicação conservadora dos insumos, apenas durante esta execução."""

import hashlib
from pathlib import Path
from uuid import uuid4
from weakref import WeakKeyDictionary

from .snapshot import encode

_opaque_destinations = WeakKeyDictionary()


def destination_signature(publisher):
    """Recibos identificam destino por hash, nunca por credenciais ou URL."""
    if publisher is None:
        return None
    bucket = publisher.bucket
    root = getattr(bucket, "root", None)
    name = getattr(bucket, "name", None)
    client = getattr(bucket, "client", None)
    endpoint = getattr(getattr(client, "meta", None), "endpoint_url", None)
    if isinstance(root, (str, Path)):
        identity = ["local", str(Path(root).resolve())]
    elif isinstance(name, str) and isinstance(endpoint, str):
        identity = ["r2", name, endpoint]
    else:
        # UUID impede colisão com IDs de objetos reciclados ou de outro processo.
        if bucket not in _opaque_destinations:
            _opaque_destinations[bucket] = uuid4().hex
        identity = ["opaque", _opaque_destinations[bucket],
                    name if isinstance(name, str) else None,
                    endpoint if isinstance(endpoint, str) else None]
    return hashlib.sha256(encode(identity)).hexdigest()


def input_signature(collection, prior, mode, projection_enabled, projection_reason):
    # Não incluem contagens nem metadados da fonte. Todos os demais campos,
    # inclusive futuros campos desconhecidos, invalidam o cache por segurança.
    operational = {"progress", "revisions", "next_poll_seconds", "retry_at"}
    material = {key: value for key, value in collection.items() if key not in operational}
    return hashlib.sha256(encode([
        material, prior, mode, projection_enabled, projection_reason,
    ])).hexdigest()


def reusable(snapshot):
    # Uma falha transitória do modelo precisa ser tentada novamente, mesmo
    # sem mudança eleitoral. O resultado oficial continua sendo publicado.
    return "falha do modelo" not in snapshot["projection"]["reason"]
