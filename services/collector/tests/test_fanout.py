import threading
import unittest

from apurar_collector.core.collector import LiveCollector
from apurar_collector.core.config import TSE_BACKOFF_SECONDS
from apurar_collector.core.fanout import fetch_window
from tests.test_tse import fixture
from apurar_collector.core.tse import parse_result


class FanoutTests(unittest.TestCase):
    def test_fast_slot_is_reused_before_slow_first_request_finishes(self):
        release_first = threading.Event()
        ninth_started = threading.Event()
        lock = threading.Lock()
        active = 0
        maximum = 0

        def fetch(item):
            nonlocal active, maximum
            with lock:
                active += 1
                maximum = max(maximum, active)
            try:
                if item == 0:
                    self.assertTrue(release_first.wait(2))
                if item == 8:
                    ninth_started.set()
                    release_first.set()
                return item
            finally:
                with lock:
                    active -= 1

        try:
            result = list(fetch_window(range(20), fetch, lambda: False, 8))
        finally:
            release_first.set()
        self.assertTrue(ninth_started.is_set())
        self.assertEqual(sorted(result), list(range(20)))
        self.assertLessEqual(maximum, 8)

    def test_consumer_backoff_stops_refilling_and_delivers_inflight(self):
        stop = threading.Event()
        called = []

        def fetch(item):
            called.append(item)
            return item

        results = []
        for result in fetch_window(range(40), fetch, stop.is_set, 8):
            results.append(result)
            stop.set()
        self.assertEqual(sorted(called), list(range(8)))
        self.assertEqual(sorted(results), list(range(8)))

    def test_preexisting_stop_starts_no_requests(self):
        self.assertEqual(list(fetch_window(range(20), self.fail, lambda: True, 8)), [])

    def test_stop_requeues_unstarted_units_without_losing_accepted_results(self):
        collector = LiveCollector()
        scopes = ["sp" + str(i).zfill(5) for i in range(40)]

        def fetch(scope):
            collector.stop()
            return scope, parse_result(fixture(scope), scope), None, "ok"

        collector._fetch_unit = fetch
        collector._collect_batch(scopes)
        self.assertTrue(collector.units)
        self.assertLessEqual(len(collector.units), 8)
        self.assertEqual(set(collector.pending) | set(collector.units), set(scopes))
        self.assertEqual(len(collector.pending), len(collector.queued))
        self.assertEqual(list(collector.pending), [s for s in scopes if s not in collector.units])

    def test_backoff_retains_every_unfinished_scope_for_next_cycle(self):
        collector = LiveCollector(clock=lambda: 1000)
        scopes = ["sp" + str(i).zfill(5) for i in range(40)]
        called = []

        def fetch(scope):
            called.append(scope)
            return scope, None, "HTTP 429", "backoff"

        collector._fetch_unit = fetch
        collector._collect_batch(scopes)
        self.assertEqual(len(called), 8)
        self.assertEqual(set(collector.pending), set(scopes))
        self.assertEqual(collector.collection_backoff, 1000 + TSE_BACKOFF_SECONDS)

    def test_unexpected_client_failure_preserves_entire_unfinished_queue(self):
        collector = LiveCollector()
        scopes = ["sp" + str(i).zfill(5) for i in range(40)]

        def fetch(scope):
            raise OSError("falha local simulada")

        collector._fetch_unit = fetch
        with self.assertRaises(OSError):
            collector._collect_batch(scopes)
        self.assertEqual(list(collector.pending), scopes)


if __name__ == "__main__":
    unittest.main()
