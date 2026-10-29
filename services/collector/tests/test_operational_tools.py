"""Regressões offline dos instrumentos de operação, sem publicar nem acessar rede."""

import copy
import json
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

from apurar_collector.backtest import evaluate
from apurar_collector.demo import fixture
from apurar_collector.diagnostics import inspect, instant
from apurar_collector.recovery import rehearse
from apurar_collector.runtime import Runtime
from apurar_collector.supplemental_publication import SupplementalPublication
from apurar_collector.supplemental_tse import pending_item

STAMP = "2026-10-25T20:00:00+00:00"


class OperationalToolsTests(unittest.TestCase):
    def setUp(self):
        self.temporary = tempfile.TemporaryDirectory()
        self.addCleanup(self.temporary.cleanup)
        self.root = Path(self.temporary.name)
        self.state, self.output = self.root / "state", self.root / "public"
        self.state.mkdir()
        self.output.mkdir()
        self.collection, self.prior = fixture(STAMP)

    def health(self, **changes):
        health = dict(schema_version=1, election="6258", checked_at=STAMP,
                      last_success_at=STAMP, status="live", pending_units=0)
        health.update(changes)
        (self.state / "health-live.json").write_text(json.dumps(health))

    def inspect(self, **limits):
        return inspect(self.state, self.output, max_age=limits.get("max_age", 60),
                       max_pending=limits.get("max_pending", 0), min_free=limits.get("min_free", 0),
                       max_bytes=limits.get("max_bytes", 100000), clock=instant(STAMP))

    def test_health_ok_and_each_alert(self):
        self.health()
        self.assertTrue(self.inspect()["ok"])
        for changes in ({"status": "backoff"}, {"pending_units": 1},
                        {"tracking_failed_states": ["SP"]},
                        {"checked_at": "2026-10-24T20:00:00+00:00"},
                        {"last_success_at": None}, {"pending_units": -1}):
            with self.subTest(changes=changes):
                self.health(**changes)
                self.assertFalse(self.inspect()["ok"])
        self.health()
        self.assertFalse(self.inspect(min_free=10**30)["ok"])
        self.assertFalse(self.inspect(max_bytes=0)["ok"])

    def test_real_states_and_awaiting_without_invented_success(self):
        for status in ("live", "collecting", "finished", "awaiting"):
            self.health(status=status, pending_units=8)
            self.assertTrue(self.inspect(max_pending=10)["ok"], status)
        self.health(status="awaiting", last_success_at=None)
        result = self.inspect()
        self.assertTrue(result["ok"])
        self.assertIsNone(result["metrics"]["success_age_seconds"])
        self.health(status="awaiting", last_success_at=None,
                    checked_at="2026-10-24T20:00:00+00:00")
        self.assertFalse(self.inspect()["ok"])
        self.health(status="finished", checked_at="2026-10-25T19:55:00+00:00",
                    last_success_at="2026-10-25T19:55:00+00:00")
        self.assertTrue(self.inspect(max_age=360)["ok"])
        self.assertFalse(self.inspect(max_age=60)["ok"])

    def test_supplemental_error_and_bounded_bootstrap(self):
        value = {"status": "ok", "pending": 7, "errors": 0,
                 "zones_pending": 6805, "last_updated_at": STAMP}
        self.health(supplemental=value)
        self.assertTrue(self.inspect(max_pending=10)["ok"])
        self.assertFalse(self.inspect(max_pending=5)["ok"])
        for changes in ({"status": "error"}, {"errors": 1}, {"pending": -1}):
            self.health(supplemental={**value, **changes})
            self.assertFalse(self.inspect(max_pending=10)["ok"])
        self.health(supplemental={"status": "disabled"})
        self.assertTrue(self.inspect()["ok"])

    def test_archive_failure_alerts(self):
        self.health()
        path = self.state / "archive-status.json"
        path.write_text('{"status":"error", "error":"falha simulada"}')
        self.assertFalse(self.inspect()["ok"])
        path.write_text('{"status":"ok"}')
        self.assertTrue(self.inspect()["ok"])

    def test_invalid_archive_shape_is_diagnostic_failure(self):
        self.health()
        (self.state / "archive-status.json").write_text("[]")
        self.assertFalse(self.inspect()["ok"])

    def test_pending_upload_alerts(self):
        self.health()
        (self.state / "pending-live.json").write_text("{}")
        self.assertFalse(self.inspect()["ok"])

    def test_restore_integrity_and_state(self):
        runtime = Runtime(self.prior, self.state, self.output)
        with patch("apurar_collector.runtime.now", return_value="2026-10-25T20:01:00+00:00"):
            runtime.emit(self.collection, mode="demo", collected_at=STAMP)
        before = {str(p): p.read_bytes() for p in self.root.rglob("*") if p.is_file()}
        with patch("socket.socket", side_effect=AssertionError("Rede proibida")):
            result = rehearse(self.state, self.output, mode="demo")
        self.assertTrue(result["ok"])
        self.assertFalse(result["capabilities"]["supplemental_bundle"])
        self.assertEqual(result["databases"][0]["rows"]["observations"], 1)
        self.assertEqual(before, {str(p): p.read_bytes() for p in self.root.rglob("*") if p.is_file()})
        path = self.output / result["objects"][0]["key"]
        path.write_text("corrompido")
        with self.assertRaises(ValueError):
            rehearse(self.state, self.output, mode="demo")

    def test_live_restore_checks_actual_core_archive_contract(self):
        runtime = Runtime(self.prior, self.state, self.output)
        with patch("apurar_collector.runtime.now", return_value="2026-10-25T20:01:00+00:00"):
            runtime.emit(self.collection, mode="live", collected_at=STAMP)
        payload = {"schema_version": 1, "mode": "live", "election": "6258",
                   "updated_at": STAMP, "governors": [pending_item({"id": "AC"})],
                   "exterior": {"cities": [], "countries": []}, "zones": [],
                   "coverage": {"pending": 1, "errors": 0}, "capabilities": {}}
        SupplementalPublication(self.state, runtime.local,
                                clock=lambda: instant(STAMP)).publish(payload)
        result = rehearse(self.state, self.output, mode="live")
        self.assertTrue(result["capabilities"]["archive_integral"])
        self.assertEqual(result["archive"]["observations"], 2)
        self.assertEqual(result["archive"]["references"], 4)

    def document(self):
        return {"provenance": {"kind": "synthetic", "description": "Fixture fictícia"},
                "prior": self.prior, "prior_as_of": "2026-10-01T00:00:00+00:00",
                "final": {"as_of": "2026-10-25T23:00:00+00:00", "votes": {"13": 1500, "22": 1500}},
                "observations": [{"cutoff": STAMP, "collection": self.collection}]}

    def test_backtest_reports_synthetic_error_and_coverage(self):
        result = evaluate(self.document())
        self.assertEqual(result["provenance"]["kind"], "synthetic")
        self.assertEqual(result["availability_percent"], 100)
        self.assertIsNotNone(result["mean_absolute_error_pp"])
        self.assertEqual(result["points"][0]["coverage"]["units_received"], 3)

    def test_backtest_rejects_future_and_final_leak(self):
        for key, value in (("generated_at", "2026-10-25T21:00:00+00:00"),
                           ("official_final", True)):
            document = copy.deepcopy(self.document())
            document["observations"][0]["collection"]["units"][0]["result"][key] = value
            with self.assertRaises(ValueError):
                evaluate(document)
        document = self.document()
        document["prior_as_of"] = "2026-10-26T00:00:00+00:00"
        with self.assertRaises(ValueError):
            evaluate(document)


if __name__ == "__main__":
    unittest.main()
