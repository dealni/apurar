"""Um estado com horário futuro não impede a correção oficial corrente."""

import unittest
from datetime import datetime

from apurar_collector.core.collector import LiveCollector
from apurar_collector.core.tse import parse_result
from tests import test_partial_structure_collection
from tests.test_tse import fixture


NOW = datetime.fromisoformat("2026-10-04T21:00:00Z").timestamp()


def result(scope, time, *, idg="100", votes=80):
    raw = fixture(scope)
    raw.update(ele="6258", t="2", hg=time, idg=idg)
    raw["ht"] = min(time, raw["ht"])
    raw["carg"][0]["agr"][0]["par"][0]["cand"][0]["vap"] = str(votes)
    return parse_result(raw, scope, "6258")


class CollectorFutureRecoveryTests(unittest.TestCase):
    def test_cycle_recovers_national_and_units_with_future_state(self):
        for idg in ("100", "101"):
            with self.subTest(previous_idg=idg):
                client = test_partial_structure_collection.PartialStructureCollectionTests().client("ok")
                collector = LiveCollector(client, clock=lambda: NOW, election="6258")
                collector.national = result("br", "19:00:00", idg=idg, votes=90)
                collector.units = {
                    scope: result(scope, "19:00:00", idg=idg, votes=90)
                    for scope in ("ac00001", "sp00001", "zz")
                }
                status = collector.cycle()
                self.assertTrue(collector.national_confirmed)
                self.assertEqual(status["status"], "live")
                for actual in (collector.national, *collector.units.values()):
                    self.assertEqual(actual["votes"]["13"], 80)
                    self.assertEqual(actual["generated_at"], "2026-10-04T18:00:00-03:00")
                self.assertEqual(len(collector.revisions), 4)

    def test_recovery_still_rejects_incoming_future_and_normal_rollbacks(self):
        collector = LiveCollector(clock=lambda: NOW, election="6258")
        for previous, incoming in (
            (result("br", "19:00:00"), result("br", "18:01:01", idg="101")),
            (result("br", "18:01:00"), result("br", "18:00:00", idg="101")),
            (result("br", "18:00:30"), result("br", "18:00:00", idg="101")),
        ):
            with self.subTest(previous=previous["generated_at"]):
                self.assertFalse(collector._accept(previous, incoming))

    def test_later_official_reduction_preserves_revision_audit(self):
        collector = LiveCollector(clock=lambda: NOW, election="6258")
        self.assertTrue(collector._accept(
            result("br", "17:59:00", votes=90),
            result("br", "18:00:00", idg="101", votes=70),
        ))
        self.assertEqual(len(collector.revisions), 1)
        self.assertIn("redução", collector.revisions[0]["reason"])


if __name__ == "__main__":
    unittest.main()
