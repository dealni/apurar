"""Horários futuros não envenenam a coleta nem congelam correções oficiais."""

import copy
import json
import tempfile
import unittest
from datetime import datetime
from pathlib import Path
from unittest.mock import Mock

from apurar_collector.core.tse import FetchResult, TSEClient
from apurar_collector.publisher import LocalBucket, Publisher
from apurar_collector.supplemental import SupplementalCollector
from apurar_collector.supplemental_publication import SupplementalPublication
from apurar_collector.supplemental_tse import parse_supplemental, pending_item
from tests.test_supplemental import city_target, raw_result
from tests.test_tse import Response

NOW = datetime.fromisoformat("2026-10-25T21:00:00Z").timestamp()


class SupplementalFutureClockTests(unittest.TestCase):
    def setUp(self):
        temporary = tempfile.TemporaryDirectory()
        self.addCleanup(temporary.cleanup)
        self.root = Path(temporary.name)
        self.client = Mock()
        self.collector = SupplementalCollector(self.client, self.root, clock=lambda: NOW)
        self.target = city_target()
        self.key = "6258:" + self.target["id"]
        self.collector.targets[self.key] = self.target
        self.collector.items[self.key] = pending_item(self.target)
        self.local = Publisher(LocalBucket(self.root / "bucket"))
        self.publication = SupplementalPublication(
            self.root / "publication", self.local, clock=lambda: NOW
        )

    def fetch(self, raw):
        self.client.fetch.return_value = FetchResult("ok", raw)
        return self.collector._fetch(self.key)[0]

    def test_live_fetch_rejects_future_without_replacing_votes(self):
        self.assertEqual(self.fetch(raw_result()), "ok")
        previous = copy.deepcopy(self.collector.items[self.key])
        future = raw_result()
        future["hg"] = "18:01:01"
        self.assertEqual(self.fetch(future), "error")
        item = self.collector.items[self.key]
        self.assertEqual(item["generated_at"], previous["generated_at"])
        self.assertEqual(item["candidates"], previous["candidates"])
        self.assertTrue(item["stale"])

    def test_exact_sixty_second_tolerance_and_untimed_precount(self):
        raw = raw_result()
        raw["hg"] = "18:01:00"
        self.assertEqual(self.fetch(raw), "ok")
        raw.update(dt="", ht="", hg="18:01:01")
        raw["s"].update(st="0", snt="2")
        raw["v"] = {"vv": "0", "vb": "0", "tvn": "0"}
        raw["e"]["c"] = "0"
        raw["carg"][0]["agr"][0]["par"][0]["cand"][0]["vap"] = "0"
        self.assertEqual(self.fetch(raw), "error")
        raw["hg"] = "18:01:00"
        self.collector.items[self.key] = pending_item(self.target)
        self.assertEqual(self.fetch(raw), "ok")
        self.assertIsNone(self.collector.items[self.key]["as_of"])

    def test_restore_keeps_archive_times_but_live_fetch_recovers_poisoned_state(self):
        future = raw_result()
        future["hg"] = "19:00:00"
        self.collector.items[self.key] = parse_supplemental(future, self.target)
        self.collector._save()
        self.collector = SupplementalCollector(self.client, self.root, clock=lambda: NOW)
        self.assertEqual(
            self.collector.items[self.key]["generated_at"], "2026-10-25T19:00:00-03:00"
        )
        correction = raw_result()
        correction["carg"][0]["agr"][0]["par"][0]["cand"][0]["vap"] = "70"
        self.assertEqual(self.fetch(correction), "ok")
        self.assertEqual(self.collector.items[self.key]["candidates"][0]["votes"], 70)
        self.assertEqual(
            self.collector.items[self.key]["generated_at"], "2026-10-25T18:00:00-03:00"
        )

    def test_real_client_recovers_after_future_response_populates_transport_cache(self):
        future = raw_result()
        future["hg"] = "19:00:00"
        correction = raw_result()
        correction["carg"][0]["agr"][0]["par"][0]["cand"][0]["vap"] = "70"
        opener = Mock(side_effect=[Response(future, {"ETag": '"futuro"'}), Response(correction)])
        self.collector.client = TSEClient(
            opener=opener, limiter=Mock(acquire=lambda: 0), clock=lambda: NOW
        )
        self.assertEqual(self.collector._fetch(self.key)[0], "error")
        self.assertEqual(self.collector.items[self.key]["status"], "error")
        self.assertEqual(self.collector._fetch(self.key)[0], "ok")
        self.assertIsNone(opener.call_args.args[0].get_header("If-none-match"))
        self.assertEqual(self.collector.items[self.key]["candidates"][0]["votes"], 70)
        self.assertEqual(
            self.collector.items[self.key]["generated_at"], "2026-10-25T18:00:00-03:00"
        )

    def test_publication_checks_own_clock_and_each_official_timestamp(self):
        self.fetch(raw_result())
        payload = self.collector.payload()
        for field in ("updated_at", "as_of", "generated_at"):
            with self.subTest(field=field):
                future = copy.deepcopy(payload)
                row = future if field == "updated_at" else future["exterior"]["cities"][0]
                row[field] = "2026-10-25T21:01:01Z"
                with self.assertRaisesRegex(ValueError, "futuro"):
                    self.publication.publish(future)
                self.assertIsNone(self.local.bucket.get("live/6258/supplemental-latest.json"))
                self.assertFalse(self.publication.path.exists())
        payload["updated_at"] = "2026-10-25T21:01:00Z"
        self.publication.publish(payload)

    def test_recovery_replaces_future_pointer_and_receipt_even_when_material_unchanged(self):
        self.fetch(raw_result())
        future = self.collector.payload()
        future["updated_at"] = "2026-10-25T22:00:00Z"
        self.publication.clock = lambda: NOW + 3600
        poisoned = self.publication.publish(future)
        self.publication.clock = lambda: NOW
        repaired = self.publication.publish(self.collector.payload())
        self.assertNotEqual(repaired["key"], poisoned["key"])
        self.assertEqual(datetime.fromisoformat(repaired["updated_at"]).timestamp(), NOW)
        self.assertEqual(
            json.loads(self.local.bucket.get("live/6258/supplemental-latest.json")), repaired
        )
        self.assertIsNotNone(self.local.bucket.get(poisoned["key"]))

    def test_recovery_allows_lower_votes_but_normal_regression_stays_rejected(self):
        self.fetch(raw_result())
        future = self.collector.payload()
        future["updated_at"] = "2026-10-25T22:00:00Z"
        self.publication.clock = lambda: NOW + 3600
        self.publication.publish(future)
        self.publication.clock = lambda: NOW
        current = self.collector.payload()
        current["exterior"]["cities"][0]["candidates"][0]["votes"] = 70
        repaired = self.publication.publish(current)
        self.assertEqual(
            json.loads(self.local.bucket.get(repaired["key"]))["exterior"]["cities"][0][
                "candidates"
            ][0]["votes"],
            70,
        )
        old = copy.deepcopy(current)
        old["updated_at"] = "2026-10-25T20:59:59Z"
        old["coverage"]["pending"] += 1
        with self.assertRaisesRegex(ValueError, "anterior"):
            self.publication.publish(old)


if __name__ == "__main__":
    unittest.main()
