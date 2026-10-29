"""Cadência territorial, bloqueio e saúde sem reescrever votos nem horários."""

import json
import tempfile
import unittest
from pathlib import Path
from unittest.mock import Mock
from urllib.error import HTTPError

from apurar_collector.core.collector import LiveCollector
from apurar_collector.core.config import TIMING
from apurar_collector.core.tse import FetchResult, RateLimiter, TSEClient, result_url
from apurar_collector.demo import fixture
from apurar_collector.health import report
from apurar_collector.runtime import Runtime
from tests.test_tse import Clock


class TimingHealthTests(unittest.TestCase):
    def test_tracking_sweeps_all_states_by_deadline_without_duplicate_queue(self):
        clock = Clock()
        client = Mock()
        states = ['ac', 'al', 'am', 'ap', 'ba', 'ce', 'df', 'es', 'go', 'ma', 'mg', 'ms', 'mt', 'pa', 'pb', 'pe', 'pi', 'pr', 'rj', 'rn', 'ro', 'rr', 'rs', 'sc', 'se', 'sp', 'to']
        collector = LiveCollector(client, clock=clock, election="6258")
        collector.catalog = {uf + "00001": {"scope": uf + "00001", "uf": uf.upper()} for uf in states}
        client.fetch.return_value = FetchResult("ok", {})
        collector._apply_tracking = Mock(side_effect=lambda uf, value: (collector.structural_states.add(uf), collector._queue(uf + "00001")))
        collector._tracking()
        self.assertEqual(client.fetch.call_count, 27)
        self.assertEqual(len(collector.pending), 27)
        clock.now += TIMING["trackingSweepSeconds"] - 1
        collector._tracking()
        self.assertEqual(client.fetch.call_count, 27)
        clock.now += 1
        collector._tracking()
        self.assertEqual(client.fetch.call_count, 54)
        self.assertEqual(len(collector.pending), 27)
        self.assertEqual({call.args[0] for call in collector._apply_tracking.call_args_list}, set(states))

    def test_default_block_ten_minutes_and_longer_retry_after_is_respected(self):
        for retry_after, expected in [(None, 600), ("2", 600), ("900", 900), ("Thu, 01 Jan 1970 00:40:00 GMT", 1400)]:
            with self.subTest(retry_after=retry_after):
                clock = Clock()
                headers = {"Retry-After": retry_after} if retry_after else {}
                opener = Mock(side_effect=HTTPError(result_url(), 429, "Blocked", headers, None))
                client = TSEClient(opener=opener, clock=clock, limiter=RateLimiter(clock=clock, sleep=clock.sleep))
                result = client.fetch(result_url())
                self.assertEqual(result.retry_at, 1000 + expected)
                clock.now += expected - 1
                self.assertEqual(client.fetch(result_url()).status, "backoff")
                self.assertEqual(opener.call_count, 1)
                self.assertEqual(client.limiter.blocked_until, 1000 + expected)
                clock.now += 1
                client.fetch(result_url())
                self.assertEqual(opener.call_count, 2)

    def test_municipal_retry_after_survives_fanout(self):
        collector = LiveCollector(Mock(), clock=lambda: 1000)
        collector.client.fetch.return_value = FetchResult("backoff", retry_at=1600)
        collector._fetch_unit("sp00001")
        self.assertEqual(collector.collection_backoff, 1600)

    def test_health_is_separate_from_unchanged_result_and_failure_is_nonfatal(self):
        collection, prior = fixture("2020-01-01T00:00:00Z")
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            runtime = Runtime(prior, root / "state", root / "bucket")
            snapshot, pointer = runtime.emit(collection, mode="live")
            original = runtime.local.bucket.get("live/6258/latest.json")
            report(runtime, {"status": "live", "progress": {"last_success": 1000, "units_pending": 12}}, 2.5)
            health = json.loads(runtime.local.bucket.get("live/6258/health.json"))
            self.assertEqual(health["status"], "live")
            self.assertEqual(health["cycle_seconds"], 2.5)
            self.assertEqual(health["pending_units"], 12)
            self.assertEqual(health["last_success_at"], "1970-01-01T00:16:40+00:00")
            self.assertEqual(runtime.local.bucket.get("live/6258/latest.json"), original)
            self.assertEqual(json.loads(original)["snapshot_id"], snapshot["snapshot_id"])
            runtime.remote = Mock()
            runtime.remote.bucket.put.side_effect = OSError("offline")
            report(runtime, {"status": "live"}, 3, failed=True)
            self.assertEqual(json.loads((runtime.state_dir / "health-live.json").read_text())["status"], "error")
            self.assertEqual(runtime.local.bucket.get("live/6258/latest.json"), original)
