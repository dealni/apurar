"""Validade temporal e satisfação das pistas municipais do EA15."""

from datetime import datetime

from .tse import _integer, _stamp, totalization_stamp


def future_result(value, now):
    return bool(value) and any(
        value.get(field) is not None
        and datetime.fromisoformat(value[field]).timestamp() > now + 60
        for field in ("generated_at", "totalized_at")
    )


def tracking_hint(entry):
    date, time = entry.get("dt") or None, entry.get("ht") or None
    counted = entry.get("s", {}).get("st")
    counted = _integer(counted) if counted not in (None, "") else None
    if date and time:
        _stamp({"dt": date, "ht": time}, "dt", "ht")
    elif time:
        datetime.strptime(time, "%H:%M:%S")
    return date, time, counted


def tracking_pending(hint, value):
    if not hint or not value:
        return False
    date, time, counted = hint
    stamp = value.get("totalized_at") or value["generated_at"]
    if time:
        # Pistas sem dia não certificam mudança de data; comparar apenas a hora.
        source = datetime.fromisoformat(stamp)
        if date:
            target = datetime.fromisoformat(totalization_stamp(
                {"dt": date, "ht": time}, value.get("scope")))
        else:
            target = datetime.fromisoformat(totalization_stamp(
                {"dt": source.strftime("%d/%m/%Y"), "ht": time}, value.get("scope")))
        if source != target:
            return source < target
        return counted is not None and _integer(counted) != value["sections_counted"]
    return counted is not None and counted != value["sections_counted"]


def future_municipalities(payload, now):
    return any(
        future_result({"totalized_at": row.get("as_of")}, now)
        for row in payload.get("items", [])
    )


def future_collection(collection, now):
    return any(future_result(row.get("result"), now)
               for row in collection.get("units", []))
