"""Monitor Cloudflare opcional; importação não consulta APIs nem envia Telegram."""

import argparse
import fcntl
import hashlib
import json
import math
import os
import time
from pathlib import Path

from .consumption_analytics import AnalyticsUnavailable, read_analytics, window_end
from .consumption_rules import DEFAULTS, conditions, message
from .diagnostics_alerts import atomic, deliver


def dispatch(state, token, chat, now, transport, persist):
    sent = 0
    for key in sorted(state.get("pending", {})):
        item = state["pending"][key]
        # Uma recuperação pendente exige telemetria atualmente válida, inclusive
        # a recuperação do próprio Analytics. Não confirmar normalização no escuro.
        if not item["active"] and not state.get("valid", False):
            continue
        # Um retry criado com comparação válida não pode confirmar crescimento
        # ou sua recuperação depois que a base anterior ficou indeterminada.
        if key == "growth" and not state.get("growth_valid", False):
            continue
        if item.get("retry_at", 0) > now:
            continue
        try:
            transport(token, chat, item["message"])
        except Exception:
            item["retry_at"] = now + 60
            persist()
            continue
        state.setdefault("delivered", {})[key] = item["active"]
        del state["pending"][key]
        persist()
        sent += 1
    return sent


def queue(state, desired, sample, end):
    previous = set(state.get("active", []))
    delivered = state.get("delivered", {})
    pending = state.setdefault("pending", {})
    for key in previous | desired | set(delivered):
        active = key in desired
        if delivered.get(key, False) == active:
            pending.pop(key, None)
        elif key not in pending or pending[key]["active"] != active:
            pending[key] = {"active": active, "message": message(key, active, sample, end)}
    state["active"] = sorted(desired)


def run(state_file, token, chat, analytics_token, account, script="apurar", bucket="apurar-snapshots",
        *, now=None, limits=None, reader=read_analytics, transport=deliver):
    now = time.time() if now is None else now
    limits = dict(DEFAULTS if limits is None else limits)
    scope = hashlib.sha256(json.dumps([account, script, bucket, limits, str(chat)], sort_keys=True).encode()).hexdigest()
    path = Path(state_file)
    path.parent.mkdir(parents=True, exist_ok=True)
    if path.is_symlink():
        raise ValueError("Estado não pode ser link")
    with path.with_suffix(".lock").open("a") as lock:
        fcntl.flock(lock, fcntl.LOCK_EX)
        state = json.loads(path.read_text()) if path.exists() else {}
        if not isinstance(state, dict):
            raise ValueError("Estado de consumo inválido")
        if state.get("scope") != scope:
            state = {"scope": scope}
        last = state.get("polled_at")
        queried = last is None or now < last or now - last >= 300
        if queried:
            state["polled_at"] = now
            end = window_end(now)
            try:
                sample = reader(analytics_token, account, script, bucket, end)
                active = conditions(sample, state.get("active", []), limits)
                queue(state, active, sample, end)
                state["failures"] = 0
                state["valid"] = True
                state["growth_valid"] = sample["previous"] is not None
                state.pop("analytics_reason", None)
            except Exception as error:
                state["failures"] = state.get("failures", 0) + 1
                state["valid"] = False
                state["growth_valid"] = False
                state["analytics_reason"] = error.reason if isinstance(error, AnalyticsUnavailable) else "unexpected_error"
                if state["failures"] >= 3:
                    queue(state, set(state.get("active", [])) | {"analytics"}, None, end)
            # Persistir a tentativa antes de enviar: reinício/falha não repete GraphQL.
            atomic(path, state)
        sent = dispatch(state, token, chat, now, transport, lambda: atomic(path, state))
        atomic(path, state)
        return {"ok": state.get("valid", False) and not state.get("pending"), "sent": sent,
                "queried": queried, "pending": len(state.get("pending", {})), "analytics_valid": state.get("valid", False),
                "growth_valid": state.get("growth_valid", False), "analytics_reason": state.get("analytics_reason")}


def environment_secret(name):
    value = os.environ.get(name, "")
    filename = os.environ.get(name + "_FILE")
    return value or (Path(filename).read_text().strip() if filename else "")


def arguments():
    parser = argparse.ArgumentParser(description=__doc__, epilog="Duas janelas de 10 min, atraso mínimo 5 min; consulta no máximo a cada 5 min, retry Telegram 60s; três falhas Analytics geram aviso. Valores de custo são estimativas brutas, sem franquias.")
    parser.add_argument("--state", type=Path, required=True)
    parser.add_argument("--script", default=os.environ.get("APURAR_USAGE_SCRIPT", "apurar"))
    parser.add_argument("--bucket", default=os.environ.get("APURAR_USAGE_BUCKET", "apurar-snapshots"))
    descriptions = {"requests": "consultas Worker/10 min", "cpu_ms": "CPU ms/10 min", "r2_requests": "operações R2/10 min",
                    "usd_hour": "US$/hora bruto estimado", "growth_ratio": "multiplicador de crescimento", "growth_min": "consultas mínimas para crescimento", "recovery_ratio": "fração do limite para normalizar (histerese)"}
    for key, default in DEFAULTS.items():
        parser.add_argument("--" + key.replace("_", "-"), type=float,
                            default=os.environ.get("APURAR_USAGE_" + key.upper(), default),
                            help=f"{descriptions[key]}; padrão {default}")
    args = parser.parse_args()
    limits = {key: getattr(args, key) for key in DEFAULTS}
    if any(not math.isfinite(value) or value <= 0 for value in limits.values()) or not 0 < limits["recovery_ratio"] < 1 or limits["growth_ratio"] <= 1:
        parser.error("Limites positivos finitos; recovery-ratio entre 0 e 1; growth-ratio maior que 1")
    return parser, args, limits


def main():
    parser, args, limits = arguments()
    try:
        token = environment_secret("APURAR_ALERT_TELEGRAM_TOKEN")
        analytics_token = environment_secret("APURAR_USAGE_API_TOKEN")
        chat = os.environ.get("APURAR_ALERT_TELEGRAM_CHAT_ID", "")
        account = os.environ.get("APURAR_USAGE_ACCOUNT_ID", "")
        if not all((token, analytics_token, chat, account, args.script, args.bucket)):
            parser.error("Configure credenciais externas, conta, Worker, bucket e destinatário")
        result = run(args.state, token, chat, analytics_token, account, args.script, args.bucket, limits=limits)
    except (OSError, ValueError, TypeError, KeyError):
        result = {"ok": False, "reason": "configuration_or_state_failed"}
    print(json.dumps(result))
    return 0 if result["ok"] else 1


if __name__ == "__main__":
    raise SystemExit(main())
