"""Cadência única: filas adicionais usam ociosidade sem abreviar bloqueios."""
from .core.config import TIMING


def next_delay(status):
    delay = max(TIMING["collectingSeconds"],
                status.get("next_poll_seconds", TIMING["liveSeconds"]))
    supplemental = status.get("supplemental") or {}
    delay = max(delay, supplemental.get("backoff_seconds", 0))
    if (status.get("status") not in ("backoff", "error", "invalid", "awaiting")
            and not status.get("retry_at", 0)
            and not supplemental.get("backoff_seconds", 0)):
        if supplemental.get("status") == "ok":
            supplemental_delay = supplemental.get("next_poll_seconds")
            if supplemental_delay is None and supplemental.get("pending", 0) > 0:
                supplemental_delay = TIMING["collectingSeconds"]
            if supplemental_delay is not None:
                return max(TIMING["collectingSeconds"], min(delay, supplemental_delay))
        elif supplemental.get("status") == "error":
            return min(delay, TIMING["liveSeconds"])
    return delay
