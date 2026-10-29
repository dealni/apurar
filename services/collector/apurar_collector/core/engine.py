"""Projeções causais: histórico 2022 e resultados recebidos, sem gabarito 2026."""

import math

from .config import (
    MODEL_LOCAL_SECTIONS,
    MODEL_NATIONAL_SECTIONS,
    MODEL_PSEUDOCOUNT,
    MODEL_STATE_SECTIONS,
    RUNOFF_SCHEMA,
)

BLOCS = ("13", "22", "other")
MODEL_NOTES = [
    "Modelo exploratório, sem intervalo probabilístico calibrado.",
    "O número 22 representa Jair Bolsonaro em 2022 e Flávio Bolsonaro em 2026; transportar esse perfil é uma hipótese.",
    "Candidatos além dos blocos 13/22 usam distribuição contemporânea dos demais; antes de qualquer voto, divisão uniforme.",
    "Cadastro estrutural do replay foi reconstruído posteriormente; o teste não reproduz a disponibilidade pública exata dos dados.",
]


def normalize(values):
    total = sum(values.values())
    return {k: v / total if total else 1 / len(values) for k, v in values.items()}


def bloc_votes(votes):
    return {
        "13": votes.get("13", 0),
        "22": votes.get("22", 0),
        "other": sum(v for k, v in votes.items() if k not in ("13", "22")),
    }


def swing(pool, fallback, strength):
    if not pool or not sum(pool["actual"].values()):
        return fallback
    actual = normalize({b: pool["actual"][b] + MODEL_PSEUDOCOUNT for b in BLOCS})
    expected = normalize({b: pool["expected"][b] + MODEL_PSEUDOCOUNT for b in BLOCS})
    weight = pool["sections"] / (pool["sections"] + strength)
    return {
        b: math.exp(
            weight * math.log(actual[b] / expected[b])
            + (1 - weight) * math.log(fallback[b])
        )
        for b in BLOCS
    }


