"""Recuperação e encerramento mantêm telemetria verdadeira, sem rede."""

import json
import signal
import tempfile
import unittest
from pathlib import Path
from unittest.mock import Mock, patch

from apurar_collector.__main__ import main
from apurar_collector.health import report
from apurar_collector.runtime import Runtime


class HealthRecoveryTests(unittest.TestCase):
    def setUp(self):
        directory = tempfile.TemporaryDirectory()
        self.addCleanup(directory.cleanup)
        self.root = Path(directory.name)
        self.runtime = Runtime({}, self.root / "state", self.root / "bucket")

    def health(self):
        return json.loads(self.runtime.local.bucket.get("live/6258/health.json"))

    def test_publication_retry_preserves_last_observed_collection_health(self):
        supplemental = {"status": "error", "pending": 10, "errors": 1,
                        "zones_pending": 0, "last_updated_at": None}
        report(self.runtime, {"status": "live", "progress": {
            "last_success": 1000, "last_tracking_success": 900,
            "units_pending": 12, "tracking_failed_states": ["sp"],
        }, "supplemental": supplemental}, 1)
        report(self.runtime, {}, 2)
        health = self.health()
        self.assertEqual(health["status"], "publishing")
        self.assertEqual(health["last_success_at"], "1970-01-01T00:16:40+00:00")
        self.assertEqual(health["last_tracking_success_at"], "1970-01-01T00:15:00+00:00")
        self.assertEqual(health["pending_units"], 12)
        self.assertEqual(health["tracking_failed_states"], ["sp"])
        self.assertEqual(health["supplemental"], supplemental)
        report(self.runtime, {"status": "backoff", "progress": {
            "last_success": None, "units_pending": 0, "tracking_failed_states": [],
        }}, 3)
        health = self.health()
        self.assertEqual(health["last_success_at"], "1970-01-01T00:16:40+00:00")
        self.assertEqual(health["pending_units"], 0)
        self.assertEqual(health["tracking_failed_states"], [])

    def test_state_disk_failure_does_not_prevent_remote_heartbeat(self):
        remote = self.runtime.remote = Mock()
        with (patch("apurar_collector.health.atomic", side_effect=OSError("disco cheio")),
              patch.object(self.runtime.local.bucket, "put", side_effect=OSError("disco cheio"))):
            report(self.runtime, {"status": "error"}, 1, failed=True)
        remote.bucket.put.assert_called_once()
        self.assertEqual(json.loads(remote.bucket.put.call_args.args[1])["status"], "error")

    def test_invalid_clock_does_not_abort_health_reporting(self):
        for value in (float("nan"), float("inf"), 10**100, True):
            with self.subTest(value=value):
                report(self.runtime, {"status": "error", "progress": {
                    "last_success": value, "last_tracking_success": value,
                }}, 1, failed=True)
                self.assertIsNone(self.health()["last_success_at"])
                self.assertIsNone(self.health()["last_tracking_success_at"])

    def test_malformed_previous_health_does_not_block_new_heartbeat(self):
        path = self.runtime.state_dir / "health-live.json"
        for value in ("null", "{", "[]"):
            path.write_text(value)
            report(self.runtime, {"status": "live"}, 1)
            self.assertEqual(self.health()["status"], "live")

    def test_corrupt_previous_metrics_are_not_republished(self):
        path = self.runtime.state_dir / "health-live.json"
        invalid_values = (
            {"last_success_at": "ontem"},
            {"last_tracking_success_at": "2026-02-31T12:00:00Z"},
            {"last_tracking_success_at": "2026-10-25T12:00:00+00:99"},
            {"pending_units": -1},
            {"tracking_failed_states": "sp"},
            {"supplemental": {"status": "ok", "pending": -1}},
        )
        for invalid in invalid_values:
            with self.subTest(invalid=invalid):
                path.write_text(json.dumps({"schema_version": 1, "election": "6258", **invalid}))
                report(self.runtime, {}, 1)
                health = self.health()
                self.assertIsNone(health["last_success_at"])
                self.assertIsNone(health["last_tracking_success_at"])
                self.assertEqual(health["pending_units"], 0)
                self.assertEqual(health["tracking_failed_states"], [])
                self.assertNotIn("supplemental", health)

    def test_explicit_supplemental_disable_clears_previous_error(self):
        report(self.runtime, {"status": "live", "supplemental": {
            "status": "error", "pending": 5, "errors": 1,
            "zones_pending": 0, "last_updated_at": None,
        }}, 1)
        session = Mock()
        session.cycle.side_effect = OSError("fonte indisponível")
        with (patch("apurar_collector.__main__.load", return_value=({}, {})),
              patch("apurar_collector.__main__.LiveSession", return_value=session),
              patch("apurar_collector.__main__.signal.signal")):
            result = main(["--live", "--once", "--without-supplemental",
                           "--state-dir", str(self.runtime.state_dir),
                           "--output", str(self.root / "bucket")])
        self.assertEqual(result, 1)
        self.assertNotIn("supplemental", self.health())
        self.assertNotIn("supplemental", json.loads((self.runtime.state_dir / "health-live.json").read_text()))


class ShutdownTests(unittest.TestCase):
    def test_cli_restores_handlers_and_closes_session_after_failed_once(self):
        with tempfile.TemporaryDirectory() as directory:
            session = Mock()
            session.cycle.side_effect = OSError("fonte indisponível")
            old_term, old_int = object(), object()
            with (patch("apurar_collector.__main__.load", return_value=({}, {})),
                  patch("apurar_collector.__main__.LiveSession", return_value=session),
                  patch("apurar_collector.__main__.signal.signal", side_effect=[old_term, old_int, None, None]) as install):
                result = main(["--live", "--once", "--without-supplemental",
                               "--state-dir", directory, "--output", str(Path(directory) / "bucket")])
            self.assertEqual(result, 1)
            session.close.assert_called_once()
            self.assertEqual(install.call_args_list[-2].args, (signal.SIGTERM, old_term))
            self.assertEqual(install.call_args_list[-1].args, (signal.SIGINT, old_int))
