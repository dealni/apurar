"""Uma pista nova deve sobreviver à resposta antiga servida pela CDN."""

import tempfile
import unittest
from datetime import datetime

from apurar_collector.core.collector import LiveCollector
from apurar_collector.core.tse import result_url
from apurar_collector.runtime import LiveSession
from tests import test_partial_structure_collection
from tests.test_tse import Clock


NOW = datetime.fromisoformat("2026-10-04T21:00:00Z").timestamp()


class TrackingLagTests(unittest.TestCase):
    def test_missing_time_preserves_zero_count_and_waits_for_official_reduction(self):
        client = test_partial_structure_collection.PartialStructureCollectionTests().client("ok")
        original = client.fetch.side_effect
        counted = ["1"]
        corrected = [False]

        def fetch(url):
            response = original(url)
            if "-ab.json" in url:
                for item in response.data["abr"]:
                    item.pop("dt", None)
                    item.pop("ht", None)
                    item["s"]["st"] = counted[0]
            elif corrected[0] and url == result_url("sp00001", "6258"):
                response.data.update(idg="101", hg="18:00:30", ht="18:00:25")
                response.data["s"].update(st="0", snt="2")
            return response

        client.fetch.side_effect = fetch
        collector = LiveCollector(client, clock=lambda: NOW, election="6258")
        collector.cycle()
        counted[0] = "0"
        collector.last_tracking = None
        collector.cycle()
        self.assertIn("sp00001", collector.pending)
        corrected[0] = True
        collector.cycle()
        self.assertNotIn("sp00001", collector.pending)
        self.assertEqual(collector.units["sp00001"]["sections_counted"], 0)
        self.assertTrue(collector.revisions)

    def test_optional_empty_hint_is_unknown_and_malformed_hints_degrade_safely(self):
        for mutation, invalid in (({"st": ""}, False), ({"st": "abc"}, True),
                                  ({"ht": "inválido"}, True)):
            with self.subTest(mutation=mutation):
                client = test_partial_structure_collection.PartialStructureCollectionTests().client("ok")
                original = client.fetch.side_effect

                def fetch(url):
                    response = original(url)
                    if "-ab.json" in url:
                        for item in response.data["abr"]:
                            if "st" in mutation:
                                item["s"]["st"] = mutation["st"]
                            else:
                                item.update(mutation)
                    return response

                client.fetch.side_effect = fetch
                collector = LiveCollector(client, clock=lambda: NOW, election="6258")
                collector.cycle()
                self.assertEqual(bool(collector.tracking_failures), invalid)
                if not invalid:
                    self.assertFalse(collector.pending)
                    self.assertIsNone(collector.tracking_hints["sp00001"][2])

    def test_identical_old_result_keeps_hint_pending_until_detail_catches_up(self):
        clock = Clock()
        client = test_partial_structure_collection.PartialStructureCollectionTests().client("ok")
        original = client.fetch.side_effect
        hint = ["17:59:55"]

        def fetch(url):
            response = original(url)
            if "-ab.json" in url:
                for item in response.data["abr"]:
                    item.pop("dt", None)
                    item["ht"] = hint[0]
            elif url == result_url("sp00001", "6258") and client.sp_idg == "101":
                response.data["ht"] = "18:00:55"
            return response

        client.fetch.side_effect = fetch
        collector = LiveCollector(client, clock=lambda: NOW + clock() - 1000,
                                  election="6258")
        collector.cycle()
        self.assertFalse(collector.pending)
        hint[0] = "18:00:55"
        clock.now = 1045
        collector.cycle()
        self.assertIn("sp00001", collector.pending)
        self.assertEqual(collector.units["sp00001"]["idg"], "100")
        client.fetch.reset_mock()
        client.sp_idg, client.sp_time = "101", "18:01:00"
        clock.now = 1090
        collector.cycle()
        self.assertIn(result_url("sp00001", "6258"), [
            call.args[0] for call in client.fetch.call_args_list
        ])
        self.assertEqual(collector.units["sp00001"]["idg"], "101")
        self.assertNotIn("sp00001", collector.pending)
        client.fetch.reset_mock()
        clock.now = 1092
        collector.cycle()
        self.assertNotIn(result_url("sp00001", "6258"), [
            call.args[0] for call in client.fetch.call_args_list
        ])

    def test_restart_rebuilds_pending_from_persisted_result_and_current_hint(self):
        client = test_partial_structure_collection.PartialStructureCollectionTests().client("ok")
        with tempfile.TemporaryDirectory() as directory:
            session = LiveSession(directory, client)
            session.collector.clock = lambda: NOW
            try:
                session.cycle()
            finally:
                session.close()
            client.sp_time = client.sp_hint_time = "18:01:00"
            original = client.fetch.side_effect

            def fetch(url):
                response = original(url)
                if url == result_url("sp00001", "6258"):
                    response.data["hg"] = "18:00:00"
                return response

            client.fetch.side_effect = fetch
            restarted = LiveSession(directory, client)
            restarted.collector.clock = lambda: NOW + 60
            try:
                restarted.cycle()
                self.assertIn("sp00001", restarted.collector.pending)
                self.assertEqual(restarted.collector.units["sp00001"]["idg"], "100")
            finally:
                restarted.close()
