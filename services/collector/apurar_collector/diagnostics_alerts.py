"""Alertas Telegram explícitos e deduplicados; importação não envia mensagens."""

import argparse
import fcntl
import hashlib
import json
import os
import time
import tempfile
import urllib.request
from pathlib import Path

from .diagnostics import inspect


class NoTelegramRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        raise ValueError("Redirecionamento Telegram recusado")


def deliver(token, chat, message):
    payload = json.dumps({"chat_id": chat, "text": message}).encode()
    request = urllib.request.Request(
        "https://api.telegram.org/bot" + token + "/sendMessage", data=payload,
        headers={"Content-Type": "application/json"}, method="POST")
    with urllib.request.build_opener(NoTelegramRedirect()).open(request, timeout=10) as response:
        raw = response.read(100001)
    if len(raw) > 100000:
        raise ValueError("Resposta Telegram excedeu o limite")
    value = json.loads(raw)
    if not isinstance(value, dict) or value.get("ok") is not True:
        raise ValueError("Telegram recusou a entrega")


def atomic(path, value):
    # mkstemp cria com 0600 e não segue links em nomes temporários previsíveis.
    descriptor, filename = tempfile.mkstemp(prefix=path.name + ".", suffix=".tmp", dir=path.parent)
    temporary = Path(filename)
    try:
        with os.fdopen(descriptor, "w") as output:
            json.dump(value, output, ensure_ascii=False, allow_nan=False)
            output.flush()
            os.fsync(output.fileno())
        temporary.replace(path)
    finally:
        temporary.unlink(missing_ok=True)


def notify(report, state_file, token, chat, *, clock=None, retry_seconds=60, transport=deliver):
    """Só confirma fingerprint após entrega; falha registra backoff sem marcar sucesso."""
    clock = time.time() if clock is None else clock
    path = Path(state_file)
    path.parent.mkdir(parents=True, exist_ok=True)
    if path.is_symlink():
        raise ValueError("Estado de alerta não pode ser link")
    with path.with_suffix(".lock").open("a") as lock:
        fcntl.flock(lock, fcntl.LOCK_EX)
        previous = json.loads(path.read_text()) if path.exists() else {}
        if not isinstance(previous, dict):
            raise ValueError("Estado de alerta inválido")
        destination = hashlib.sha256(str(chat).encode()).hexdigest()
        if previous.get("destination") != destination:
            previous = {}
        fingerprint = hashlib.sha256(json.dumps(
            {"ok": report["ok"], "issues": sorted(report["issues"])}, sort_keys=True).encode()).hexdigest()
        if previous.get("fingerprint") == fingerprint or (not previous.get("fingerprint") and report["ok"]):
            return {"ok": True, "sent": False, "reason": "unchanged"}
        if previous.get("retry_at", 0) > clock:
            return {"ok": False, "sent": False, "reason": "backoff"}
        message = "Apurar: recuperação confirmada pelo diagnóstico local." if report["ok"] else (
            "Apurar: atenção operacional.\n" + "\n".join(report["issues"]))
        try:
            transport(token, chat, message)
        except Exception:
            # Erros urllib podem conter URL com token: nunca serializar a exceção.
            atomic(path, {**previous, "destination": destination, "retry_at": clock + retry_seconds})
            return {"ok": False, "sent": False, "reason": "delivery_failed"}
        atomic(path, {"fingerprint": fingerprint, "destination": destination,
                      "healthy": report["ok"], "delivered_at": clock})
        return {"ok": True, "sent": True}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--state-dir", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--alert-state", type=Path, required=True)
    for name in ("max-age", "max-pending", "min-free", "max-bytes", "retry-seconds"):
        parser.add_argument("--" + name, type=int, required=True)
    args = parser.parse_args()
    if min(args.max_age, args.max_pending, args.min_free, args.max_bytes) < 0 or args.retry_seconds < 1:
        parser.error("Limites não negativos e retry positivo são obrigatórios")
    try:
        token = os.environ.get("APURAR_ALERT_TELEGRAM_TOKEN", "")
        token_file = os.environ.get("APURAR_ALERT_TELEGRAM_TOKEN_FILE")
        if not token and token_file:
            token = Path(token_file).read_text().strip()
        chat = os.environ.get("APURAR_ALERT_TELEGRAM_CHAT_ID", "")
        if not token or not chat:
            parser.error("Configure token externo e destinatário Telegram")
        report = inspect(args.state_dir, args.output, max_age=args.max_age,
                         max_pending=args.max_pending, min_free=args.min_free, max_bytes=args.max_bytes)
        result = notify(report, args.alert_state, token, chat, retry_seconds=args.retry_seconds)
    except (OSError, ValueError, TypeError, KeyError):
        result = {"ok": False, "sent": False, "reason": "diagnostic_or_state_failed"}
    print(json.dumps(result))
    return 0 if result["ok"] else 1


if __name__ == "__main__":
    raise SystemExit(main())
