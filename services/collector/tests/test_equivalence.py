"""Gabaritos do motor original em cenários sintéticos congelados, sem rede."""

import json
import unittest
from pathlib import Path
from apurar_collector.core.engine import ForecastEngine


class EquivalenceTests(unittest.TestCase):
    def test_frozen_original_runoff_outputs(self):
        fixture = json.loads(
            (Path(__file__).parent / "fixtures/model-equivalence.json").read_text()
        )
        engine = ForecastEngine(fixture["registry"], fixture["prior"])
        for scenario in fixture["scenarios"]:
            with self.subTest(scenario=scenario["name"]):
                actual = engine.project(scenario["units"], ["13", "22"], "runoff")[
                    "votes"
                ]
                for cid, expected in scenario["expected_votes"].items():
                    self.assertAlmostEqual(actual[cid], expected, places=9)


if __name__ == "__main__":
    unittest.main()
