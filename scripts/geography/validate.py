#!/usr/bin/env python3
"""Valida polígonos emitidos com Shapely/GEOS, incluindo autointerseções."""

import json
from pathlib import Path

from shapely.geometry import MultiPolygon, Polygon
from shapely.validation import explain_validity

ROOT = Path(__file__).resolve().parents[2]
DATA = ROOT / "apps/web/src/data/official-geography-2025/geography"


def decode_arcs():
    transform = json.loads((DATA / "brasil.json").read_text())["transform"]
    encoded = []
    for path in sorted((DATA / "arcs").glob("*.json")):
        encoded.extend(json.loads(path.read_text()))
    arcs = []
    for arc in encoded:
        x = y = 0
        points = []
        for dx, dy in arc:
            x += dx
            y += dy
            points.append((
                x * transform["scale"][0] + transform["translate"][0],
                y * transform["scale"][1] + transform["translate"][1],
            ))
        arcs.append(points)
    return arcs


def decode_ring(indices, arcs):
    points = []
    for index in indices:
        piece = arcs[index] if index >= 0 else arcs[~index][::-1]
        points.extend(piece if not points else piece[1:])
    return points


def validate_geometry(geometry, arcs):
    parts = geometry["arcs"] if geometry["type"] == "MultiPolygon" else [geometry["arcs"]]
    polygons = [Polygon(
        decode_ring(part[0], arcs),
        [decode_ring(hole, arcs) for hole in part[1:]],
    ) for part in parts]
    shape = MultiPolygon(polygons) if geometry["type"] == "MultiPolygon" else polygons[0]
    if shape.is_empty or shape.area <= 0 or not shape.is_valid:
        return {"id": geometry["properties"]["id"], "reason": explain_validity(shape)}
    return None


def main():
    arcs = decode_arcs()
    geometries = []
    for path in sorted((DATA / "municipalities").glob("*.json")):
        geometries.extend(json.loads(path.read_text()))
    expected = json.loads((ROOT / "apps/web/src/integration/municipality-ids.json").read_text())
    ids = [geometry["properties"]["id"] for geometry in geometries]
    if len(ids) != len(set(ids)) or set(ids) != set(expected):
        raise ValueError("Identidades da malha divergem do cadastro IBGE/TSE.")
    invalid = [error for geometry in geometries if (error := validate_geometry(geometry, arcs))]
    print(json.dumps({"checked": len(geometries), "invalid": invalid}, ensure_ascii=False, indent=2))
    if invalid:
        raise SystemExit(1)


if __name__ == "__main__":
    main()
