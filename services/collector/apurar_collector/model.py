"""Conciliação preservada do serviço original, sem replay nem HTTP público."""

from datetime import datetime

from .core.engine import ForecastEngine
from .core.units import model_units, unit_key


def _eligible_votes(result):
    """O modelo presume votos nominais válidos; o feed não depende disso."""
    candidate_ids = [candidate["id"] for candidate in result["candidates"]]
    if (
        set(result["votes"]) != {"13", "22"}
        or len(candidate_ids) != 2
        or set(candidate_ids) != set(result["votes"])
    ):
        return False
    if sum(result["votes"].values()) != result["valid_votes"]:
        return False
    if result.get("annulled_votes") or result.get("sub_judice_votes"):
        return False
    if result.get("computed_votes") not in (None, result["valid_votes"]):
        return False
    return all(
        not candidate.get("validity") or candidate["validity"] == "Válido"
        for candidate in result["candidates"]
    )


def forecast(collection, prior):
    national = collection["national"]
    coverage = {
        "units_received": len([u for u in collection["units"] if u.get("result")]),
        "units_total": len(collection["units"]),
    }
    results = [national]
    if not national["official_final"]:
        results.extend(u["result"] for u in collection["units"] if u.get("result"))
    if not all(_eligible_votes(result) for result in results):
        return (
            None,
            "runoff2026",
            coverage,
            ["Projeção suspensa: finalistas, votos computados e válidos ou destinações incompatíveis com o modelo. Os totais oficiais permanecem disponíveis."],
        )
    if national["official_final"]:
        return (
            dict(national["votes"]),
            "official_final",
            coverage,
            ["Resultado final oficial: totalização nacional encerrada pelo TSE."],
        )
    registry, source_times = [], []
    for wrapper in collection["units"]:
        result = wrapper.get("result")
        if wrapper["scope"][:2].upper() != wrapper["uf"].upper() or (
            result and any(
                result[field] != expected
                for field, expected in (
                    ("scope", wrapper["scope"]),
                    ("election", national["election"]),
                    ("round", national["round"]),
                )
            )
        ):
            return (
                None,
                "runoff2026",
                coverage,
                ["Sincronizando a identidade dos resultados municipais com o cadastro e a eleição nacional."],
            )
        sections = result["sections_total"] if result else wrapper.get("sections_total")
        if not sections:
            return (
                None,
                "runoff2026",
                coverage,
                ["Aguardando cadastro de todas as unidades."],
            )
        key = unit_key(wrapper["scope"], wrapper["uf"])
        registry.append(
            {
                "unit_id": key,
                "uf": wrapper["uf"].upper(),
                "kind": "exterior" if wrapper["scope"] == "zz" else "municipality",
                "sections_total": sections,
            }
        )
        if result:
            source_times.append(result.get("totalized_at") or result["generated_at"])
    expected = set(prior["units"])
    received = {u["unit_id"] for u in registry}
    if (
        not registry
        or len(received) != len(registry)
        or received != expected
        or not any(u["kind"] == "exterior" for u in registry)
        or sum(u["sections_total"] for u in registry) != national["sections_total"]
    ):
        return None, "runoff2026", coverage, ["Sincronizando cadastro com o Brasil."]
    units = model_units(collection["units"])
    official = national["valid_votes"]
    local = sum(sum(u["votes"].values()) for u in units.values())
    gap = abs(local - official) / max(1, official)
    candidate_gap = max(
        (
            abs(sum(u["votes"].get(c, 0) for u in units.values()) - votes)
            / max(1, official)
            for c, votes in national["votes"].items()
        ),
        default=0,
    )
    section_gap = abs(
        sum(u["sections_counted"] for u in units.values())
        - national["sections_counted"]
    ) / max(1, national["sections_total"])
    coverage.update(
        synchronization_gap_percent=gap * 100,
        candidate_gap_percent=candidate_gap * 100,
        section_gap_percent=section_gap * 100,
        municipal_time_min=min(source_times, key=datetime.fromisoformat) if source_times else None,
        municipal_time_max=max(source_times, key=datetime.fromisoformat) if source_times else None,
    )
    if not units or max(gap, candidate_gap, section_gap) > 0.03:
        return (
            None,
            "runoff2026",
            coverage,
            ["Sincronizando resultados municipais com o Brasil."],
        )
    try:
        result = ForecastEngine(registry, prior).project(
            units, list(national["votes"]), "runoff"
        )
        prediction = result["votes"]
        if any(prediction.get(c, 0) < votes for c, votes in national["votes"].items()):
            raise ValueError("Projeção inferior aos votos nacionais observados")
    except ValueError:
        return (
            None,
            "runoff2026",
            coverage,
            ["Projeção suspensa por inconsistência dos dados."],
        )
    coverage.update(result["coverage"])
    return prediction, "runoff2026", coverage, result["notes"]
