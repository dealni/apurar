"""Orçamento, concorrência e justiça do suplemento sem rede real."""
import tempfile
import threading
import unittest
from unittest.mock import patch

from apurar_collector.supplemental import SupplementalCollector, catalog_targets
from apurar_collector.supplemental_tse import pending_item


def seed(collector, cities=40):
    raw = {"f": "o", "abr": [{"cd": "zz", "ds": "EXTERIOR", "mu": [
        {"cd": str(29000 + index), "nm": "TESTE", "z": ["0001"]}
        for index in range(cities)]}]}
    for target in catalog_targets(raw, "6258", {}):
        key = "6258:" + target["id"]
        collector.targets[key] = target
        collector.items[key] = pending_item(target)
    collector.catalog_checked_at = collector.clock()


class SupplementalThroughputTests(unittest.TestCase):
    def test_zero_window_does_not_start_catalog_network_requests(self):
        class Client:
            def fetch(self, url):
                raise AssertionError("Prazo esgotado não pode iniciar rede")
        with tempfile.TemporaryDirectory() as directory:
            collector = SupplementalCollector(Client(), directory, clock=lambda: 1000,
                                                monotonic=lambda: 1)
            collector.step(max_seconds=0)

    def test_parallel_detail_lot_uses_eight_workers_and_one_client(self):
        with tempfile.TemporaryDirectory() as directory:
            collector = SupplementalCollector(object(), directory, clock=lambda: 1000)
            seed(collector)
            barrier = threading.Barrier(8, timeout=2)
            seen = []
            def fetch(key):
                seen.append((key, collector.client))
                barrier.wait()
                return "ok", 0
            collector._fetch = fetch
            collector.step(budget=8)
            self.assertEqual(len(seen), 8)
            self.assertTrue(all(client is collector.client for _, client in seen))
            self.assertEqual(len({key for key, _ in seen}), 8)

    def test_deadline_preserves_municipal_cursor_without_restarting_scan(self):
        with tempfile.TemporaryDirectory() as directory:
            tick = [0]
            collector = SupplementalCollector(None, directory, clock=lambda: 1000,
                                                monotonic=lambda: tick[0])
            seed(collector)
            seen = []
            def fetch(key):
                seen.append(collector.targets[key]["kind"])
                return "ok", 0
            def window(jobs, fetcher, halted, workers):
                while not halted():
                    try:
                        key = next(jobs)
                    except StopIteration:
                        return
                    result = fetcher(key)
                    tick[0] += 0.6
                    yield result
            collector._fetch = fetch
            with patch("apurar_collector.supplemental.fetch_window", window):
                collector.step(budget=128, max_seconds=1)
                collector.step(budget=128, max_seconds=1)
            self.assertEqual(seen, ["city"] * 4)
            self.assertEqual(collector.cursors["detail"], 4)

    def test_budgets_persist_cursor_and_catalog_without_duplicate_detail(self):
        with tempfile.TemporaryDirectory() as directory:
            collector = SupplementalCollector(None, directory, clock=lambda: 1000)
            seed(collector, 12)
            seen = []
            def fetch(key):
                seen.append(key)
                return "ok", 0
            collector._fetch = fetch
            collector.step(budget=40)
            self.assertEqual(sum(collector.targets[k]["kind"] == "city" for k in seen), 12)
            self.assertEqual(len(seen), 12)
            restored = SupplementalCollector(None, directory, clock=lambda: 1000)
            self.assertEqual(restored.catalog_checked_at, 1000)
            self.assertEqual(restored.cursors, collector.cursors)
            restored._catalogs()  # cliente None: catálogo persistido evita rede no reinício.

    def test_backoff_stops_next_batch_and_detail_retry_survives_restart(self):
        with tempfile.TemporaryDirectory() as directory:
            collector = SupplementalCollector(None, directory, clock=lambda: 1000)
            seed(collector)
            calls = []
            def fetch(key):
                calls.append(key)
                return "backoff", 1600
            collector._fetch = fetch
            collector.step(budget=128)
            self.assertEqual(len(calls), 8)
            restored = SupplementalCollector(None, directory, clock=lambda: 1000)
            detail_calls = [key for key in calls if collector.targets[key]["kind"] == "city"]
            self.assertEqual(restored.detail_retry, dict.fromkeys(detail_calls, 1600))
            keys = restored._detail_keys(detail_calls, 8, set())
            self.assertFalse(keys)



if __name__ == "__main__":
    unittest.main()
