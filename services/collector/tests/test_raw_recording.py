"""Captura bruta confirma a gravação antes de reutilizar o cache HTTP."""

import json
import tempfile
import unittest
from datetime import datetime
from pathlib import Path
from unittest.mock import Mock, patch
from urllib.error import HTTPError

from apurar_collector.core.tse import RateLimiter, result_url
from apurar_collector.runtime import RecordingClient
from tests.test_tse import Clock, Response, fixture


class RawRecordingTests(unittest.TestCase):
    def test_failed_capture_retries_after_304_even_with_previous_capture(self):
        for operation in ("write_bytes", "replace"):
            with self.subTest(operation=operation), tempfile.TemporaryDirectory() as root:
                url = result_url()
                clock = Clock()
                clock.now = datetime.fromisoformat("2026-10-04T21:02:00Z").timestamp()
                updated = fixture()
                updated.update(hg="18:01:00", idg="101")
                opener = Mock(side_effect=[
                    Response(fixture(), {"ETag": "old"}),
                    Response(updated, {"ETag": "new"}),
                    HTTPError(url, 304, "Not Modified", {}, None),
                    HTTPError(url, 304, "Not Modified", {}, None),
                ])
                client = RecordingClient(
                    root, opener=opener, clock=clock,
                    limiter=RateLimiter(clock=clock, sleep=clock.sleep),
                )
                self.assertTrue(client.fetch(url).changed)
                with patch.object(Path, operation, side_effect=OSError("disco indisponível")):
                    with self.assertRaises(OSError):
                        client.fetch(url)
                self.assertFalse(client.fetch(url).changed)
                captures = [json.loads(path.read_text())
                            for path in client.archive.glob("*.json")]
                self.assertEqual({value["data"]["idg"] for value in captures}, {"100", "101"})
                self.assertTrue(all(value["url"] == url for value in captures))
                # A captura confirmada não precisa ser gravada a cada consulta.
                with patch.object(Path, "write_bytes", side_effect=AssertionError("gravação repetida")):
                    self.assertFalse(client.fetch(url).changed)


if __name__ == "__main__":
    unittest.main()
