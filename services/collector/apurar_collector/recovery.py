"""Ensaio de restauração temporária isolada, sem rede ou publicação."""

import argparse
from contextlib import closing
import hashlib
import json
import re
import shutil
import sqlite3
import tempfile
from pathlib import Path

from .publisher import LocalBucket
from .diagnostics import instant
from .recovery_archive import verify_archive


def copy_state(source, target):
    target.mkdir()
    databases = []
    for path in source.rglob("*"):
        if path.is_symlink():
            raise ValueError("Restore recusa links simbólicos")
        if not path.is_file() or path.name.endswith(("-wal", "-shm", ".lock")):
            continue
        destination = target / path.relative_to(source)
        destination.parent.mkdir(parents=True, exist_ok=True)
        if path.suffix == ".sqlite3":
            with closing(sqlite3.connect(path.as_uri() + "?mode=ro", uri=True)) as original:
                restored = sqlite3.connect(destination)
                try:
                    original.backup(restored)
                    if restored.execute("PRAGMA integrity_check").fetchone()[0] != "ok":
                        raise ValueError("SQLite restaurado inconsistente")
                    tables = restored.execute(
                        "SELECT name FROM sqlite_master WHERE type='table'"
                    ).fetchall()
                    counts = {}
                    for (table,) in tables:
                        quoted = '"' + table.replace('"', '""') + '"'
                        counts[table] = restored.execute("SELECT count(*) FROM " + quoted).fetchone()[0]
                    databases.append({"file": str(path.relative_to(source)), "rows": counts})
                finally:
                    restored.close()
        else:
            shutil.copyfile(path, destination)
    return databases


def verify_supplemental(bucket, mode):
    pointer_body = bucket.get(f"{mode}/6258/supplemental-latest.json")
    if pointer_body is None:
        if any((bucket.root / mode / "6258" / "supplemental").glob("*.json")):
            raise ValueError("Objetos suplementares sem ponteiro; restauração incompleta")
        return None, None
    pointer = json.loads(pointer_body)
    if not isinstance(pointer, dict) or pointer.get("schema_version") != 1:
        raise ValueError("Ponteiro suplementar inválido")
    sha = pointer.get("sha256", "")
    if not isinstance(sha, str) or not re.fullmatch(r"[a-f0-9]{64}", sha):
        raise ValueError("SHA suplementar inválido")
    if pointer.get("key") != f"{mode}/6258/supplemental/{sha}.json":
        raise ValueError("Chave suplementar inválida")
    instant(pointer["updated_at"])
    body = bucket.get(pointer["key"])
    if body is None or hashlib.sha256(body).hexdigest() != sha:
        raise ValueError("Objeto suplementar ausente ou corrompido")
    value = json.loads(body)
    if (value.get("schema_version") != 1 or value.get("election") != "6258"
            or value.get("mode") != mode or value.get("updated_at") != pointer["updated_at"]):
        raise ValueError("Objeto e ponteiro suplementar incompatíveis")
    return pointer, {"key": pointer["key"], "sha256": sha, "bytes": len(body)}


def verify_bundle(output, mode):
    if mode not in ("live", "demo"):
        raise ValueError("Modo de restauração inválido")
    bucket = LocalBucket(output)
    pointer = json.loads(bucket.get(f"{mode}/6258/latest.json") or b"null")
    if not isinstance(pointer, dict):
        raise ValueError("Ponteiro ausente")
    if pointer.get("schema_version") != 1:
        raise ValueError("Ponteiro presidencial inválido")
    instant(pointer["published_at"])
    objects = []
    for kind, reference in (("snapshots", pointer),
                            ("municipalities", pointer["municipalities"]),
                            ("history", pointer["history"])):
        sha = reference["sha256"]
        if (not isinstance(sha, str) or not re.fullmatch(r"[a-f0-9]{64}", sha)
                or reference["key"] != f"{mode}/6258/{kind}/{sha}.json"):
            raise ValueError("Referência de bundle incompatível com modo ou família")
        body = bucket.get(reference["key"])
        if body is None or hashlib.sha256(body).hexdigest() != reference["sha256"]:
            raise ValueError("Bundle ausente ou SHA-256 incompatível")
        value = json.loads(body)
        if value.get("schema_version") != 1:
            raise ValueError("Envelope de bundle incompatível")
        if value["snapshot_id"] != pointer["snapshot_id"]:
            raise ValueError("Mistura de versões no bundle")
        if kind == "snapshots":
            if (value.get("mode") != mode
                    or value.get("election") != {"id": "6258", "year": 2026,
                                                  "round": 2, "office": "Presidente"}
                    or value.get("published_at") != pointer["published_at"]):
                raise ValueError("Proveniência presidencial incompatível")
        elif value.get("election") != "6258":
            raise ValueError("Envelope de bundle incompatível")
        objects.append({"key": reference["key"], "sha256": reference["sha256"], "bytes": len(body)})
    _, supplemental = verify_supplemental(bucket, mode)
    if supplemental is not None:
        objects.append(supplemental)
    return pointer, objects


def rehearse(state, output, *, mode="live"):
    state, output = Path(state).resolve(), Path(output).resolve()
    original, original_objects = verify_bundle(output, mode)
    if any(p.is_symlink() for p in output.rglob("*")):
        raise ValueError("Restore recusa links simbólicos")
    with tempfile.TemporaryDirectory(prefix="apurar-restore-") as temporary:
        root = Path(temporary)
        databases = copy_state(state, root / "state")
        shutil.copytree(output, root / "public")
        pointer, objects = verify_bundle(root / "public", mode)
        receipt = json.loads((root / "state" / f"publication-{mode}.json").read_text())
        if pointer != original or objects != original_objects or receipt["pointer"] != pointer:
            raise ValueError("Recibo e ponteiro divergentes; use cópia com escritor parado")
        snapshot = json.loads(LocalBucket(root / "public").get(pointer["key"]))
        if snapshot != json.loads((root / "state" / f"snapshot-{mode}.json").read_text()):
            raise ValueError("Estado e bundle divergentes")
        supplemental, _ = verify_supplemental(LocalBucket(root / "public"), mode)
        supplemental_receipt = root / "state" / "supplemental-publication.json"
        if mode == "live" and supplemental_receipt.exists():
            expected = json.loads(supplemental_receipt.read_text())["pointer"]
            if supplemental != expected:
                raise ValueError("Recibo e ponteiro suplementares divergentes ou ausentes")
        archive = verify_archive(LocalBucket(root / "public"), root / "state") if mode == "live" else {"public_index": False, "integral_references": False}
        return {"ok": True, "isolated": True, "network_used": False,
                "mode": mode, "snapshot_id": pointer["snapshot_id"],
                "databases": databases, "objects": objects,
                "capabilities": {"presidential_bundle": True, "supplemental_bundle": supplemental is not None,
                                 "archive_index": archive["public_index"], "archive_integral": archive["integral_references"]},
                "archive": archive,
                "limit": "Ensaio local; não comprova backup remoto nem retomada do TSE/R2."}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--state-dir", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--mode", choices=("live", "demo"), default="live")
    args = parser.parse_args()
    try:
        result = rehearse(args.state_dir, args.output, mode=args.mode)
    except (OSError, ValueError, KeyError, TypeError, sqlite3.Error) as error:
        result = {"ok": False, "error": str(error)}
    print(json.dumps(result, ensure_ascii=False))
    return 0 if result["ok"] else 1


if __name__ == "__main__":
    raise SystemExit(main())
