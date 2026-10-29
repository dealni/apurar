"""Saúde operacional separada dos snapshots eleitorais e de seus horários."""

import json
import logging
import math
import re
from datetime import datetime, timezone

from .runtime import atomic
from .snapshot import now, encode


def _timestamp(value):
    if isinstance(value, bool) or not isinstance(value, (int, float)):
        return None
    try:
        return datetime.fromtimestamp(value, timezone.utc).isoformat() if value > 0 else None
    except (ValueError, OverflowError, OSError):
        return None


def _saved_timestamp(value):
    if value is None:
        return True
    if not isinstance(value, str) or not re.fullmatch(
        r"\d{4}-\d{2}-\d{2}T(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d(?:\.\d+)?(?:Z|[+-](?:[01]\d|2[0-3]):[0-5]\d)", value
    ):
        return False
    try:
        return datetime.fromisoformat(value).utcoffset() is not None
    except ValueError:
        return False


def _count(value):
    return type(value) is int and 0 <= value <= 9007199254740991


def _valid_supplemental(value):
    return (isinstance(value, dict) and value.get("status") in ("ok", "error")
            and all(_count(value.get(key)) for key in ("pending", "errors", "zones_pending"))
            and _saved_timestamp(value.get("last_updated_at")))


def _valid_previous(value):
    if not isinstance(value, dict) or value.get("schema_version") != 1 or value.get("election") != "6258":
        return False
    if not all(_saved_timestamp(value.get(key)) for key in ("last_success_at", "last_tracking_success_at")):
        return False
    if not _count(value.get("pending_units", 0)):
        return False
    states = value.get("tracking_failed_states", [])
    if not isinstance(states, list) or any(not isinstance(uf, str) or not re.fullmatch(r"[a-z]{2}", uf) for uf in states):
        return False
    supplemental = value.get("supplemental")
    if supplemental is None:
        return "supplemental" not in value
    return _valid_supplemental(supplemental)


def _previous(runtime):
    try:
        value = json.loads((runtime.state_dir / "health-live.json").read_text())
        if _valid_previous(value):
            return value
    except (OSError, ValueError):
        pass
    return {}


def report(runtime, status, duration, *, failed=False):
    progress = status.get("progress", {})
    previous = _previous(runtime)
    value = {
        "schema_version": 1,
        "election": "6258",
        "checked_at": now(),
        "last_success_at": _timestamp(progress.get("last_success")) or previous.get("last_success_at"),
        "status": "error" if failed else status.get("status", "publishing"),
        "cycle_seconds": round(max(0, duration), 3) if math.isfinite(duration) else 0,
        "pending_units": progress.get("units_pending", previous.get("pending_units", 0)),
        "tracking_failed_states": progress.get("tracking_failed_states", previous.get("tracking_failed_states", [])),
        "last_tracking_success_at": _timestamp(progress.get("last_tracking_success")) or previous.get("last_tracking_success_at"),
    }
    supplemental = status.get("supplemental", previous.get("supplemental"))
    if supplemental is not None:
        value["supplemental"] = supplemental
    # Falha em um destino não impede o heartbeat nos demais.
    destinations = [
        lambda: atomic(runtime.state_dir / "health-live.json", value),
        lambda: runtime.local.bucket.put("live/6258/health.json", encode(value), "no-store"),
    ]
    if runtime.remote:
        destinations.append(lambda: runtime.remote.bucket.put("live/6258/health.json", encode(value), "no-store"))
    for publish in destinations:
        try:
            publish()
        except Exception as exc:
            logging.warning("Falha ao publicar saúde (%s)", type(exc).__name__)
    logging.info(
        "Ciclo: status=%s duração=%.3fs pendentes=%s",
        value["status"], duration, value["pending_units"],
    )
