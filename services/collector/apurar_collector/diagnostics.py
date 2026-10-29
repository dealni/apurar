"""Diagnóstico somente leitura, JSON e exit code para supervisores locais."""

import argparse
import json
import re
import shutil
from datetime import datetime, timezone
from pathlib import Path


def instant(value):
    if not isinstance(value, str) or not re.fullmatch(
        r"\d{4}-\d{2}-\d{2}T(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d(?:\.\d+)?(?:Z|[+-](?:[01]\d|2[0-3]):[0-5]\d)", value
    ):
        raise ValueError("Horário inválido")
    stamp = datetime.fromisoformat(value.replace("Z", "+00:00"))
    if stamp.tzinfo is None:
        raise ValueError("Horário sem fuso")
    return stamp.timestamp()


def inspect_supplemental(value, max_pending, issues, metrics):
    if not isinstance(value, dict) or value.get("status") not in ("ok", "error", "disabled"):
        raise ValueError("Saúde suplementar inválida")
    counts = [value.get(key, 0) for key in ("pending", "errors")]
    if any(isinstance(count, bool) or not isinstance(count, int) or count < 0 for count in counts):
        raise ValueError("Contagem suplementar inválida")
    metrics["supplemental"] = value
    if value["status"] == "error" or counts[1] > 0:
        issues.append("Falha na coleta suplementar de governadores/exterior")
    if counts[0] > max_pending:
        issues.append("Fila suplementar acima do limite")


def inspect(state, output, *, max_age, max_pending, min_free, max_bytes, clock=None):
    clock = datetime.now(timezone.utc).timestamp() if clock is None else clock
    issues, metrics = [], {}
    roots = [Path(state), Path(output)]
    if any(not root.is_dir() for root in roots):
        return {"ok": False, "issues": ["Diretório operacional ausente"], "metrics": {}}
    try:
        health = json.loads((roots[0] / "health-live.json").read_text())
        if (not isinstance(health, dict) or type(health.get("schema_version")) is not int
                or health["schema_version"] != 1 or health.get("election") != "6258"):
            raise ValueError("Saúde inválida")
        age = clock - instant(health["checked_at"])
        success_age = (None if health["status"] == "awaiting"
                       and health.get("last_success_at") is None
                       else clock - instant(health["last_success_at"]))
        pending = health["pending_units"]
        if isinstance(pending, bool) or not isinstance(pending, int) or pending < 0:
            raise ValueError("Fila inválida")
        metrics.update(health_age_seconds=age, success_age_seconds=success_age,
                       pending_units=pending, status=health["status"])
        ages = [age] if success_age is None else [age, success_age]
        if min(ages) < -30 or max(ages) > max_age:
            issues.append("Saúde/consulta nacional antiga ou relógio divergente")
        if pending > max_pending:
            issues.append("Fila municipal acima do limite")
        if health["status"] not in ("live", "collecting", "finished", "awaiting", "publishing"):
            issues.append("Estado de coleta requer atenção")
        supplemental = health.get("supplemental")
        if supplemental is not None:
            inspect_supplemental(supplemental, max_pending, issues, metrics)
        if health.get("tracking_failed_states"):
            issues.append("Falha parcial no acompanhamento de UFs")
        archive_status = roots[0] / "archive-status.json"
        if archive_status.exists():
            archive = json.loads(archive_status.read_text())
            if not isinstance(archive, dict):
                raise ValueError("Estado do arquivo inválido")
            metrics["archive_status"] = archive.get("status")
            if archive.get("status") != "ok":
                issues.append("Falha no arquivo integral de publicações")
        if (roots[0] / "pending-live.json").exists():
            issues.append("Publicação remota pendente")
    except (OSError, ValueError, KeyError, TypeError):
        issues.append("Saúde ausente ou inválida")
    sizes, free = [], []
    try:
        for root in roots:
            paths = list(root.rglob("*"))
            if any(path.is_symlink() for path in paths):
                issues.append("Link simbólico no acervo; tamanho não confiável")
            sizes.append(sum(p.stat().st_size for p in paths if p.is_file() and not p.is_symlink()))
            free.append(shutil.disk_usage(root).free)
    except OSError:
        # O monitor de alertas precisa receber a falha como diagnóstico para
        # avisar; propagar impediria notify e esconderia justamente o erro de disco.
        issues.append("Falha de leitura do acervo/disco")
        return {"ok": False, "issues": issues, "metrics": metrics}
    metrics.update(state_bytes=sizes[0], output_bytes=sizes[1], min_disk_free_bytes=min(free))
    if sum(sizes) > max_bytes:
        issues.append("Acervo acima do limite")
    if min(free) < min_free:
        issues.append("Espaço livre abaixo do limite")
    return {"ok": not issues, "issues": issues, "metrics": metrics}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--state-dir", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    for option in ("max-age", "max-pending", "min-free", "max-bytes"):
        parser.add_argument("--" + option, type=int, required=True)
    args = parser.parse_args()
    if min(args.max_age, args.max_pending, args.min_free, args.max_bytes) < 0:
        parser.error("Limites devem ser não negativos")
    try:
        result = inspect(args.state_dir, args.output, max_age=args.max_age,
                         max_pending=args.max_pending, min_free=args.min_free, max_bytes=args.max_bytes)
    except OSError:
        result = {"ok": False, "issues": ["Falha de leitura do acervo/disco"], "metrics": {}}
    print(json.dumps(result, ensure_ascii=False))
    return 0 if result["ok"] else 1


if __name__ == "__main__":
    raise SystemExit(main())
