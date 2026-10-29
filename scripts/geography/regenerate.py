#!/usr/bin/env python3
"""Gera a malha de apresentação do Apurar sem modificar a captura histórica."""

import argparse
import hashlib
import json
import math
from pathlib import Path
import subprocess
import tempfile
import zipfile

ROOT = Path(__file__).resolve().parents[2]
SOURCE_URL = (
    "https://geoftp.ibge.gov.br/organizacao_do_territorio/malhas_territoriais/"
    "malhas_municipais/municipio_2025/Brasil/BR_Municipios_2025.zip"
)
SOURCE_SHA256 = "840bbe6f73726ef9d1460ce49fdfe01a278935c41180d3c893e25ca21db083bd"
MAPSHAPER = "mapshaper@0.6.113"
PROJECTION = (
    "+proj=poly +lat_0=0 +lon_0=-54 +x_0=5000000 +y_0=10000000 "
    "+ellps=GRS80 +units=m +no_defs"
)
UF_ORDER = "RO AC AM RR PA AP TO MA PI CE RN PB PE AL SE BA MG ES RJ SP PR SC RS MS MT GO DF".split()
POPULATION_URL = (
    "https://servicodados.ibge.gov.br/api/v3/agregados/6579/periodos/2025/"
    "variaveis/9324?localidades=N6[5101837]"
)


def digest(data):
    return hashlib.sha256(data).hexdigest()


def write_json(path, value):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, ensure_ascii=False, separators=(",", ":")) + "\n")


def write_rows(path, rows):
    path.parent.mkdir(parents=True, exist_ok=True)
    lines = [json.dumps(row, ensure_ascii=False, separators=(",", ":")) for row in rows]
    path.write_text("[\n" + ",\n".join(lines) + "\n]\n")


def generate(archive, topology, destination):
    original = ROOT / "apps/web/src/data/generated"
    population = {}
    for file in (original / "geography/municipalities").glob("*.json"):
        for geometry in json.loads(file.read_text()):
            population[geometry["properties"]["id"]] = geometry["properties"]["p"]
    population["5101837"] = 5877
    expected = json.loads((ROOT / "apps/web/src/integration/municipality-ids.json").read_text())
    geometries = topology["objects"]["municipios"]["geometries"]
    ids = [geometry["properties"]["CD_MUN"] for geometry in geometries]
    if len(ids) != len(set(ids)) or set(ids) != set(expected):
        raise ValueError("A malha deve corresponder exatamente às 5.571 localidades IBGE/TSE.")
    groups = {uf: [] for uf in UF_ORDER}
    for geometry in geometries:
        props = geometry["properties"]
        code = props["CD_MUN"]
        geometry["properties"] = {
            "id": code, "n": props["NM_MUN"], "uf": props["SIGLA_UF"], "p": population[code]
        }
        groups[props["SIGLA_UF"]].append(geometry)
    for uf, rows in groups.items():
        write_rows(destination / f"geography/municipalities/{uf.lower()}.json", sorted(rows, key=lambda row: row["properties"]["id"]))
    # Mantém os 33 imports síncronos da referência, sem alterar seus consumidores.
    chunk_size = math.ceil(len(topology["arcs"]) / 33)
    for index in range(33):
        write_rows(destination / f"geography/arcs/arcos{index + 1:02}.json", topology["arcs"][index * chunk_size:(index + 1) * chunk_size])
    write_json(destination / "geography/brasil.json", {"type": "Topology", "transform": topology["transform"]})
    write_json(destination / "geography/municipios.json", {"type": "GeometryCollection"})
    module = (original / "geography.js").read_text()
    module = module.replace("/** Dados públicos preservados. Os JSONs são editáveis; imports estáticos mantêm a inicialização síncrona. */", "/** Malha IBGE 2025 derivada para apresentação. Procedência em provenance.json. */")
    module = module.replace("'./geography/mundo.json'", "'../generated/geography/mundo.json'")
    (destination / "geography.js").write_text(module)
    files = sorted(path for path in destination.rglob("*") if path.is_file() and path.name != "provenance.json")
    manifest = {
        "schema_version": 1, "source": SOURCE_URL, "source_sha256": digest(archive.read_bytes()),
        "reference_year": 2025, "retrieved_at": "2026-10-24", "source_units": 5573,
        "excluded_operational_water_units": {"4300001": "Lagoa Mirim", "4300002": "Lagoa dos Patos"},
        "municipalities_and_equivalents": len(ids), "arcs": len(topology["arcs"]),
        "points": sum(map(len, topology["arcs"])), "projection": PROJECTION,
        "processing": {"tool": MAPSHAPER, "simplification": "weighted interval=600 keep-shapes", "clean": True, "quantization": 1000000, "arc_chunks": 33},
        "population": {"existing": "Valores preservados da captura acervo público de terceiros; não são eleitorado e não foram atualizados para 2025.", "5101837": {"value": 5877, "year": 2025, "source": POPULATION_URL}},
        "limitations": "Geometria oficial simplificada e limpa para apresentação; não serve a medições cadastrais. Não inclui as duas áreas operacionais sem município/eleitorado.",
        "files": [{"path": str(path.relative_to(destination)), "bytes": path.stat().st_size, "sha256": digest(path.read_bytes())} for path in files],
    }
    write_json(destination / "provenance.json", manifest)
    print(f"Malha gerada: {len(ids)} localidades, {len(topology['arcs'])} arcos.")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("archive", type=Path, help="BR_Municipios_2025.zip oficial, obtido separadamente")
    args = parser.parse_args()
    if digest(args.archive.read_bytes()) != SOURCE_SHA256:
        raise ValueError("O ZIP diverge do SHA-256 capturado e retido para revisão; revise a fonte antes de atualizar.")
    destination = ROOT / "apps/web/src/data/official-geography-2025"
    with tempfile.TemporaryDirectory(prefix="apurar-malha-") as temporary:
        directory = Path(temporary)
        with zipfile.ZipFile(args.archive) as source:
            source.extractall(directory)
        topology_file = directory / "municipios.topojson"
        subprocess.run([
            "npm", "exec", "--yes", "--package=" + MAPSHAPER, "--", "mapshaper",
            str(directory / "BR_Municipios_2025.shp"), "-filter",
            'CD_MUN !== "4300001" && CD_MUN !== "4300002"', "-proj", PROJECTION,
            "-simplify", "weighted", "interval=600", "keep-shapes", "-clean",
            "-filter-fields", "CD_MUN,NM_MUN,SIGLA_UF", "-rename-layers", "municipios",
            "-o", str(topology_file), "format=topojson", "quantization=1000000",
        ], check=True, cwd=directory)
        generate(args.archive, json.loads(topology_file.read_text()), destination)


if __name__ == "__main__":
    main()
