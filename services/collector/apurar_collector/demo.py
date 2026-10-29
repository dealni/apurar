"""Dados sintéticos explícitos para ensaiar a cadeia sem TSE."""

from copy import deepcopy


def fixture(timestamp):
    candidates = [
        {"id": "13", "name": "Candidatura A (fictícia)", "party": "DEMO"},
        {"id": "22", "name": "Candidatura B (fictícia)", "party": "DEMO"},
    ]
    national = {
        "election": "6258",
        "round": 2,
        "scope": "br",
        "idg": "demo-001",
        "generated_at": timestamp,
        "totalized_at": timestamp,
        "source_url": "https://resultados.tse.jus.br/oficial/ele2026/6258/dados/br/br-c0001-e006258-u.json",
        "divulgation_allowed": True,
        "official_final": False,
        "sections_total": 30,
        "sections_counted": 6,
        "votes": {"13": 320, "22": 280},
        "valid_votes": 600,
        "blank_votes": 8,
        "null_votes": 12,
        "turnout": 620,
        "electorate": 4500,
        "candidates": candidates,
    }
    rows, prior_units = [], {}
    for scope, uf, name, pair in [
        ("sp00001", "SP", "Município Exemplo", (200, 200)),
        ("ba00002", "BA", "Cidade Demonstração", (100, 60)),
        ("zz", "ZZ", "Exterior", (20, 20)),
    ]:
        key = "ZZ:aggregate" if scope == "zz" else uf + ":" + scope[-5:]
        result = deepcopy(national)
        result.update(
            scope=scope,
            sections_total=10,
            sections_counted=4 if uf == "SP" else 1,
            votes={"13": pair[0], "22": pair[1]},
            valid_votes=sum(pair),
        )
        rows.append(
            {
                "scope": scope,
                "uf": uf,
                "name": name,
                "sections_total": 10,
                "result": result,
            }
        )
        prior_units[key] = {
            "votes_2026": {"13": 500, "22": 500},
            "valid_votes": 1000,
            "sections_total": 10,
        }
    prior = {
        "schema": "runoff-prior-v1",
        "basis": "first-turn-2026-only",
        "units": prior_units,
    }
    return {
        "status": "live",
        "national": national,
        "units": rows,
        "progress": {},
    }, prior
