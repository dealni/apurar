"""Plano somente leitura de retenção local; não exclui nem acessa o R2."""

import argparse
import sqlite3
from contextlib import closing
import json
import time
from pathlib import Path


def referenced(pointer):
    if not pointer:
        return set()
    return {pointer["key"], pointer["municipalities"]["key"], pointer["history"]["key"]}


def plan(state_dir, output, *, retain_days=7, current_time=None):
    if retain_days < 7:
        raise ValueError("Retenção mínima local de sete dias")
    output = Path(output).resolve()
    keep = set()
    for mode in ("demo", "live"):
        latest = output / mode / "6258/latest.json"
        if latest.exists():
            keep.update(referenced(json.loads(latest.read_text())))
        receipt = Path(state_dir) / f"publication-{mode}.json"
        if receipt.exists():
            value = json.loads(receipt.read_text())
            keep.update(referenced(value["pointer"]))
            keep.update(referenced(value.get("previous_pointer")))
    for name in ("supplemental-latest.json", "archive-latest.json"):
        pointer = output / "live/6258" / name
        if pointer.exists():
            keep.add(json.loads(pointer.read_text())["key"])
    archive = Path(state_dir).resolve() / "publication-archive.sqlite3"
    if archive.exists():
        with closing(sqlite3.connect(archive.as_uri() + "?mode=ro", uri=True)) as connection:
            for (body,) in connection.execute("SELECT body FROM publications"):
                entry = json.loads(body)
                pointer = entry["pointer"]
                if entry["family"] == "core":
                    keep.update(referenced(pointer))
                else:
                    keep.add(pointer["key"])
    # Índices já públicos podem estar em cache ou referenciados por visitantes.
    keep.update(path.relative_to(output).as_posix() for path in (output / "live/6258/archive").glob("*.json"))
    cutoff = (time.time() if current_time is None else current_time) - retain_days * 86400
    candidates = []
    for mode in ("demo", "live"):
        for kind in ("snapshots", "municipalities", "history", "supplemental"):
            for path in sorted((output / mode / "6258" / kind).glob("*.json")):
                if path.is_symlink() or not path.is_file():
                    continue
                key = path.relative_to(output).as_posix()
                if key not in keep and path.stat().st_mtime < cutoff:
                    candidates.append({"key": key, "bytes": path.stat().st_size})
    return {
        "mode": "plan-only", "output": str(output), "retain_days": retain_days,
        "protected_keys": sorted(keep), "candidates": candidates,
        "candidate_bytes": sum(item["bytes"] for item in candidates),
        "preserved": ["raw", "SQLite integral", "ponteiro atual e lote anterior", "referências integrais do arquivo", "índices públicos", "R2"],
    }


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--state-dir", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--retain-days", type=int, default=7)
    args = parser.parse_args()
    print(json.dumps(plan(args.state_dir, args.output, retain_days=args.retain_days), indent=2))


if __name__ == "__main__":
    main()
