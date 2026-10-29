"""EA20 separa votos computados, válidos e destinações judiciais."""

import unittest

from apurar_collector.demo import fixture
from apurar_collector.snapshot import build
from apurar_collector.core.tse import parse_result
from tests.test_tse import fixture as official_fixture

STAMP = "2026-10-25T18:00:00-03:00"


class OfficialVotesTests(unittest.TestCase):
    def test_ea20_preserves_computed_and_annulled_votes(self):
        for destination, field in [("Anulado", "van"), ("Anulado sub judice", "vansj")]:
            with self.subTest(destination=destination):
                raw = official_fixture()
                raw["v"].update(vv="100", vvc="180", tv="200", van="0", vansj="0")
                raw["v"][field] = "80"
                raw["carg"][0]["agr"][0]["par"][0]["cand"][0]["dvt"] = destination
                value = parse_result(raw)
                self.assertEqual(value["votes"], {"13": 80, "22": 100})
                self.assertEqual(value["valid_votes"], 100)
                self.assertEqual(value["computed_votes"], 180)
                self.assertEqual(value["total_votes"], 200)
                self.assertEqual(value["candidates"][0]["validity"], destination)

    def test_incompatible_votes_suspend_model_but_advance_official_feed(self):
        for final in (False, True):
            collection, prior = fixture(STAMP)
            national = collection["national"]
            national.update(
                official_final=final,
                valid_votes=280,
                computed_votes=600,
                annulled_votes=0,
                sub_judice_votes=320,
                total_votes=620,
            )
            national["candidates"][0]["validity"] = "Anulado sub judice"
            result = build(collection, prior, mode="demo", collected_at=STAMP, published_at=STAMP)
            self.assertFalse(result["projection"]["available"])
            self.assertIsNone(result["projection"]["shares"])
            self.assertIsNone(result["projection"]["votes"])
            self.assertEqual(result["candidates"][0]["votes"], 320)
            self.assertEqual(result["candidates"][0]["validity"], "Anulado sub judice")
            self.assertEqual(result["totals"]["valid"], 280)
            self.assertEqual(result["totals"]["computed"], 600)
            self.assertEqual(result["totals"]["sub_judice"], 320)
            self.assertEqual(result["totals"]["total"], 620)
            self.assertIn("oficiais permanecem", result["projection"]["reason"])

    def test_municipal_destinations_suspend_only_unfinished_model(self):
        collection, prior = fixture(STAMP)
        city = collection["units"][0]["result"]
        city["candidates"][0]["validity"] = "Anulado"
        for final in (False, True):
            collection["national"]["official_final"] = final
            result = build(collection, prior, mode="demo", collected_at=STAMP, published_at=STAMP)
            self.assertEqual(result["projection"]["available"], final)

    def test_optional_ea20_totals_are_not_invented(self):
        value = parse_result(official_fixture())
        self.assertIsNone(value["computed_votes"])
        self.assertIsNone(value["annulled_votes"])
        self.assertIsNone(value["sub_judice_votes"])
        self.assertIsNone(value["total_votes"])
