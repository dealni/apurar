"""Suplemento com geração própria: falha nunca impede o placar presidencial."""
import hashlib
import json
import time
from pathlib import Path

from .publisher import MAX_OBJECT_BYTES
from .publication_archive import archive_confirmed
from .runtime import atomic
from .snapshot import aware_datetime, encode
from .supplemental_temporal import future_payload, future_timestamp


def source_as_of(payload):
    rows = (payload.get("governors", []) + payload.get("governor_municipalities", [])
            + payload.get("exterior", {}).get("cities", []) + payload.get("zones", []))
    stamps = [row["as_of"] for row in rows if row.get("as_of")]
    return min(stamps, key=aware_datetime) if stamps else None



class SupplementalPublication:
    def __init__(self, state_dir, local, remote=None, clock=time.time):
        self.path = Path(state_dir) / "supplemental-publication.json"
        self.local, self.remote = local, remote
        self.clock = clock

    def publish(self, payload):
        if payload.get("mode") != "live" or payload.get("election") != "6258":
            raise ValueError("Suplemento exige fonte oficial ao vivo")
        now = self.clock()
        if future_payload(payload, now):
            raise ValueError("Horário suplementar futuro")
        source_stamp = source_as_of(payload)
        material = {key: value for key, value in payload.items() if key != "updated_at"}
        signature = hashlib.sha256(encode(material)).hexdigest()
        receipt = json.loads(self.path.read_text()) if self.path.exists() else None
        aware_datetime(payload["updated_at"])
        body = encode(payload)
        # Reutilização conserva o horário e os bytes da geração confirmada, mas
        # verifica o conteúdo local e o destino remoto atual em todo ciclo.
        if receipt and receipt.get("signature") == signature:
            candidate = receipt["pointer"]
            previous_body = self.local.bucket.get(candidate["key"])
            if previous_body is not None:
                if hashlib.sha256(previous_body).hexdigest() != candidate["sha256"]:
                    raise ValueError("Objeto suplementar divergente")
                previous_payload = json.loads(previous_body)
                previous_material = {key: value for key, value in previous_payload.items()
                                     if key != "updated_at"}
                if hashlib.sha256(encode(previous_material)).hexdigest() != signature:
                    raise ValueError("Recibo suplementar incompatível")
                if not future_payload(previous_payload, now):
                    body = previous_body
        if len(body) > MAX_OBJECT_BYTES:
            raise ValueError("Suplemento excede limite de publicação")
        published = json.loads(body)
        sha = hashlib.sha256(body).hexdigest()
        key = f"live/6258/supplemental/{sha}.json"
        pointer = {"schema_version": 1, "key": key, "sha256": sha,
                   "updated_at": published["updated_at"]}
        destinations = [publisher for publisher in (self.local, self.remote)
                        if publisher is not None]
        pointer_key = "live/6258/supplemental-latest.json"
        # Recusa regressão antes de escrever em qualquer destino.
        for publisher in destinations:
            previous_pointer = publisher.bucket.get(pointer_key)
            if previous_pointer:
                previous_stamp = json.loads(previous_pointer)["updated_at"]
                if (not future_timestamp(previous_stamp, now)
                        and aware_datetime(previous_stamp) > aware_datetime(pointer["updated_at"])):
                    raise ValueError("Publicação suplementar anterior ao ponteiro atual")
        # Todos os objetos ficam confirmados antes de mover o primeiro ponteiro.
        for publisher in destinations:
            previous = publisher.bucket.get(key)
            if previous is not None and previous != body:
                raise ValueError("Objeto suplementar divergente")
            if previous is None:
                publisher.bucket.put(key, body, "public, max-age=31536000, immutable")
            if publisher.bucket.get(key) != body:
                raise ValueError("Verificação suplementar falhou")
        pointer_body = encode(pointer)
        for publisher in destinations:
            if publisher.bucket.get(pointer_key) != pointer_body:
                publisher.bucket.put(pointer_key, pointer_body, "no-store")
            if publisher.bucket.get(pointer_key) != pointer_body:
                raise ValueError("Ponteiro suplementar não confirmado")
        atomic(self.path, {"signature": signature, "remote": bool(self.remote), "pointer": pointer})
        archive_confirmed(self.path.parent, self.local, self.remote, "supplemental",
                          pointer, source_stamp)
        return pointer
