"""Segundo turno: base exclusiva no primeiro turno de 2026."""

import math

from .config import (
    MODEL_LOCAL_SECTIONS,
    MODEL_NATIONAL_SECTIONS,
    MODEL_PSEUDOCOUNT,
    MODEL_STATE_SECTIONS,
)

CANDIDATES = ("13", "22")
NOTES = [
    "Estimativa experimental; não representa probabilidade de vitória.",
    "Base principal: votos municipais do primeiro turno de 2026, renormalizados entre 13 e 22.",
    "Sem ajuste por eleições de outros anos; a renormalização não identifica transferências individuais.",
    "Votos oficiais já recebidos são preservados. Seções restantes usam taxa de votos válidos estimada, não eleitores garantidos.",
]


def normalized(values):
    total = sum(values.values())
    return {c: values.get(c, 0) / total if total else 0.5 for c in CANDIDATES}


def estimate(engine, units):
    pools = {}
    for key, row in units.items():
        count = row["sections_counted"]
        if not count:
            continue
        h = engine.histories[key]
        for scope in ("BR", engine.registry[key]["uf"]):
            p = pools.setdefault(
                scope,
                {
                    "actual": dict.fromkeys(CANDIDATES, 0.0),
                    "expected": dict.fromkeys(CANDIDATES, 0.0),
                    "sections": 0,
                },
            )
            p["sections"] += count
            for c in CANDIDATES:
                p["actual"][c] += row["votes"].get(c, 0)
                p["expected"][c] += count * h["rate"] * h["shares"][c]

    def correction(pool, fallback, strength):
        if not pool or not sum(pool["actual"].values()):
            return fallback
        actual = normalized(
            {c: pool["actual"][c] + MODEL_PSEUDOCOUNT for c in CANDIDATES}
        )
        expected = normalized(
            {c: pool["expected"][c] + MODEL_PSEUDOCOUNT for c in CANDIDATES}
        )
        weight = pool["sections"] / (pool["sections"] + strength)
        return {
            c: math.exp(
                weight * math.log(actual[c] / expected[c])
                + (1 - weight) * math.log(fallback[c])
            )
            for c in CANDIDATES
        }

    national = correction(
        pools.get("BR"), dict.fromkeys(CANDIDATES, 1.0), MODEL_NATIONAL_SECTIONS
    )
    total = dict.fromkeys(CANDIDATES, 0.0)
    for key, unit in engine.registry.items():
        row = units.get(key, {"sections_counted": 0, "votes": {}})
        count, votes = row["sections_counted"], row["votes"]
        h = engine.histories[key]
        adjust = correction(pools.get(unit["uf"]), national, MODEL_STATE_SECTIONS)
        prior = normalized({c: h["shares"][c] * adjust[c] for c in CANDIDATES})
        pseudo = MODEL_LOCAL_SECTIONS * h["rate"]
        shares = normalized(
            {c: votes.get(c, 0) + pseudo * prior[c] for c in CANDIDATES}
        )
        remaining_valid = (
            (unit["sections_total"] - count)
            * (sum(votes.values()) + pseudo)
            / (count + MODEL_LOCAL_SECTIONS)
        )
        for c in CANDIDATES:
            total[c] += votes.get(c, 0) + remaining_valid * shares[c]
    return total
