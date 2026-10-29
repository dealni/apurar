"""Verificação somente leitura do índice e de todas as referências arquivadas."""

from contextlib import closing
import hashlib
import json
import sqlite3

from .diagnostics import instant
from .snapshot import encode


def reference(bucket, pointer, kind):
    sha = pointer["sha256"]
    if pointer["key"] != f"live/6258/{kind}/{sha}.json":
        raise ValueError("Chave de referência arquivada incompatível")
    body = bucket.get(pointer["key"])
    if body is None or hashlib.sha256(body).hexdigest() != pointer["sha256"]:
        raise ValueError("Referência arquivada ausente ou corrompida")
    return json.loads(body)


def observation(bucket, entry):
    pointer, family = entry["pointer"], entry["family"]
    instant(entry["observed_at"])
    source_as_of = entry["source_as_of"]
    if source_as_of is not None or family != "supplemental":
        instant(source_as_of)
    kind = "snapshots" if family == "core" else "supplemental"
    value = reference(bucket, pointer, kind)
    if value.get("schema_version") != 1:
        raise ValueError("Schema arquivado incompatível")
    count = 1
    if family == "core":
        if (value.get("snapshot_id") != pointer["snapshot_id"]
                or value.get("election") != {"id": "6258", "year": 2026,
                                              "round": 2, "office": "Presidente"}
                or value.get("published_at") != pointer["published_at"]
                or value.get("source", {}).get("as_of") != source_as_of):
            raise ValueError("Snapshot arquivado incompatível")
        instant(pointer["published_at"])
        for name in ("municipalities", "history"):
            extra = reference(bucket, pointer[name], name)
            if (extra.get("snapshot_id") != pointer["snapshot_id"]
                    or extra.get("schema_version") != 1
                    or extra.get("election") != "6258"):
                raise ValueError("Lote arquivado mistura versões")
            count += 1
    elif family == "supplemental":
        if value.get("updated_at") != pointer["updated_at"]:
            raise ValueError("Horário do suplemento arquivado incompatível")
    else:
        raise ValueError("Família de arquivo desconhecida")
    election = value.get("election")
    election_id = election.get("id") if isinstance(election, dict) else election
    if value.get("mode") != "live" or election_id != "6258":
        raise ValueError("Arquivo incompatível com eleição oficial")
    return count


def verify_integral(bucket, rows, index):
    entries, references = {}, 0
    for family, identity, body in rows:
        entry = json.loads(body)
        digest = hashlib.sha256(encode(entry["pointer"])).hexdigest()
        if (family != entry["family"] or identity != digest
                or entry["id"] != f"{family}-{digest}"):
            raise ValueError("Identidade divergente no arquivo integral")
        references += observation(bucket, entry)
        entries[entry["id"]] = entry
    sample = index["observations"]
    if (not rows or not isinstance(sample, list) or not sample
            or len(sample) > min(500, len(rows))):
        raise ValueError("Amostra de arquivo inválida")
    positions = {identifier: position for position, identifier in enumerate(entries)}
    selected = []
    for entry in sample:
        if entries.get(entry["id"]) != entry:
            raise ValueError("Índice e observação integral divergentes")
        selected.append(positions[entry["id"]])
    sampled = len(sample) < len(rows)
    if (selected != sorted(set(selected)) or selected[0] != 0
            or selected[-1] != len(rows) - 1
            or index.get("sampled") is not sampled
            or index.get("truncated") is not sampled
            or index.get("started_at") != sample[0]["observed_at"]
            or index.get("updated_at") != sample[-1]["observed_at"]):
        raise ValueError("Trajetória ou metadados do arquivo divergentes")
    return references


def verify_archive(bucket, state):
    raw = bucket.get("live/6258/archive-latest.json")
    database = state / "publication-archive.sqlite3"
    configured = database.exists() or (state / "archive-status.json").exists()
    if raw is None:
        orphan = any((bucket.root / "live/6258/archive").glob("*.json"))
        if configured or orphan:
            raise ValueError("Arquivo configurado sem ponteiro público; restore incompleto")
        return {"public_index": False, "integral_references": False, "observations": 0, "references": 0}
    pointer = json.loads(raw)
    sha = pointer["sha256"]
    if pointer.get("schema_version") != 1 or pointer["key"] != f"live/6258/archive/{sha}.json":
        raise ValueError("Ponteiro de arquivo inválido")
    index = reference(bucket, pointer, "archive")
    if (index.get("schema_version") != 1 or index.get("election") != "6258"
            or index.get("mode") != "live" or index["updated_at"] != pointer["updated_at"]):
        raise ValueError("Índice de arquivo inválido")
    instant(pointer["updated_at"])
    if not database.exists():
        raise ValueError("Índice público sem banco integral de arquivo")
    with closing(sqlite3.connect(database.as_uri() + "?mode=ro", uri=True)) as connection:
        if connection.execute("PRAGMA integrity_check").fetchone()[0] != "ok":
            raise ValueError("Banco de arquivo inconsistente")
        rows = connection.execute("SELECT family, identity, body FROM publications ORDER BY sequence").fetchall()
    if (type(index["total_observations"]) is not int
            or len(rows) != index["total_observations"]):
        raise ValueError("Banco integral e índice público divergentes")
    references = verify_integral(bucket, rows, index)
    return {"public_index": True, "integral_references": True,
            "observations": len(rows), "references": references}
