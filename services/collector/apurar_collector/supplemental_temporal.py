"""Limite de relógio apenas na entrada ao vivo; arquivos mantêm seus horários."""
from .snapshot import aware_datetime


def future_timestamp(value, now):
    return value is not None and aware_datetime(value).timestamp() > now + 60


def future_payload(payload, now):
    rows = (payload.get("governors", []) + payload.get("governor_municipalities", [])
            + payload.get("exterior", {}).get("cities", [])
            + payload.get("exterior", {}).get("countries", []) + payload.get("zones", []))
    return future_timestamp(payload["updated_at"], now) or any(
        future_timestamp(row.get(field), now)
        for row in rows for field in ("as_of", "generated_at"))
