"""Amostras sintéticas e prazo municipal, sem acesso à fonte."""

import unittest

from apurar_collector.core.adaptive import next_batch_size
from apurar_collector.core.collector import LiveCollector
from apurar_collector.core.tse import parse_result
from tests.test_tse import fixture


class AdaptiveBatchTests(unittest.TestCase):
    def test_fast_complete_passes_grow_gradually_and_never_exceed_512(self):
        size = 256
        for expected in (384, 512, 512):
            size = next_batch_size(size, size, 3, 0, False, False)
            self.assertEqual(size, expected)

    def test_growth_respects_measured_capacity_to_avoid_deadline_oscillation(self):
        size = next_batch_size(384, 384, 6, 0, False, False)
        self.assertEqual(size, 486)
        self.assertLessEqual(size, 384 / 6 * 8 * 0.95)
        # A mesma velocidade sustenta o novo lote dentro do prazo.
        self.assertEqual(next_batch_size(size, size, size / 64, 0, False, False), size)

    def test_insufficient_samples_and_short_tail_do_not_grow(self):
        for count, elapsed in ((10, 1), (256, 0.01), (100, 1)):
            self.assertEqual(next_batch_size(256, count, elapsed, 0, False, False), 256)

    def test_slow_timeout_and_error_samples_reduce_without_changing_backoff(self):
        self.assertLess(next_batch_size(256, 256, 8, 0, False, False), 256)
        self.assertEqual(next_batch_size(256, 80, 10, 0, True, False), 40)
        self.assertEqual(next_batch_size(256, 200, 3, 1, False, False), 100)
        self.assertEqual(next_batch_size(256, 80, 10, 1, True, True), 256)

    def test_deadline_requeues_all_unstarted_in_original_order_and_can_progress(self):
        now = [0]
        collector = LiveCollector(monotonic=lambda: now[0])
        scopes = ["sp" + str(i).zfill(5) for i in range(40)]
        called = []

        def fetch(scope):
            called.append(scope)
            now[0] = 9
            return scope, parse_result(fixture(scope), scope), None, "ok"

        collector._fetch_unit = fetch
        collector._collect_batch(scopes)
        self.assertGreater(len(called), 0)
        self.assertLessEqual(len(called), 8)
        self.assertEqual(set(collector.units) | set(collector.pending), set(scopes))
        self.assertEqual(list(collector.pending), [s for s in scopes if s not in called])
        self.assertEqual(len(collector.pending), len(collector.queued))
        # A passagem seguinte reinicia o prazo, sem starvation do restante.
        remaining = list(collector.pending)
        collector.pending.clear()
        collector.queued.clear()
        collector._collect_batch(remaining)
        self.assertGreater(len(collector.units), len(scopes) - len(remaining))


if __name__ == "__main__":
    unittest.main()
