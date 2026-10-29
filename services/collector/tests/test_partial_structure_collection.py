"""Bootstrap parcial de EA15 não interrompe municípios de UFs saudáveis."""

import tempfile
import unittest
from datetime import datetime
from unittest.mock import Mock

from apurar_collector.core.collector import LiveCollector
from apurar_collector.core.tse import FetchResult, config_url, result_url, tracking_url
from apurar_collector.runtime import LiveSession
from apurar_collector.snapshot import build
from tests.test_tse import Clock, fixture


NOW = datetime.fromisoformat("2026-10-04T21:00:00Z").timestamp()


class PartialStructureCollectionTests(unittest.TestCase):
    def client(self, ac_status="error"):
        client = Mock()

        def fetch(url):
            if url == config_url("6258"):
                return FetchResult("ok", {
                    "f": "o", "abr": [
                        {"cd": uf, "mu": [{"cd": "1", "nm": uf.upper()}]}
                        for uf in ("ac", "sp")
                    ],
                })
            for uf in ("ac", "sp"):
                if url != tracking_url(uf, "6258"):
                    continue
                if uf == "ac" and client.ac_status != "ok":
                    return FetchResult(client.ac_status, error="EA15 indisponível", retry_at=NOW + 600)
                return FetchResult("ok", {
                    "ele": "6258", "t": "2", "f": "o", "abr": [{
                        "tpabr": "mu", "cdabr": "1", "s": {"ts": "2", "st": "1"},
                        "dt": "04/10/2026",
                        "ht": client.sp_hint_time if uf == "sp" else "17:59:55",
                        "e": {"te": "500"},
                    }],
                })
            for scope in ("br", "ac00001", "sp00001", "zz"):
                if url == result_url(scope, "6258"):
                    raw = fixture(scope)
                    raw.update(ele="6258", t="2")
                    if scope == "sp00001":
                        raw.update(idg=client.sp_idg, hg=client.sp_time, ht=client.sp_totalized_time)
                    return FetchResult("ok", raw)
            raise AssertionError("URL inesperada: " + url)

        client.ac_status = ac_status
        client.sp_idg = "100"
        client.sp_time = "18:00:00"
        client.sp_hint_time = client.sp_totalized_time = "17:59:55"
        client.fetch.side_effect = fetch
        return client

    def test_bootstrap_partial_collects_known_state_and_preserves_official_feed(self):
        client = self.client()
        with tempfile.TemporaryDirectory() as directory:
            session = LiveSession(directory, client)
            try:
                session.collector.clock = lambda: NOW
                collection, status = session.cycle()
                self.assertEqual(set(session.collector.units), {"sp00001", "zz"})
                self.assertNotIn(result_url("ac00001", "6258"), [
                    call.args[0] for call in client.fetch.call_args_list
                ])
                self.assertEqual(list(session.collector.pending), ["ac00001"])
                self.assertEqual(status["status"], "degraded")
                self.assertEqual(status["progress"]["tracking_failed_states"], ["ac"])
                self.assertEqual(status["progress"]["structural_states_received"], 1)
                self.assertEqual(status["progress"]["structural_states_total"], 2)
                self.assertEqual(status["next_poll_seconds"], 2)
                self.assertIsNone(session.collector.last_tracking_success)
                self.assertIn("coleta municipal parcial", collection["projection_block_reason"])
                snapshot = build(collection, {}, mode="live", collected_at="2026-10-25T20:00:00Z", published_at="2026-10-25T20:00:00Z")
                self.assertFalse(snapshot["projection"]["available"])
                self.assertEqual(snapshot["candidates"][0]["votes"], 80)
            finally:
                session.close()

    def test_unknown_state_at_queue_front_does_not_starve_known_state(self):
        collector = LiveCollector(self.client(), clock=lambda: NOW, election="6258", batch_size=1)
        collector.cycle()
        collector.batch_size = 1
        collector.cycle()
        self.assertIn("sp00001", collector.units)
        self.assertIn("ac00001", collector.pending)
        self.assertNotIn("ac00001", collector.units)

    def test_failing_priority_detail_does_not_starve_known_state(self):
        client = self.client()
        normal_fetch = client.fetch.side_effect

        def fetch(url):
            if url == result_url("zz", "6258"):
                return FetchResult("error", error="Exterior indisponível")
            return normal_fetch(url)

        client.fetch.side_effect = fetch
        collector = LiveCollector(client, clock=lambda: NOW, election="6258", batch_size=1)
        collector.cycle()
        self.assertNotIn("sp00001", collector.units)
        collector.batch_size = 1
        collector.cycle()
        self.assertIn("sp00001", collector.units)
        self.assertIn("zz", collector.pending)
        self.assertIn("ac00001", collector.pending)

    def test_failed_structure_recovers_and_drains_preserved_queue(self):
        client = self.client()
        collector = LiveCollector(client, clock=lambda: NOW, election="6258")
        collector.cycle()
        client.ac_status = "ok"
        status = collector.cycle()
        self.assertEqual(set(collector.units), {"ac00001", "sp00001", "zz"})
        self.assertFalse(collector.pending)
        self.assertFalse(collector.tracking_failures)
        self.assertEqual(collector.last_tracking_success, NOW)
        self.assertEqual(status["status"], "live")

    def test_tracking_backoff_still_prevents_all_municipal_requests(self):
        client = self.client("backoff")
        collector = LiveCollector(client, clock=lambda: NOW, election="6258")
        status = collector.cycle()
        self.assertEqual(status["status"], "backoff")
        self.assertEqual(status["retry_at"], NOW + 600)
        self.assertFalse(collector.units)
        requested = {call.args[0] for call in client.fetch.call_args_list}
        for scope in ("ac00001", "sp00001", "zz"):
            self.assertNotIn(result_url(scope, "6258"), requested)

    def test_missing_state_retries_do_not_postpone_healthy_state_sweep(self):
        clock = Clock()
        clock.now = NOW
        client = self.client()
        collector = LiveCollector(client, clock=clock, election="6258")
        collector.cycle()
        for now in (NOW + 2, NOW + 44):
            clock.now = now
            collector.cycle()
        client.fetch.reset_mock()
        client.sp_idg = "101"
        client.sp_time = "18:01:00"
        client.sp_hint_time = client.sp_totalized_time = "18:00:55"
        clock.now = NOW + 45
        status = collector.cycle()
        requested = [call.args[0] for call in client.fetch.call_args_list]
        self.assertEqual(requested.count(tracking_url("sp", "6258")), 1)
        self.assertEqual(requested.count(tracking_url("ac", "6258")), 1)
        self.assertEqual(requested.count(result_url("sp00001", "6258")), 1)
        self.assertEqual(collector.units["sp00001"]["idg"], "101")
        self.assertEqual(collector.last_tracking, NOW + 45)
        self.assertEqual(status["status"], "degraded")
        self.assertEqual(status["progress"]["tracking_failed_states"], ["ac"])
        client.fetch.reset_mock()
        clock.now = NOW + 47
        collector.cycle()
        requested = [call.args[0] for call in client.fetch.call_args_list]
        self.assertNotIn(tracking_url("sp", "6258"), requested)
        self.assertEqual(collector.last_tracking, NOW + 45)
