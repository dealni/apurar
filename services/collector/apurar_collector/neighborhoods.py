"""Agregação offline por bairro do local de votação; não é bairro de residência.

Insumos: CSV oficial de locais de votação 2026 e votação por seção 2026.
O TSE atualiza o segundo arquivo ao final do turno; este módulo não habilita live.
"""
import re
from urllib.parse import urlsplit

from .core.tse import _integer


def _source(url):
    parsed = urlsplit(url)
    if parsed.scheme != "https" or parsed.netloc != "cdn.tse.jus.br" or not parsed.path.startswith("/estatistica/sead/odsele/"):
        raise ValueError("Insumo exige URL oficial de Dados Abertos TSE")
    return url


def _identity(row):
    uf = row["SG_UF"].upper()
    municipality = row["CD_MUNICIPIO"].zfill(5)
    zone = row["NR_ZONA"].zfill(4)
    section = row["NR_SECAO"].zfill(4)
    if not re.fullmatch(r"[A-Z]{2}", uf) or not all(re.fullmatch(pattern, value) for pattern, value in
            ((r"[0-9]{5}", municipality), (r"[0-9]{4}", zone), (r"[0-9]{4}", section))):
        raise ValueError("Identidade de seção inválida")
    return uf, municipality, zone, section


def _catalog(rows):
    identities, principal_neighborhoods = {}, {}
    for row in rows:
        if str(row.get("AA_ELEICAO")) != "2026" or str(row.get("NR_TURNO")) != "2":
            continue
        if row.get("DT_ELEICAO") != "25/10/2026":
            raise ValueError("Cadastro de outro pleito")
        key = _identity(row)
        name = row["NM_BAIRRO"].strip()
        if name in ("", "#NULO#", "#NE#"):
            continue
        principal = row.get("NR_SECAO_PRINCIPAL", "")
        principal = principal.zfill(4) if principal.isdigit() and int(principal) > 0 else key[3]
        main_key = (*key[:3], principal)
        value = {"neighborhood": name, "municipality_name": row["NM_MUNICIPIO"],
                 "main_key": main_key}
        if key in identities and identities[key] != value:
            raise ValueError("Cadastro de seção duplicado e divergente")
        identities[key] = value
        principal_neighborhoods.setdefault(main_key, set()).add(name)
    return identities, principal_neighborhoods


def aggregate_neighborhoods(catalog_rows, vote_rows, *, office="president", catalog_source, votes_source):
    """Retorna somente somas atribuíveis, com lacunas explícitas e sem rede."""
    if office not in ("president", "governor"):
        raise ValueError("Cargo indisponível no segundo turno")
    sources = [_source(catalog_source), _source(votes_source)]
    identities, principal_neighborhoods = _catalog(catalog_rows)
    if office == "governor":
        eligible = {"AC", "AM", "DF", "ES", "RN", "TO"}
        identities = {k: v for k, v in identities.items() if k[0] in eligible}
        principal_neighborhoods = {k: v for k, v in principal_neighborhoods.items() if k[0] in eligible}
    expected_election, cargo = ("6258", "1") if office == "president" else ("6260", "3")
    groups, seen, missing, ambiguous, received = {}, {}, set(), set(), set()
    generation_dates = set()
    for row in vote_rows:
        if str(row.get("ANO_ELEICAO")) != "2026" or str(row.get("NR_TURNO")) != "2" or str(row.get("CD_CARGO")) != cargo:
            continue
        if str(row.get("CD_ELEICAO")) != expected_election or row.get("DT_ELEICAO") != "25/10/2026":
            raise ValueError("Votação de outra eleição")
        key = _identity(row)
        candidate, count = str(row["NR_VOTAVEL"]), _integer(row["QT_VOTOS"])
        vote_key = (*key, candidate)
        if vote_key in seen:
            if seen[vote_key] != count:
                raise ValueError("Votação duplicada e divergente")
            continue
        seen[vote_key] = count
        meta = identities.get(key)
        if not meta:
            missing.add(key)
            continue
        main_key = meta["main_key"]
        if len(principal_neighborhoods[main_key]) != 1:
            ambiguous.add(main_key)
            continue
        if key != main_key:
            raise ValueError("Votação em seção agregada: exige validação antes de somar")
        group_key = (*key[:2], meta["neighborhood"])
        group = groups.setdefault(group_key, {"uf": key[0], "tse_code": key[1],
            "municipality": meta["municipality_name"], "name": meta["neighborhood"], "votes": {}, "sections": set()})
        group["votes"][candidate] = group["votes"].get(candidate, 0) + count
        group["sections"].add(key)
        received.add(key)
        generation_dates.add((row["DT_GERACAO"], row["HH_GERACAO"]))
    items = []
    for key, group in sorted(groups.items()):
        group["sections"] = len(group["sections"])
        items.append(group)
    expected = set(principal_neighborhoods)
    missing_expected = len(expected - received)
    return {"schema_version": 1, "election": expected_election, "mode": "archive",
        "office": office, "territorial_basis": "bairro do local de votação",
        "live_supported": False, "sources": sources, "source_generations": sorted(generation_dates),
        "items": items, "coverage": {"sections_received": len(received), "sections_expected": len(expected),
            "sections_pending": missing_expected,
            "sections_without_neighborhood": len(missing), "ambiguous_principal_sections": len(ambiguous),
            "partial": bool(missing or ambiguous or missing_expected or not expected)},
        "notes": ["CSV de votos por seção é publicado ao final do turno.",
                  "O bairro do local de votação não identifica o bairro de residência dos eleitores."]}
