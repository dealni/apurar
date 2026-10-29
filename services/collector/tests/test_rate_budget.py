"""Limites da fonte testados sem rede, com relógio determinístico."""

import unittest
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime
from urllib.error import HTTPError
from urllib.request import Request

from apurar_collector.core.config import TSE_OFFICIAL_REQUESTS_PER_SECOND
from apurar_collector.core.tse import (
    OfficialRedirectHandler,
    RateLimiter,
    SourceBackoffError,
    TSEClient,
    result_url,
    tracking_url,
)
from tests.test_tse import Clock, Response, fixture


class RateBudgetTests(unittest.TestCase):
    def test_parallel_grants_never_exceed_seventy_in_any_closed_second(self):
        clock = Clock()
        limiter = RateLimiter(1000, clock, clock.sleep)

        def acquire(_):
            # Registrar dentro da concessão evita o agendamento do executor
            # alterar o instante observado após sair da trava.
            self.assertEqual(limiter.acquire(), 0)

        granted = []
        original_sleep = limiter.sleep

        def record_sleep(seconds):
            original_sleep(seconds)
            granted.append(clock())

        limiter.sleep = record_sleep
        with ThreadPoolExecutor(max_workers=16) as executor:
            list(executor.map(acquire, range(500)))
        self.assertEqual(len(granted), 500)
        for start in granted:
            self.assertLessEqual(sum(start <= point <= start + 1 for point in granted), 70)
        self.assertEqual(TSE_OFFICIAL_REQUESTS_PER_SECOND, 100)

    def test_conditional_and_failed_requests_consume_the_shared_budget(self):
        clock = Clock()
        clock.now = datetime.fromisoformat("2026-10-04T21:02:00Z").timestamp()
        attempts = []
        url = result_url()
        responses = [
            Response(fixture(), {"ETag": "cached"}),
            HTTPError(url, 304, "Not Modified", {}, None),
            HTTPError(url, 500, "Error", {}, None),
        ]

        def open_source(request, timeout):
            attempts.append(clock())
            response = responses.pop(0)
            if isinstance(response, Exception):
                raise response
            return response

        limiter = RateLimiter(clock=clock, sleep=clock.sleep)
        client = TSEClient(opener=open_source, limiter=limiter, clock=clock)
        self.assertEqual(client.fetch(url).status, "ok")
        self.assertEqual(client.fetch(url).status, "ok")
        self.assertEqual(client.fetch(url).status, "error")
        self.assertEqual(len(attempts), 3)
        for previous, current in zip(attempts, attempts[1:]):
            self.assertGreater(current - previous, 1 / 70)

    def test_block_stops_other_clients_and_does_not_extend_without_request(self):
        for code in (403, 429):
            with self.subTest(code=code):
                clock = Clock()
                limiter = RateLimiter(clock=clock, sleep=clock.sleep)
                attempts = []

                def blocked(request, timeout):
                    attempts.append(request.full_url)
                    raise HTTPError(request.full_url, code, "Blocked", {}, None)

                first = TSEClient(opener=blocked, limiter=limiter, clock=clock)
                second = TSEClient(opener=blocked, limiter=limiter, clock=clock)
                self.assertEqual(first.fetch(result_url()).status, "backoff")
                until = limiter.blocked_until
                self.assertEqual(until, 1600)
                self.assertEqual(second.fetch(tracking_url("sp")).status, "backoff")
                self.assertEqual(len(attempts), 1)
                self.assertEqual(limiter.blocked_until, until)

    def test_redirects_validate_target_and_consume_budget(self):
        clock = Clock()
        limiter = RateLimiter(clock=clock, sleep=clock.sleep)
        handler = OfficialRedirectHandler(limiter)
        limiter.acquire()
        request = Request(result_url())
        redirect = handler.redirect_request(request, None, 302, "Found", {}, tracking_url("sp"))
        self.assertEqual(redirect.full_url, tracking_url("sp"))
        self.assertGreater(clock() - 1000, 1 / 70)
        with self.assertRaises(ValueError):
            handler.redirect_request(request, None, 302, "Found", {}, "https://example.com/no")
        limiter.block(900)
        with self.assertRaises(SourceBackoffError):
            handler.redirect_request(request, None, 302, "Found", {}, tracking_url("sp"))


if __name__ == "__main__":
    unittest.main()
