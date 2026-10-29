"""Bootstrap local verificável; sem download nem acervo de 2022."""

import hashlib
import json
import shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / "dataset-manifest.json"


def digest(path):
    result = hashlib.sha256()
    with Path(path).open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            result.update(chunk)
    return result.hexdigest()


def read_bundle(bundle):
    import zipfile

    expected = json.loads(MANIFEST.read_text())["files"]
    names = set(expected) | {"dataset-manifest.json"}
    with zipfile.ZipFile(bundle) as archive:
        entries = archive.infolist()
        if len(entries) != len(names) or {item.filename for item in entries} != names:
            raise ValueError(
                "Bundle contém arquivos ausentes, duplicados ou inesperados"
            )
        if any(item.file_size > 4_000_000 for item in entries):
            raise ValueError("Arquivo do bundle excede limite")
        if json.loads(archive.read("dataset-manifest.json")) != json.loads(
            MANIFEST.read_bytes()
        ):
            raise ValueError("Proveniência do bundle diverge da versão revisada")
        values = {name: archive.read(name) for name in expected}
    for name, value in values.items():
        if hashlib.sha256(value).hexdigest() != expected[name]["sha256"]:
            raise ValueError("Integridade inválida no bundle: " + name)
    return values


def dataset_bytes(data_dir=None):
    # Só a ausência do argumento autoriza usar recursos incorporados.
    path = Path(data_dir) if data_dir is not None else ROOT / "data"
    if data_dir is None and not path.exists():
        return read_bundle(ROOT / "resources/runtime-data.zip")
    manifest = json.loads(MANIFEST.read_text())
    values = {name: (path / name).read_bytes() for name in manifest["files"]}
    for name, metadata in manifest["files"].items():
        if hashlib.sha256(values[name]).hexdigest() != metadata["sha256"]:
            raise ValueError("Integridade inválida: " + name)
    return values


def load(data_dir=None):
    manifest = json.loads(MANIFEST.read_text())
    if manifest["basis"] != "first-turn-2026-only":
        raise ValueError("Base incompatível")
    values = dataset_bytes(data_dir)
    prior = json.loads(values["prior_runoff2026.json"])
    registry = json.loads(values["cadastro.json"])
    if (
        prior.get("schema") != "runoff-prior-v1"
        or prior.get("basis") != manifest["basis"]
        or prior.get("candidate_ids") != ["13", "22"]
        or prior.get("target_election") != "6258"
        or prior.get("method", {}).get("historical_years") != [2026]
        or set(prior.get("units", {})) != {row["unit_id"] for row in registry}
    ):
        raise ValueError("Prior incompatível com o segundo turno de 2026")
    return registry, prior


def bootstrap(source, destination):
    source, destination = Path(source), Path(destination)
    manifest = json.loads(MANIFEST.read_text())
    if digest(source / "runoff_manifest.json") != manifest["upstream_manifest_sha256"]:
        raise ValueError(
            "Manifesto da origem mudou; revisar proveniência antes de importar"
        )
    for name, metadata in manifest["files"].items():
        if digest(source / name) != metadata["sha256"]:
            raise ValueError("Arquivo da origem diverge do manifesto: " + name)
    destination.mkdir(parents=True, exist_ok=True)
    for name in manifest["files"]:
        temporary = destination / (name + ".tmp")
        shutil.copyfile(source / name, temporary)
        temporary.replace(destination / name)
    load(destination)
    return {"files": list(manifest["files"]), "basis": manifest["basis"]}


def export_bundle(data_dir, output):
    """ZIP determinístico do mínimo de runtime; não inclui SQLite nem replay."""
    import zipfile

    load(data_dir)
    files = {"dataset-manifest.json": MANIFEST.read_bytes()}
    files.update(dataset_bytes(data_dir))
    output = Path(output)
    output.parent.mkdir(parents=True, exist_ok=True)
    temporary = output.with_suffix(output.suffix + ".tmp")
    with zipfile.ZipFile(temporary, "w", compression=zipfile.ZIP_DEFLATED) as archive:
        for name, body in sorted(files.items()):
            info = zipfile.ZipInfo(name, date_time=(2026, 10, 24, 0, 0, 0))
            info.compress_type = zipfile.ZIP_DEFLATED
            info.external_attr = 0o600 << 16
            archive.writestr(info, body)
    temporary.replace(output)
    checksum = digest(output)
    output.with_suffix(output.suffix + ".sha256").write_text(
        checksum + "  " + output.name + "\n"
    )
    return {"bundle": str(output), "sha256": checksum, "bytes": output.stat().st_size}


def import_bundle(bundle, destination):
    destination = Path(destination)
    values = read_bundle(bundle)
    destination.mkdir(parents=True, exist_ok=True)
    for name, body in values.items():
        temporary = destination / (name + ".tmp")
        temporary.write_bytes(body)
        temporary.replace(destination / name)
    load(destination)
    return {"files": sorted(values), "basis": "first-turn-2026-only"}
