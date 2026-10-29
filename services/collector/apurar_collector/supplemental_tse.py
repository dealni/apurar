"""Normalização EA20 para cargos e territórios adicionais, sem projeções."""
import re
from .core.tse import _integer, _stamp

BASE = "https://resultados.tse.jus.br/oficial/ele2026"


def supplemental_url(scope, election="6258", office="president", zone=None):
    if (election, office) not in (("6258", "president"), ("6260", "governor")):
        raise ValueError("Eleição e cargo suplementares inválidos")
    if not re.fullmatch(r"[a-z]{2}(?:[0-9]{5})?", scope):
        raise ValueError("Abrangência suplementar inválida")
    suffix = ""
    if zone is not None:
        if not re.fullmatch(r"[0-9]{4}", str(zone)) or len(scope) != 7:
            raise ValueError("Zona exige município e quatro dígitos")
        suffix = f"-z{zone}"
    cargo = "0003" if office == "governor" else "0001"
    return f"{BASE}/{election}/dados/{scope[:2]}/{scope}{suffix}-c{cargo}-e{int(election):06d}-u.json"


def parse_supplemental(raw, target):
    if not isinstance(raw, dict):
        raise ValueError("Resultado suplementar deve ser objeto")
    scope, election, office = (target[k] for k in ("scope", "election", "office"))
    zone = target.get("zone")
    expected_type = "zona" if zone else ("mu" if len(scope) == 7 else "uf")
    expected_code = zone or (scope[2:] if len(scope) == 7 else scope)
    if (raw.get("f") != "o" or str(raw.get("ele")) != election
            or str(raw.get("t")) != "2"
            or raw.get("tpabr") not in (("mu", "mun") if expected_type == "mu" else (expected_type,))
            or str(raw.get("cdabr", "")).lower() != expected_code):
        raise ValueError("Identidade oficial suplementar divergente")
    cargo = "3" if office == "governor" else "1"
    cargos = [c for c in raw.get("carg", []) if str(c.get("cd")) == cargo]
    if len(cargos) != 1:
        raise ValueError("Cargo oficial suplementar divergente")
    sec = raw["s"]
    total, counted, missing = (_integer(sec[k]) for k in ("ts", "st", "snt"))
    if counted > total or counted + missing != total:
        raise ValueError("Seções suplementares inconsistentes")
    totals = {key: _integer(raw[group][field]) if field in raw[group] else None
              for key, group, field in (("valid", "v", "vv"), ("blank", "v", "vb"),
              ("null", "v", "tvn"), ("turnout", "e", "c"),
              ("electorate", "e", "te"), ("abstention", "e", "a"))}
    as_of = _stamp(raw, "dt", "ht") if raw.get("dt") or raw.get("ht") else None
    generated_at = _stamp(raw)
    # No exterior, dt/ht pode representar o relógio local da cidade sem offset.
    # A geração do arquivo é a referência oficial comparável em Brasília;
    # nunca usar o horário da consulta nem atribuir -03:00 ao relógio local.
    if scope.startswith("zz") and as_of is not None:
        as_of = generated_at
    if as_of is not None and as_of > generated_at:
        raise ValueError("Totalização suplementar posterior à geração oficial")
    if as_of is None and (counted or any(totals[k] for k in ("valid", "blank", "null", "turnout"))):
        raise ValueError("Votação suplementar sem horário oficial")
    allowed = raw.get("dv") == "s"
    candidates, ids = [], set()
    for alliance in cargos[0].get("agr", []):
        for party in alliance.get("par", []):
            for candidate in party.get("cand", []):
                cid = str(candidate["n"])
                if cid in ids:
                    raise ValueError("Candidatura suplementar duplicada")
                ids.add(cid)
                votes = _integer(candidate["vap"])
                candidates.append({"id": cid, "name": candidate.get("nmu") or candidate["nm"],
                    "party": party["sg"], "votes": votes if allowed else None,
                    "status": candidate.get("st", ""), "validity": candidate.get("dvt", "")})
    return {**target, "status": "available" if allowed else "withheld", "stale": False,
            "as_of": as_of, "generated_at": generated_at, "candidates": candidates,
            "sections": {"total": total, "counted": counted if allowed else None},
            "totals": {k: v if allowed or k == "electorate" else None for k, v in totals.items()},
            "official_final": raw.get("and") == "f" and total > 0 and counted == total,
            "official_totalization_final": raw.get("tf") == "s"}


def pending_item(target):
    return {**target, "status": "awaiting", "stale": False, "as_of": None,
            "generated_at": None, "candidates": [], "sections": {"total": None, "counted": None},
            "totals": {k: None for k in ("valid", "blank", "null", "turnout", "electorate", "abstention")}}
