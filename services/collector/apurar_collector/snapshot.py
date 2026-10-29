"""Contratos públicos; ausência nunca é promovida a zero oficial."""

import hashlib
import json
from datetime import datetime, timezone
from .model import forecast


def now():
    return datetime.now(timezone.utc).isoformat()


def aware_datetime(value):
    """Instante explícito; datas locais não podem ordenar publicações oficiais."""
    try:
        instant = datetime.fromisoformat(value)
    except (TypeError, ValueError) as error:
        raise ValueError("Horário inválido; informe instante com fuso") from error
    if instant.tzinfo is None or instant.utcoffset() is None:
        raise ValueError("Horário exige fuso explícito")
    return instant


def encode(value):
    return json.dumps(
        value,
        ensure_ascii=False,
        allow_nan=False,
        sort_keys=True,
        separators=(",", ":"),
    ).encode()


def build(collection, prior, *, mode, collected_at, published_at,
          projection_enabled=True, projection_reason=None):
    national = collection.get("national")
    if not national or not national.get("divulgation_allowed"):
        raise ValueError("Sem resultado oficial divulgável; preservar último snapshot")
    if national.get("election") != "6258" or national.get("round") != 2:
        raise ValueError("Eleição incompatível")
    if set(national["votes"]) != {"13", "22"}:
        raise ValueError("Finalistas incompatíveis com o modelo")
    if mode not in ("demo", "live"):
        raise ValueError("Modo inválido")
    coverage = {
        "units_received": sum(bool(u.get("result")) for u in collection["units"]),
        "units_total": len(collection["units"]),
    }
    blocked = collection.get("projection_block_reason")
    if not projection_enabled:
        blocked = projection_reason or "Projeção desativada temporariamente pela operação."
    if blocked and not national.get("official_final"):
        predicted, model, notes = None, "runoff2026", [blocked]
    else:
        try:
            predicted, model, coverage, notes = forecast(collection, prior)
        except Exception:
            # Falha do motor jamais impede publicar contagens oficiais válidas.
            predicted, model, notes = None, "runoff2026", [
                "Projeção indisponível por falha do modelo; totais oficiais preservados."
            ]
    total = sum(predicted.values()) if predicted else 0
    as_of = national.get("totalized_at") or national["generated_at"]
    if not (
        aware_datetime(as_of)
        <= aware_datetime(collected_at)
        <= aware_datetime(published_at)
    ):
        raise ValueError("Cronologia inválida; verificar relógio e fonte")
    if aware_datetime(national["generated_at"]) > aware_datetime(collected_at):
        raise ValueError("Geração da fonte posterior à coleta")
    metadata = {c["id"]: c for c in national["candidates"]}
    if set(metadata) != set(national["votes"]):
        raise ValueError("Metadados de candidatos incompatíveis")
    value = {
        "schema_version": 1,
        "snapshot_id": "pending",
        "mode": mode,
        "election": {"id": "6258", "year": 2026, "round": 2, "office": "Presidente"},
        "source": {
            "url": national["source_url"],
            "as_of": as_of,
            "collected_at": collected_at,
            "generated_at": national["generated_at"],
            "idg": national["idg"],
            "signature_verified": False,
        },
        "published_at": published_at,
        "sections": {
            "counted": national["sections_counted"],
            "total": national["sections_total"],
        },
        "candidates": [
            {
                "id": cid,
                "name": metadata[cid]["name"],
                "party": metadata[cid].get("party", ""),
                "votes": votes,
                "validity": metadata[cid].get("validity", ""),
            }
            for cid, votes in national["votes"].items()
        ],
        "projection": {
            "available": bool(total),
            "model": model,
            "reason": " ".join(notes),
            "notes": notes,
            "shares": {c: v * 100 / total for c, v in predicted.items()}
            if total
            else None,
            "votes": predicted,
            "experimental": model != "official_final",
            "pre_count": national["sections_counted"] == 0,
        },
        "totals": {
            "valid": national["valid_votes"],
            "blank": national["blank_votes"],
            "null": national["null_votes"],
            "turnout": national["turnout"],
            "electorate": national["electorate"],
            **{
                public: national[field]
                for public, field in (
                    ("computed", "computed_votes"),
                    ("annulled", "annulled_votes"),
                    ("sub_judice", "sub_judice_votes"),
                    ("total", "total_votes"),
                    ("electorate_totalized", "electorate_totalized"),
                    ("electorate_installed", "electorate_installed"),
                    ("abstention", "abstention"),
                )
                if national.get(field) is not None
            },
        },
        "coverage": coverage,
    }
    value["snapshot_id"] = hashlib.sha256(encode(value)).hexdigest()
    return value


def municipal_totals(result):
    """Contagens EA20, sem inferir válidos de vap ou ausências de zeros."""
    fields = {
        "electorate": "electorate",
        "electorate_totalized": "electorate_totalized",
        "electorate_installed": "electorate_installed",
        "turnout": "turnout",
        "abstention": "abstention",
        "valid": "valid_votes",
        "computed": "computed_votes",
        "blank": "blank_votes",
        "null": "null_votes",
        "annulled": "annulled_votes",
        "sub_judice": "sub_judice_votes",
        "total": "total_votes",
    }
    return {
        public: result.get(field) if result else None
        for public, field in fields.items()
    }


def municipalities(collection):
    rows = []
    for wrapper in collection["units"]:
        result = wrapper.get("result")
        sections_total = result["sections_total"] if result else wrapper.get("sections_total")
        metadata = {c["id"]: c for c in result.get("candidates", [])} if result else {}
        if result and (
            set(result["votes"]) != {"13", "22"}
            or (
                "candidates" in result
                and (len(result["candidates"]) != 2 or set(metadata) != {"13", "22"})
            )
        ):
            # Um detalhe incompleto não pode invalidar o lote nacional inteiro.
            # Não completamos finalistas ausentes com votos zero.
            result = None
        rows.append(
            {
                "scope": wrapper["scope"],
                "ibge_code": wrapper.get("ibge_code"),
                "uf": wrapper["uf"],
                "name": wrapper.get("name", wrapper["scope"]),
                "unit_id": "ZZ:aggregate"
                if wrapper["scope"] == "zz"
                else wrapper["uf"].upper() + ":" + wrapper["scope"][-5:],
                "sections": {
                    "counted": result["sections_counted"] if result else None,
                    "total": sections_total,
                },
                "candidates": [
                    {
                        "id": c,
                        "votes": v,
                        **(
                            {"validity": metadata[c]["validity"]}
                            if metadata.get(c, {}).get("validity") is not None
                            else {}
                        ),
                    }
                    for c, v in result["votes"].items()
                ]
                if result
                else [],
                "totals": municipal_totals(result),
                "available": bool(result),
                "as_of": (result.get("totalized_at") or result["generated_at"])
                if result
                else None,
            }
        )
    return {"schema_version": 1, "election": "6258", "items": rows}


def history_point(snapshot):
    return {
        key: snapshot[key]
        for key in ("snapshot_id", "sections", "candidates", "projection")
    } | {"as_of": snapshot["source"]["as_of"]}
