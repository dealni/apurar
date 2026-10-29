"""Avaliação temporal offline do motor atual, sem ajuste de parâmetros."""

import argparse
import json
import math
from pathlib import Path

from .diagnostics import instant
from .model import forecast


def votes_valid(votes):
    return bool(votes) and all(
        isinstance(vote, (int, float)) and not isinstance(vote, bool)
        and math.isfinite(vote) and vote >= 0 for vote in votes.values()
    ) and sum(votes.values()) > 0


def evaluate(document):
    provenance = document["provenance"]
    if provenance["kind"] not in ("synthetic", "real") or not provenance.get("description"):
        raise ValueError("Identifique a proveniência e se os dados são reais ou sintéticos")
    prior, final = document["prior"], document["final"]
    if prior.get("basis") != "first-turn-2026-only":
        raise ValueError("Prior incompatível com o modelo atual")
    prior_time, final_time = instant(document["prior_as_of"]), instant(final["as_of"])
    truth = final["votes"]
    if not votes_valid(truth):
        raise ValueError("Resultado final inválido")
    observations = document["observations"]
    if not observations:
        raise ValueError("Nenhuma observação temporal")
    points, previous = [], -math.inf
    for observation in observations:
        cutoff = instant(observation["cutoff"])
        if cutoff <= previous or not prior_time <= cutoff < final_time:
            raise ValueError("Prefixos devem ser crescentes, anteriores ao final e posteriores ao prior")
        previous = cutoff
        collection = observation["collection"]
        results = [collection["national"]] + [u["result"] for u in collection["units"] if u.get("result")]
        for result in results:
            for key in ("generated_at", "totalized_at"):
                if result.get(key) and instant(result[key]) > cutoff:
                    raise ValueError("Observação contém dado futuro ao corte")
            if result.get("official_final"):
                raise ValueError("Corte de avaliação já contém encerramento oficial")
        prediction, model, coverage, notes = forecast(collection, prior)
        errors = None
        if prediction is not None:
            if set(prediction) != set(truth) or not votes_valid(prediction):
                raise ValueError("Predição e final incompatíveis")
            total, final_total = sum(prediction.values()), sum(truth.values())
            errors = {candidate: 100 * (prediction[candidate] / total - truth[candidate] / final_total)
                      for candidate in truth}
        points.append({"cutoff": observation["cutoff"], "model": model,
                       "available": prediction is not None, "error_pp": errors,
                       "coverage": coverage, "notes": notes})
    errors = [abs(error) for point in points if point["error_pp"] for error in point["error_pp"].values()]
    return {"provenance": provenance, "points": points, "observations": len(points),
            "available": sum(point["available"] for point in points),
            "availability_percent": 100 * sum(point["available"] for point in points) / len(points),
            "mean_absolute_error_pp": sum(errors) / len(errors) if errors else None,
            "max_absolute_error_pp": max(errors) if errors else None,
            "limits": ["Sem recalibração, probabilidade ou margem de erro calibrada.",
                       "Validade temporal dos horários é verificada; proveniência declarada deve ser auditada.",
                       "Ensaio sintético não mede precisão eleitoral real; primeiro turno não valida segundo turno."]}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("input", type=Path)
    args = parser.parse_args()
    try:
        print(json.dumps(evaluate(json.loads(args.input.read_text())), ensure_ascii=False, allow_nan=False))
    except (OSError, ValueError, KeyError, TypeError) as error:
        print(json.dumps({"ok": False, "error": str(error)}, ensure_ascii=False))
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
