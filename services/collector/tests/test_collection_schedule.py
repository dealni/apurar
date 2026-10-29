"""Filas suplementares progridem sem invalidar a pausa nacional da fonte."""
import unittest
from apurar_collector.__main__ import parser
from apurar_collector.scheduling import next_delay


class CollectionScheduleTests(unittest.TestCase):
    def test_primary_idle_and_finished_do_not_leave_supplemental_waiting(self):
        for state, delay in (("live", 15), ("finished", 300)):
            for key in ("pending",):
                with self.subTest(state=state, queue=key):
                    status = {"status": state, "next_poll_seconds": delay,
                              "supplemental": {"status": "ok", key: 800}}
                    self.assertEqual(next_delay(status), 2)

    def test_global_block_and_failure_are_never_shortened_by_pending_details(self):
        for state, delay in (("backoff", 1200), ("error", 30), ("invalid", 30)):
            with self.subTest(state=state):
                self.assertEqual(next_delay({"status": state, "next_poll_seconds": delay,
                    "supplemental": {"status": "ok", "pending": 500}}), delay)

    def test_empty_or_failed_supplemental_does_not_accelerate_poll(self):
        for supplemental in ({}, {"status": "ok", "pending": 0, "zones_pending": 0},
                             {"status": "error", "pending": 500}):
            self.assertEqual(next_delay({"status": "live", "next_poll_seconds": 15,
                                         "supplemental": supplemental}), 15)

    def test_cli_budgets_match_concurrent_profile(self):
        args = parser().parse_args(["--live"])
        self.assertEqual(args.supplemental_budget, 128)
        self.assertFalse(hasattr(args, "zone_budget"))

    def test_legacy_zone_queue_does_not_accelerate_idle_collection(self):
        status = {"status": "live", "next_poll_seconds": 15,
                  "supplemental": {"status": "ok", "pending": 0, "zones_pending": 6805}}
        self.assertEqual(next_delay(status), 15)
