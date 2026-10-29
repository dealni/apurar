"""Confirmações remotas curtas, apenas em memória e após sucesso integral."""
import time
from collections import OrderedDict

CONFIRMATION_TTL_SECONDS = 300
MAX_CONFIRMATIONS = 32
_confirmations = OrderedDict()


def _destination(publisher):
    if publisher is None:
        return None
    bucket = publisher.bucket
    client = getattr(bucket, "client", None)
    endpoint = getattr(getattr(client, "meta", None), "endpoint_url", None)
    return (id(bucket), str(getattr(bucket, "root", "")),
            getattr(bucket, "name", None), id(client), endpoint)


def confirmation_key(state_path, local, remote, digest):
    return (str(state_path.resolve()), _destination(local),
            _destination(remote), digest)


def recently_confirmed(key):
    entry = _confirmations.get(key)
    if entry is None:
        return False
    age = time.monotonic() - entry[0]
    wall_age = time.time() - entry[1]
    if not (0 <= age < CONFIRMATION_TTL_SECONDS
            and 0 <= wall_age < CONFIRMATION_TTL_SECONDS):
        _confirmations.pop(key, None)
        return False
    _confirmations.move_to_end(key)
    return True


def forget(key):
    _confirmations.pop(key, None)


def forget_destination(key):
    for previous in tuple(_confirmations):
        if previous[0] == key[0]:
            forget(previous)


def confirm(key, local, remote):
    # Referências fortes evitam reutilizar id de um bucket destruído.
    buckets = tuple(p.bucket for p in (local, remote) if p is not None)
    _confirmations[key] = (time.monotonic(), time.time(), buckets)
    _confirmations.move_to_end(key)
    while len(_confirmations) > MAX_CONFIRMATIONS:
        _confirmations.popitem(last=False)
