"""Pausa TSE sobrevive ao reinício, sem consulta de teste à fonte."""

import json
import tempfile
import unittest
from pathlib import Path
from unittest.mock import Mock, patch
from urllib.error import HTTPError

from apurar_collector.core.tse import RateLimiter, TSEClient, result_url, tracking_url
from apurar_collector.runtime import RecordingClient
from tests.test_tse import Clock, Response, fixture


class PersistentBackoffTests(unittest.TestCase):
    def client(self, root, clock, opener=None, limiter=None):
        return RecordingClient(root, clock=clock, opener=opener or Mock(),
                               limiter=limiter or RateLimiter(clock=clock, sleep=clock.sleep))

    def test_resume_preserves_only_remaining_time_and_noop_does_not_rewrite(self):
        for code, retry, duration in ((403, None, 600), (429, "900", 900)):
            with self.subTest(code=code), tempfile.TemporaryDirectory() as root:
                clock = Clock()
                headers = {"Retry-After": retry} if retry else {}
                opener = Mock(side_effect=HTTPError(result_url(), code, "Blocked", headers, None))
                self.assertEqual(self.client(root, clock, opener).fetch(result_url()).status, "backoff")
                path = Path(root) / "tse-backoff.json"
                body = path.read_bytes()
                self.assertEqual(json.loads(body), {"retry_at": 1000 + duration})
                clock.now += 100
                resumed_open = Mock(return_value=Response(fixture()))
                resumed = self.client(root, clock, resumed_open)
                self.assertEqual(resumed.limiter.blocked_until, 1000 + duration)
                self.assertEqual(resumed.fetch(result_url()).status, "backoff")
                resumed_open.assert_not_called()
                self.assertEqual(path.read_bytes(), body)
                clock.now = 1000 + duration + 1
                expired = self.client(root, clock, resumed_open)
                self.assertEqual(expired.fetch(result_url()).status, "ok")
                self.assertEqual(path.read_bytes(), body)

    def test_restored_pause_is_shared_with_other_clients(self):
        with tempfile.TemporaryDirectory() as root:
            Path(root, "tse-backoff.json").write_text('{"retry_at":1200}')
            clock = Clock()
            limiter = RateLimiter(clock=clock, sleep=clock.sleep)
            self.client(root, clock, limiter=limiter)
            opener = Mock()
            other = TSEClient(clock=clock, opener=opener, limiter=limiter)
            self.assertEqual(other.fetch(tracking_url("sp")).status, "backoff")
            self.assertEqual(limiter.blocked_until, 1200)
            opener.assert_not_called()

    def test_invalid_state_fails_closed_and_replaces_it_without_logging_contents(self):
        for body in ('not json', '{}', '[]', '{"retry_at":true}', '{"retry_at":NaN}', '{"retry_at":-1}'):
            with self.subTest(body=body), tempfile.TemporaryDirectory() as root:
                path = Path(root, "tse-backoff.json")
                path.write_text(body)
                clock = Clock()
                opener = Mock()
                with self.assertLogs("apurar.collector", level="WARNING") as logs:
                    client = self.client(root, clock, opener)
                self.assertEqual(json.loads(path.read_text()), {"retry_at":1600})
                self.assertEqual(client.fetch(result_url()).status, "backoff")
                opener.assert_not_called()
                self.assertIn("pausa de segurança", logs.output[0])

    def test_callback_failure_does_not_release_global_block_or_fail_fetch(self):
        clock = Clock()
        limiter = RateLimiter(clock=clock, sleep=clock.sleep)
        opener = Mock(side_effect=HTTPError(result_url(), 429, "Blocked", {}, None))
        callback = Mock(side_effect=OSError("secret error must not be logged"))
        client = TSEClient(clock=clock, opener=opener, limiter=limiter, on_block=callback)
        with self.assertLogs("apurar_collector.core.tse", level="WARNING") as logs:
            self.assertEqual(client.fetch(result_url()).status, "backoff")
        self.assertNotIn("secret", " ".join(logs.output))
        self.assertEqual(client.fetch(tracking_url("sp")).status, "backoff")
        self.assertEqual(opener.call_count, 1)
        callback.assert_called_once_with(1600)
        self.assertEqual(limiter.blocked_until, 1600)

    def test_invalid_file_write_failure_still_blocks_in_memory(self):
        with tempfile.TemporaryDirectory() as root:
            Path(root, "tse-backoff.json").write_text('{}')
            clock = Clock()
            with patch("apurar_collector.runtime.atomic", side_effect=OSError("private")):
                with self.assertLogs("apurar.collector", level="WARNING") as logs:
                    client = self.client(root, clock)
            self.assertEqual(client.limiter.blocked_until, 1600)
            self.assertNotIn("private", " ".join(logs.output))


if __name__ == "__main__":
    unittest.main()
