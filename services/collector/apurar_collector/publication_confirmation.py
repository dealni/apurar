"""Confirmação periódica do lote remoto sem renovar TTL a cada consulta."""

import hashlib
import json
import time

from .snapshot import aware_datetime, encode

CONFIRMATION_TTL_SECONDS = 300


class RemoteConfirmation:
    def __init__(self, clock=None):
        self.clock = clock or time.monotonic
        self.entries = {}

    @staticmethod
    def key(destinations, local, remote, pointer):
        # A assinatura persistida identifica destino; referências fortes também
        # impedem reaproveitar confirmação ao substituir cliente ou bucket.
        return (encode(destinations), local.bucket, remote.bucket,
                getattr(remote.bucket, "client", None), encode(pointer))

    def recent(self, mode, key):
        previous = self.entries.get(mode)
        if previous is not None and previous[0] == key:
            age = self.clock() - previous[1]
            if 0 <= age < CONFIRMATION_TTL_SECONDS:
                return True
        self.forget(mode)
        return False

    def remember(self, mode, key):
        self.entries[mode] = key, self.clock()

    def forget(self, mode):
        self.entries.pop(mode, None)


def remote_matches(remote, pointer, mode):
    current = remote.bucket.get(f"{mode}/6258/latest.json")
    if current != encode(pointer):
        if current is not None:
            previous = json.loads(current)
            if aware_datetime(previous["published_at"]) >= aware_datetime(pointer["published_at"]):
                raise ValueError("Geração remota divergente; verificar único escritor")
        return False
    for reference in (pointer, pointer["municipalities"], pointer["history"]):
        body = remote.bucket.get(reference["key"])
        if body is None:
            return False
        if hashlib.sha256(body).hexdigest() != reference["sha256"]:
            raise ValueError("Objeto remoto imutável divergente; publicação interrompida")
    return True
