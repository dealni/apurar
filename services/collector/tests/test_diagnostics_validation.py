"""Diagnóstico operacional inválido continua observável, sem serviços externos."""

import contextlib
import io
import json
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

from apurar_collector.diagnostics import inspect, instant
from apurar_collector.diagnostics_alerts import main


class DiagnosticValidationTests(unittest.TestCase):
    def setUp(self):
        temporary = tempfile.TemporaryDirectory()
        self.addCleanup(temporary.cleanup)
        self.root = Path(temporary.name)
        self.state, self.output = self.root / "state", self.root / "public"
        self.state.mkdir()
        self.output.mkdir()
        self.stamp = "2026-10-25T20:00:00Z"
        (self.state / "health-live.json").write_text(json.dumps({
            "schema_version": 1, "election": "6258",
            "checked_at": self.stamp, "last_success_at": self.stamp,
            "status": "live", "pending_units": 0,
        }))

    def inspect(self):
        return inspect(self.state, self.output, max_age=360, max_pending=0,
                       min_free=0, max_bytes=100000, clock=instant(self.stamp))

    def test_normalized_invalid_iso_timestamps_are_rejected(self):
        for stamp in ("2026-10-25T20:00:00+00:99", "2026-10-25T20:00:00+01:60",
                      "2026-10-25T20:00:00+2400", "2026-10-25 20:00:00+00:00",
                      "2026-10-25T20:00:00", "2026-02-30T20:00:00Z"):
            with self.subTest(stamp=stamp), self.assertRaises(ValueError):
                instant(stamp)
        self.assertEqual(instant(self.stamp), instant("2026-10-25T17:00:00-03:00"))

    def test_foreign_or_missing_health_identity_is_never_healthy(self):
        path = self.state / "health-live.json"
        original = json.loads(path.read_text())
        self.assertTrue(self.inspect()["ok"])
        for key, value in (("schema_version", 999), ("schema_version", True),
                           ("schema_version", None), ("election", "0000"), ("election", None)):
            health = {**original, key: value}
            if value is None:
                del health[key]
            path.write_text(json.dumps(health))
            with self.subTest(key=key, value=value):
                report = self.inspect()
                self.assertFalse(report["ok"])
                self.assertIn("Saúde ausente ou inválida", report["issues"])

    def test_disk_failure_is_reported_without_fabricating_storage_metrics(self):
        for target in ("apurar_collector.diagnostics.shutil.disk_usage", "pathlib.Path.rglob"):
            with self.subTest(target=target), patch(target, side_effect=OSError("private-path")):
                report = self.inspect()
            self.assertFalse(report["ok"])
            self.assertIn("Falha de leitura do acervo/disco", report["issues"])
            self.assertNotIn("min_disk_free_bytes", report["metrics"])
            self.assertNotIn("private-path", json.dumps(report))

    def test_disk_failure_reaches_alert_dispatch(self):
        argv = ["alerts", "--state-dir", str(self.state), "--output", str(self.output),
                "--alert-state", str(self.root / "delivery.json"), "--max-age", "360",
                "--max-pending", "0", "--min-free", "0", "--max-bytes", "100000",
                "--retry-seconds", "60"]
        with (patch("sys.argv", argv), patch.dict("os.environ", {
                  "APURAR_ALERT_TELEGRAM_TOKEN": "fake", "APURAR_ALERT_TELEGRAM_CHAT_ID": "fake",
              }, clear=True), patch("socket.socket", side_effect=AssertionError("Rede proibida")),
              patch("apurar_collector.diagnostics.shutil.disk_usage", side_effect=OSError("private-path")),
              patch("apurar_collector.diagnostics_alerts.notify", return_value={"ok": True, "sent": True}) as notify,
              contextlib.redirect_stdout(io.StringIO())):
            self.assertEqual(main(), 0)
        notify.assert_called_once()
        self.assertFalse(notify.call_args.args[0]["ok"])
        self.assertIn("Falha de leitura do acervo/disco", notify.call_args.args[0]["issues"])
