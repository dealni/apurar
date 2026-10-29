import unittest

from apurar_collector.core.engine import ForecastEngine


class EngineTests(unittest.TestCase):
    def setUp(self):
        self.registry = [{"unit_id": "X", "uf": "SP", "sections_total": 10}]
        self.prior = {
            "units": {
                "X": {
                    "votes_2022": {"13": 500, "22": 400, "other": 100},
                    "valid_votes": 1000,
                    "sections_total": 10,
                }
            }
        }
        self.engine = ForecastEngine(self.registry, self.prior)
        self.ids = ["13", "22", "55"]

    def test_no_votes_produces_prior(self):
        result = self.engine.project({}, self.ids)
        self.assertAlmostEqual(result["votes"]["13"], 500)
        self.assertAlmostEqual(sum(result["votes"].values()), 1000)
        self.assertEqual(result["coverage"]["percent"], 0)

    def test_complete_preserves_observed_zero(self):
        votes = {"13": 400, "22": 600, "55": 0}
        for model in ["municipal", "historical"]:
            result = self.engine.project(
                {"X": {"sections_counted": 10, "votes": votes}}, self.ids, model
            )
            self.assertEqual(result["votes"], votes)

    def test_partial_is_at_least_observed(self):
        votes = {"13": 0, "22": 200, "55": 1}
        result = self.engine.project(
            {"X": {"sections_counted": 2, "votes": votes}}, self.ids
        )
        self.assertTrue(all(result["votes"][c] >= votes[c] for c in votes))
        self.assertGreater(result["votes"]["13"], 0)

    def test_bad_data_rejected(self):
        for count, votes in [
            (11, {}),
            (-1, {}),
            (True, {}),
            (0, {"13": 1}),
            (1, {"13": -1}),
            (1, {"99": 2}),
            (1, {"13": float("nan")}),
        ]:
            with self.subTest(count=count, votes=votes), self.assertRaises(ValueError):
                self.engine.project(
                    {"X": {"sections_counted": count, "votes": votes}}, self.ids
                )

    def test_missing_prior_supported(self):
        engine = ForecastEngine(self.registry, {"units": {}})
        result = engine.project({}, self.ids)
        self.assertEqual(result["coverage"]["prior_missing_units"], 1)
        self.assertGreater(sum(result["votes"].values()), 0)

    def test_municipal_extrapolation(self):
        result = self.engine.project(
            {"X": {"sections_counted": 2, "votes": {"13": 100, "22": 60, "55": 40}}},
            self.ids,
            "municipal",
        )
        self.assertEqual(result["votes"], {"13": 500, "22": 300, "55": 200})

    def test_missing_bloc_fails_closed(self):
        with self.assertRaises(ValueError):
            self.engine.project({}, ["13", "55"])
        with self.assertRaises(ValueError):
            self.engine.project({}, ["13", "22"])
