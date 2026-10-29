"""Cache com geração futura não impede recuperar a resposta oficial corrente."""

import unittest
from datetime import datetime
from unittest.mock import Mock
from urllib.error import HTTPError

from apurar_collector.core.tse import TSEClient, result_url
from tests.test_tse import Response, fixture


NOW = datetime.fromisoformat("2026-10-04T21:00:00Z").timestamp()


class TSEFutureClockTests(unittest.TestCase):
    def client(self, responses):
        opener = Mock(side_effect=responses)
        limiter = Mock()
        limiter.acquire.return_value = 0
        return TSEClient(opener=opener, limiter=limiter, clock=lambda: NOW), opener

    def test_future_cache_recovers_without_conditionals_or_vote_monotonicity(self):
        future = fixture()
        future["hg"] = "19:00:00"
        current = fixture()
        current["carg"][0]["agr"][0]["par"][0]["cand"][0]["vap"] = "70"
        for headers in ({"ETag": "future"}, {"Last-Modified": "future"}):
            with self.subTest(headers=headers):
                client, opener = self.client([Response(future, headers), Response(current)])
                self.assertEqual(client.fetch(result_url()).status, "ok")
                recovered = client.fetch(result_url())
                self.assertEqual(recovered.status, "ok")
                self.assertTrue(recovered.changed)
                self.assertEqual(recovered.data, current)
                request = opener.call_args.args[0]
                self.assertIsNone(request.get_header("If-none-match"))
                self.assertIsNone(request.get_header("If-modified-since"))

    def test_future_cache_is_not_returned_for_unexpected_304(self):
        future = fixture()
        future["hg"] = "19:00:00"
        client, _ = self.client([
            Response(future, {"ETag": "future"}),
            HTTPError(result_url(), 304, "Not Modified", {}, None),
        ])
        client.fetch(result_url())
        self.assertEqual(client.fetch(result_url()).status, "error")

    def test_sixty_second_tolerance_preserves_normal_rollback_protection(self):
        for time in ("18:00:30", "18:01:00"):
            with self.subTest(time=time):
                current = fixture()
                current["hg"] = time
                client, opener = self.client([
                    Response(current, {"ETag": "current"}), Response(fixture()),
                ])
                client.fetch(result_url())
                self.assertEqual(client.fetch(result_url()).status, "error")
                self.assertEqual(client.cache[result_url()][1], "current")
                self.assertEqual(opener.call_args.args[0].get_header("If-none-match"), "current")

    def test_older_future_response_does_not_replace_future_cache(self):
        future = fixture()
        future["hg"] = "19:00:00"
        still_future = fixture()
        still_future["hg"] = "18:01:01"
        client, _ = self.client([Response(future), Response(still_future)])
        client.fetch(result_url())
        self.assertEqual(client.fetch(result_url()).status, "error")
        self.assertEqual(client.cache[result_url()][0], future)


if __name__ == "__main__":
    unittest.main()
