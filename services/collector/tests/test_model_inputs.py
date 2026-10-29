"""Insumos incompletos não viram zeros e horários comparam instantes reais."""

import unittest
from copy import deepcopy

from apurar_collector.demo import fixture
from apurar_collector.model import forecast
from apurar_collector.snapshot import build, municipalities


STAMP = "2026-10-25T18:00:00-03:00"


class ModelInputsTests(unittest.TestCase):
    def setUp(self):
        self.collection, self.prior = fixture(STAMP)

    def snapshot(self):
        return build(
            self.collection, self.prior,
            mode="demo", collected_at=STAMP, published_at=STAMP,
        )

    def test_missing_finalist_suspends_but_explicit_zero_is_legitimate(self):
        city = self.collection["units"][0]["result"]
        city["votes"]["22"] = 0
        city["valid_votes"] = 200
        national = self.collection["national"]
        national["votes"]["22"] = 80
        national["valid_votes"] = 400
        explicit_zero = self.snapshot()
        self.assertTrue(explicit_zero["projection"]["available"])
        del city["votes"]["22"]
        incomplete = self.snapshot()
        self.assertFalse(incomplete["projection"]["available"])
        self.assertEqual(incomplete["candidates"], explicit_zero["candidates"])

    def test_missing_or_duplicate_candidate_metadata_suspends_model(self):
        candidates = self.collection["units"][0]["result"]["candidates"]
        for replacement in (candidates[:1], [candidates[0], candidates[0]]):
            with self.subTest(candidates=replacement):
                self.collection["units"][0]["result"]["candidates"] = replacement
                self.assertIsNone(forecast(self.collection, self.prior)[0])

    def test_incomplete_municipal_candidates_do_not_invalidate_national_bundle(self):
        original = deepcopy(self.collection["units"][0]["result"])
        incomplete = deepcopy(original)
        incomplete["votes"].pop("22")
        unexpected = deepcopy(original)
        unexpected["votes"]["33"] = unexpected["votes"].pop("22")
        missing_metadata = deepcopy(original)
        missing_metadata["candidates"] = missing_metadata["candidates"][:1]
        duplicated_metadata = deepcopy(original)
        duplicated_metadata["candidates"] = [original["candidates"][0]] * 2
        for result in (incomplete, unexpected, missing_metadata, duplicated_metadata):
            with self.subTest(result=result):
                self.collection["units"][0]["result"] = result
                national = self.snapshot()
                rows = municipalities(self.collection)["items"]
                self.assertEqual(national["candidates"][0]["votes"], 320)
                self.assertFalse(national["projection"]["available"])
                self.assertFalse(rows[0]["available"])
                self.assertEqual(rows[0]["sections"], {"counted": None, "total": 10})
                self.assertEqual(rows[0]["candidates"], [])
                self.assertIsNone(rows[0]["as_of"])
                self.assertTrue(all(value is None for value in rows[0]["totals"].values()))
                self.assertTrue(rows[1]["available"])
                self.assertTrue(rows[2]["available"])

    def test_reduction_of_votes_recalculates_without_monotonic_floor(self):
        before = self.snapshot()
        self.collection["units"][0]["result"]["votes"]["13"] -= 10
        self.collection["units"][0]["result"]["valid_votes"] -= 10
        self.collection["national"]["votes"]["13"] -= 10
        self.collection["national"]["valid_votes"] -= 10
        after = self.snapshot()
        self.assertTrue(after["projection"]["available"])
        self.assertEqual(after["candidates"][0]["votes"], 310)
        self.assertLess(after["projection"]["votes"]["13"], before["projection"]["votes"]["13"])

    def test_municipal_time_bounds_compare_instants_across_offsets(self):
        times = [
            "2026-10-25T17:00:00-03:00",
            "2026-10-25T19:00:00+00:00",
            "2026-10-25T18:00:00-03:00",
        ]
        for unit, stamp in zip(self.collection["units"], times):
            unit["result"]["totalized_at"] = stamp
        coverage = forecast(self.collection, self.prior)[2]
        self.assertEqual(coverage["municipal_time_min"], times[1])
        self.assertEqual(coverage["municipal_time_max"], times[2])

    def test_pre_count_source_generation_is_included_in_time_bounds(self):
        results = [self.collection["national"], *[
            unit["result"] for unit in self.collection["units"]
        ]]
        for result in results:
            result.update(
                totalized_at=None, sections_counted=0,
                votes={"13": 0, "22": 0}, valid_votes=0,
            )
        coverage = forecast(self.collection, self.prior)[2]
        self.assertEqual(coverage["municipal_time_min"], STAMP)
        self.assertEqual(coverage["municipal_time_max"], STAMP)