class ForecastEngine:
    def __init__(self, registry, prior):
        if prior.get("schema") not in (None, RUNOFF_SCHEMA):
            raise ValueError("Versão do prior incompatível")
        self.is_runoff = prior.get("schema") == RUNOFF_SCHEMA
        if self.is_runoff:
            for row in prior["units"].values():
                votes = row.get("votes_2026", {})
                if set(votes) != {"13", "22"} or any(
                    isinstance(v, bool)
                    or not isinstance(v, (int, float))
                    or not math.isfinite(v)
                    or v < 0
                    for v in votes.values()
                ):
                    raise ValueError("Prior do segundo turno contém votos inválidos")
                sections = row.get("sections_total")
                valid = row.get("valid_votes")
                if (
                    isinstance(sections, bool)
                    or not isinstance(sections, int)
                    or sections <= 0
                    or isinstance(valid, bool)
                    or not isinstance(valid, (int, float))
                    or not math.isfinite(valid)
                    or valid <= 0
                    or not math.isclose(sum(votes.values()), valid, rel_tol=1e-10)
                ):
                    raise ValueError("Prior do segundo turno contém taxa inválida")
            prior = {
                "units": {
                    key: dict(row, votes_2022=dict(row["votes_2026"], other=0))
                    for key, row in prior["units"].items()
                }
            }
        self.registry = {u["unit_id"]: dict(u) for u in registry}
        if not self.registry or len(self.registry) != len(registry):
            raise ValueError("Cadastro vazio ou unidades duplicadas")
        if any(
            isinstance(u["sections_total"], bool)
            or not isinstance(u["sections_total"], int)
            or u["sections_total"] <= 0
            for u in self.registry.values()
        ):
            raise ValueError("Total de seções inválido")
        historical = prior.get("units", {})
        if not isinstance(historical, dict):
            raise ValueError("Unidades do prior inválidas")
        for row in historical.values():
            self._validate_history(row)
        national_votes = {
            b: sum(h["votes_2022"].get(b, 0) for h in historical.values())
            for b in BLOCS
        }
        sections = sum(h.get("sections_total", 0) for h in historical.values())
        national_rate = sum(national_votes.values()) / sections if sections else 240.0
        self.histories = {}
        self.missing = []
        for key in self.registry:
            h = historical.get(key)
            if not h:
                self.missing.append(key)
            shares = (
                normalize({b: h["votes_2022"].get(b, 0) for b in BLOCS})
                if h
                else normalize(national_votes)
            )
            rate = (
                h["valid_votes"] / h["sections_total"]
                if h and h.get("sections_total")
                else national_rate
            )
            self.histories[key] = {"shares": shares, "rate": rate}

    @staticmethod
    def _validate_history(row):
        if not isinstance(row, dict):
            raise ValueError("Unidade do prior inválida")
        votes = row.get("votes_2022")
        if (
            not isinstance(votes, dict)
            or not votes
            or not set(votes).issubset(BLOCS)
            or any(
                isinstance(v, bool)
                or not isinstance(v, (int, float))
                or not math.isfinite(v)
                or v < 0
                for v in votes.values()
            )
        ):
            raise ValueError("Votos históricos inválidos")
        sections, valid = row.get("sections_total"), row.get("valid_votes")
        if (
            isinstance(sections, bool)
            or not isinstance(sections, int)
            or sections <= 0
            or isinstance(valid, bool)
            or not isinstance(valid, (int, float))
            or not math.isfinite(valid)
            or valid < 0
            or not math.isclose(sum(votes.values()), valid, rel_tol=1e-10)
        ):
            raise ValueError("Taxa ou massa histórica inválida")

    def _validate(self, units, candidates):
        for key, row in units.items():
            if key not in self.registry:
                raise ValueError("Unidade fora do cadastro")
            count = row["sections_counted"]
            if (
                isinstance(count, bool)
                or not isinstance(count, int)
                or not 0 <= count <= self.registry[key]["sections_total"]
            ):
                raise ValueError("Contagem de seções inválida")
            for candidate, value in row["votes"].items():
                if (
                    candidate not in candidates
                    or isinstance(value, bool)
                    or not isinstance(value, int)
                    or value < 0
                ):
                    raise ValueError("Voto ou candidato inválido")
            if count == 0 and sum(row["votes"].values()):
                raise ValueError("Votos sem seções totalizadas")

    def project(self, units, candidate_ids, model="historical"):
        if model not in ("historical", "municipal", "runoff"):
            raise ValueError("Modelo desconhecido")
        if model == "runoff" and (
            not self.is_runoff or set(candidate_ids) != {"13", "22"}
        ):
            raise ValueError("Segundo turno requer prior próprio e candidatos 13/22")
        if len(set(candidate_ids)) != len(candidate_ids) or not candidate_ids:
            raise ValueError("Lista de candidatos inválida")
        if model == "historical" and (
            not {"13", "22"}.issubset(candidate_ids) or len(candidate_ids) < 3
        ):
            raise ValueError(
                "Modelo histórico requer os blocos 13/22 e ao menos outro candidato"
            )
        self._validate(units, candidate_ids)
        others = [c for c in candidate_ids if c not in ("13", "22")]
        pp = {}
        for key, row in units.items():
            count = row["sections_counted"]
            if not count:
                continue
            history = self.histories[key]
            for scope in ("BR", self.registry[key]["uf"]):
                p = pp.setdefault(
                    scope,
                    {
                        "actual": dict.fromkeys(BLOCS, 0.0),
                        "expected": dict.fromkeys(BLOCS, 0.0),
                        "sections": 0,
                        "candidates": dict.fromkeys(candidate_ids, 0.0),
                    },
                )
                p["sections"] += count
                for b, value in bloc_votes(row["votes"]).items():
                    p["actual"][b] += value
                    p["expected"][b] += count * history["rate"] * history["shares"][b]
                for c in candidate_ids:
                    p["candidates"][c] += row["votes"].get(c, 0)
        national = swing(
            pp.get("BR"), dict.fromkeys(BLOCS, 1.0), MODEL_NATIONAL_SECTIONS
        )
        uf_swings = {
            uf: swing(p, national, MODEL_STATE_SECTIONS)
            for uf, p in pp.items()
            if uf != "BR"
        }
        total = dict.fromkeys(candidate_ids, 0.0)
        for key, unit in self.registry.items():
            row = units.get(key, {"sections_counted": 0, "votes": {}})
            count, votes = row["sections_counted"], row["votes"]
            remaining = unit["sections_total"] - count
            valid = sum(votes.values())
            if model == "municipal":
                pool = pp.get(unit["uf"], pp.get("BR"))
                if count:
                    future = {
                        c: remaining * votes.get(c, 0) / count for c in candidate_ids
                    }
                elif pool:
                    future = {
                        c: remaining * pool["candidates"][c] / pool["sections"]
                        for c in candidate_ids
                    }
                else:
                    future = dict.fromkeys(candidate_ids, 0.0)
            elif model == "historical":
                h = self.histories[key]
                adjust = uf_swings.get(unit["uf"], national)
                prior_shares = normalize({b: h["shares"][b] * adjust[b] for b in BLOCS})
                pseudo = MODEL_LOCAL_SECTIONS * h["rate"]
                current = bloc_votes(votes)
                shares = normalize(
                    {b: current[b] + pseudo * prior_shares[b] for b in BLOCS}
                )
                future_valid = (
                    remaining * (valid + pseudo) / (count + MODEL_LOCAL_SECTIONS)
                )
                other_pool = pp.get(unit["uf"], pp.get("BR"))
                other_shares = normalize(
                    {
                        c: (other_pool["candidates"][c] if other_pool else 0)
                        + MODEL_PSEUDOCOUNT
                        for c in others
                    }
                )
                future = {
                    c: future_valid
                    * (
                        shares[c]
                        if c in ("13", "22")
                        else shares["other"] * other_shares[c]
                    )
                    for c in candidate_ids
                }
            for c in candidate_ids:
                if model != "runoff":
                    total[c] += votes.get(c, 0) + future[c]
        if model == "runoff":
            from .runoff import estimate

            total = estimate(self, units)
        counted = sum(row["sections_counted"] for row in units.values())
        section_total = sum(u["sections_total"] for u in self.registry.values())
        return {
            "votes": total,
            "coverage": {
                "sections_total": section_total,
                "sections_counted": counted,
                "percent": 100 * counted / section_total,
                "municipalities_total": sum(
                    u.get("kind") == "municipality" for u in self.registry.values()
                ),
                "municipalities_started": sum(
                    self.registry[k].get("kind") == "municipality"
                    and r["sections_counted"] > 0
                    for k, r in units.items()
                ),
                "municipalities_imputed": sum(
                    u.get("kind") == "municipality"
                    and not units.get(k, {}).get("sections_counted", 0)
                    for k, u in self.registry.items()
                ),
                "units_total": len(self.registry),
                "units_reporting": sum(
                    r["sections_counted"] > 0 for r in units.values()
                ),
                "prior_missing_units": len(self.missing),
            },
            "model_id": "runoff2026" if model == "runoff" else model,
            "notes": self._notes(model),
        }

    @staticmethod
    def _notes(model):
        if model == "runoff":
            from .runoff import NOTES

            return NOTES.copy()
        return (
            MODEL_NOTES.copy()
            if model == "historical"
            else [
                "Extrapolação municipal; locais sem votos usam taxa contemporânea por seção da UF ou Brasil."
            ]
        )
