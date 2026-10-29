"""O suplemento mantém cadência própria quando a Presidência termina."""
import tempfile
import unittest
from unittest.mock import Mock, patch

from apurar_collector.__main__ import main
from apurar_collector.core.tse import FetchResult
from apurar_collector.scheduling import next_delay
from apurar_collector.supplemental import SupplementalCollector, catalog_targets
from apurar_collector.supplemental_tse import parse_supplemental, pending_item
from tests.test_supplemental import RESULT_NOW, city_target, raw_result


class SupplementalLiveScheduleTests(unittest.TestCase):
    def setUp(self):
        directory = tempfile.TemporaryDirectory()
        self.addCleanup(directory.cleanup)
        self.directory = directory.name
        self.now = RESULT_NOW
        self.client = Mock()
        self.collector = SupplementalCollector(
            self.client, self.directory, clock=lambda: self.now)
        self.collector.catalog_checked_at = self.now
        self.target = city_target()
        self.key = "6258:" + self.target["id"]
        self.collector.targets[self.key] = self.target
        self.collector.items[self.key] = pending_item(self.target)

    def delay(self, primary=None):
        coverage = self.collector.payload()["coverage"]
        status = {"status": "finished", "next_poll_seconds": 300,
                  "supplemental": {"status": "ok", **coverage}}
        return next_delay({**status, **(primary or {})})

    def available(self, target=None, final=False):
        target = target or self.target
        raw = raw_result(target["election"], "3" if target["office"] == "governor" else "1",
                         target["scope"][2:] or target["scope"],
                         "mu" if len(target["scope"]) == 7 else "uf")
        if final:
            raw["and"] = "f"
            raw["s"].update(st="2", snt="0")
        return parse_supplemental(raw, target)

    def test_initial_queue_accelerates_only_eligible_items(self):
        self.assertEqual(self.delay(), 2)
        self.collector.detail_retry[self.key] = RESULT_NOW + 600
        self.assertEqual(self.collector.payload()["coverage"]["pending"], 1)
        self.assertEqual(self.delay(), 15)
        self.now = RESULT_NOW + 600
        self.assertEqual(self.delay(), 2)

    def test_nonfinal_results_keep_live_cadence_for_every_supplemental_kind(self):
        governors = catalog_targets({"f": "o", "abr": [{"cd": "ac", "ds": "ACRE",
            "mu": [{"cd": "00035", "nm": "TESTE"}]}]}, "6260", {})
        for target in [self.target, *governors]:
            with self.subTest(kind=target["kind"]):
                self.collector.items = {self.key: self.available(target)}
                self.assertEqual(self.collector.payload()["coverage"]["pending"], 0)
                self.assertEqual(self.delay(), 15)

    def test_recoverable_error_does_not_sleep_until_presidential_finished_poll(self):
        self.client.fetch.return_value = FetchResult("error")
        self.collector.step(budget=1)
        self.assertEqual(self.collector.items[self.key]["status"], "error")
        self.assertEqual(self.collector.detail_retry[self.key], RESULT_NOW + 30)
        self.assertEqual(self.delay(), 15)
        self.now = RESULT_NOW + 15
        self.collector.step(budget=1)
        self.client.fetch.assert_called_once()
        self.now = RESULT_NOW + 30
        self.client.fetch.return_value = FetchResult("ok", raw_result())
        self.collector.step(budget=1)
        self.assertEqual(self.client.fetch.call_count, 2)
        self.assertEqual(self.collector.items[self.key]["status"], "available")
        self.assertEqual(self.delay(), 15)

    def test_finished_cadence_requires_all_items_final_and_fresh(self):
        self.collector.items[self.key] = self.available(final=True)
        self.assertEqual(self.delay(), 300)
        for change in ({"official_final": False}, {"stale": True}, {"status": "withheld"}):
            with self.subTest(change=change):
                self.collector.items[self.key] = {**self.available(final=True), **change}
                self.assertEqual(self.delay(), 15)
        self.collector.items[self.key] = self.available(final=True)
        self.collector.last_error = "Falha de catálogo"
        self.assertEqual(self.delay(), 15)

    def test_global_block_preserves_retry_after_and_survives_restart(self):
        self.client.fetch.return_value = FetchResult("backoff", retry_at=RESULT_NOW + 1200)
        self.collector.step(budget=1)
        self.assertEqual(self.delay({"status": "live", "next_poll_seconds": 2}), 1200)
        self.now = RESULT_NOW + 15
        self.collector.step(budget=1)
        self.client.fetch.assert_called_once()
        restored = SupplementalCollector(self.client, self.directory, clock=lambda: self.now)
        self.assertEqual(restored.payload()["coverage"]["backoff_seconds"], 1185)

    def test_catalog_block_stops_details_and_missing_catalog_keeps_live_cadence(self):
        self.collector.catalog_checked_at = 0
        self.client.fetch.return_value = FetchResult("backoff", retry_at=RESULT_NOW + 1200)
        self.collector.step(budget=1)
        self.client.fetch.assert_called_once()
        self.assertEqual(self.delay(), 1200)
        self.collector.items.clear()
        self.collector.blocked_until = 0
        self.assertEqual(self.delay(), 15)

    def test_unexpected_supplemental_failure_keeps_recovery_cadence(self):
        self.assertEqual(next_delay({"status": "finished", "next_poll_seconds": 300,
            "supplemental": {"status": "error", "pending": 0}}), 15)

    def test_national_failure_and_explicit_retry_are_not_shortened(self):
        for status in ("backoff", "error", "invalid", "awaiting"):
            with self.subTest(status=status):
                self.assertEqual(self.delay({"status": status, "next_poll_seconds": 600}), 600)
        self.assertEqual(self.delay({"status": "live", "next_poll_seconds": 600,
                                     "retry_at": 1600}), 600)

    def test_cli_passes_real_supplemental_schedule_to_runtime_status(self):
        self.collector.items[self.key] = self.available()
        session, runtime = Mock(), Mock()
        session.cycle.return_value = (None, {"status": "finished", "next_poll_seconds": 300})
        runtime.retry_pending.return_value = None
        self.client.fetch.return_value = FetchResult("ok", raw_result())
        with (patch("apurar_collector.__main__.load", return_value=({}, {})),
              patch("apurar_collector.__main__.LiveSession", return_value=session),
              patch("apurar_collector.__main__.Runtime", return_value=runtime),
              patch("apurar_collector.__main__.SupplementalCollector", return_value=self.collector),
              patch("apurar_collector.__main__.SupplementalPublication"),
              patch("apurar_collector.__main__.signal.signal"),
              patch("apurar_collector.__main__.report") as report):
            main(["--live", "--once", "--state-dir", self.directory])
        status = report.call_args.args[1]
        self.assertEqual(status["supplemental"]["pending"], 0)
        self.assertEqual(status["supplemental"]["next_poll_seconds"], 15)
        self.assertEqual(next_delay(status), 15)


if __name__ == "__main__":
    unittest.main()
