"""Regressões operacionais: oficiais independentes de detalhe e projeção."""

import json
import os
import tempfile
import unittest
from pathlib import Path
from unittest.mock import Mock, patch

from apurar_collector.__main__ import parser
from apurar_collector.core.collector import LiveCollector
from apurar_collector.core.tse import FetchResult, result_url
from apurar_collector.demo import fixture
from apurar_collector.health import report
from apurar_collector.runtime import LiveSession, Runtime
from apurar_collector.snapshot import build
from tests.test_tse import fixture as tse_fixture


class OfficialFallbackTests(unittest.TestCase):
    def test_new_nonfinal_national_is_published_during_municipal_block(self):
        raw = tse_fixture()
        raw.update(ele="6258", t="2")
        client = Mock()
        client.fetch.side_effect = lambda url: (
            FetchResult("ok", raw) if url == result_url(election="6258")
            else FetchResult("backoff", error="Bloqueado", retry_at=1600)
        )
        with tempfile.TemporaryDirectory() as directory:
            session = LiveSession(directory, client)
            collector = session.collector
            collector.clock = lambda: 1000
            collector.catalog = {"sp00001": {"scope": "sp00001", "uf": "SP", "sections_total": 2}}
            collector.last_catalog = 1000
            collector.structural_states = {"sp"}
            collector._tracking = Mock()
            collector._queue("sp00001")
            collection, status = session.cycle()
            self.assertIsNotNone(collection)
            self.assertFalse(collection["national"]["official_final"])
            self.assertEqual(status["status"], "backoff")
            self.assertGreaterEqual(status["next_poll_seconds"], 600)
            self.assertIn("coleta municipal parcial", collection["projection_block_reason"])
            snapshot = build(collection, {}, mode="live", collected_at="2026-10-25T20:00:00Z", published_at="2026-10-25T20:00:00Z")
            self.assertEqual(snapshot["candidates"][0]["votes"], 80)
            self.assertFalse(snapshot["projection"]["available"])
            session.close()

    def test_model_exception_keeps_official_and_municipal_counts(self):
        collection, prior = fixture("2020-01-01T00:00:00Z")
        with tempfile.TemporaryDirectory() as directory:
            runtime = Runtime(prior, Path(directory) / "state", Path(directory) / "bucket")
            with patch("apurar_collector.snapshot.forecast", side_effect=ArithmeticError("modelo")):
                snapshot, pointer = runtime.emit(collection, mode="live")
            self.assertFalse(snapshot["projection"]["available"])
            self.assertIn("falha do modelo", snapshot["projection"]["reason"])
            self.assertEqual(sum(c["votes"] for c in snapshot["candidates"]), collection["national"]["valid_votes"])
            cities = json.loads(runtime.local.bucket.get(pointer["municipalities"]["key"]))
            self.assertTrue(cities["items"][0]["available"])

    def test_projection_switch_and_retry_keep_official_publication(self):
        collection, prior = fixture("2020-01-01T00:00:00Z")
        with tempfile.TemporaryDirectory() as directory:
            state, bucket = Path(directory) / "state", Path(directory) / "bucket"
            remote = Mock()
            remote.publish.side_effect = OSError("offline")
            enabled = Runtime(prior, state, bucket, remote)
            with self.assertRaises(OSError):
                enabled.emit(collection, mode="live")
            self.assertTrue(json.loads((state / "pending-live.json").read_text())["snapshot"]["projection"]["available"])
            remote.publish.side_effect = None
            disabled = Runtime(prior, state, bucket, remote, projection_enabled=False, projection_reason="Validação em andamento.")
            snapshot, _ = disabled.retry_pending(mode="live")
            self.assertFalse(snapshot["projection"]["available"])
            self.assertEqual(snapshot["projection"]["reason"], "Validação em andamento.")
            self.assertEqual(snapshot["candidates"][0]["votes"], collection["national"]["votes"]["13"])
            self.assertFalse((state / "pending-live.json").exists())

    def test_cli_switch_environment_and_reason(self):
        with patch.dict(os.environ, {"APURAR_PROJECTION_ENABLED": "false", "APURAR_PROJECTION_REASON": "Ajuste operacional"}):
            args = parser().parse_args(["--live", "--once"])
            self.assertTrue(args.disable_projection)
            self.assertEqual(args.projection_reason, "Ajuste operacional")
        self.assertTrue(parser().parse_args(["--disable-projection"]).disable_projection)


class PartialTrackingTests(unittest.TestCase):
    def test_partial_health_preserves_queue_cadence_and_block_deadline(self):
        collector = LiveCollector(Mock(), clock=lambda: 1000, election="6258")
        collector.tracking_failures["rj"] = "Falha parcial"
        collector._queue("sp00001")
        for status in ("live", "collecting"):
            with self.subTest(status=status):
                value = collector._payload(status)
                self.assertEqual(value["status"], "degraded")
                self.assertEqual(value["next_poll_seconds"], 2)
        self.assertEqual(collector._payload("backoff", retry_at=1120)["next_poll_seconds"], 120)
        collector.pending.clear()
        self.assertEqual(collector._payload("live")["next_poll_seconds"], 15)
        self.assertEqual(collector._payload("finished")["next_poll_seconds"], 300)

    def test_invalid_state_does_not_hide_other_state_updates_and_health_warns(self):
        collector = LiveCollector(Mock(), clock=lambda: 1000, election="6258")
        collector.catalog = {uf + "00001": {"scope": uf + "00001", "uf": uf.upper()} for uf in ("sp", "rj")}
        collector.structural_states = {"sp", "rj"}
        good = {"ele": "6258", "t": "2", "f": "o", "abr": [{"tpabr": "mu", "cdabr": "00001", "s": {"ts": "2"}, "e": {"te": "500"}}]}
        def fetch(url):
            if "/rj/" in url:
                return FetchResult("ok", {**good, "abr": [{"tpabr": "mu", "cdabr": "00001", "s": {"ts": "inválido"}}]})
            return FetchResult("ok", good)
        collector.client.fetch.side_effect = fetch
        collector._tracking()
        status = collector._payload("live")
        self.assertEqual(status["status"], "degraded")
        self.assertEqual(status["progress"]["tracking_failed_states"], ["rj"])
        self.assertIsNone(collector.last_tracking_success)
        self.assertIn("sp00001", collector.pending)
        with tempfile.TemporaryDirectory() as directory:
            runtime = Runtime({}, directory, Path(directory) / "bucket")
            report(runtime, status, 1)
            value = json.loads(runtime.local.bucket.get("live/6258/health.json"))
            self.assertEqual(value["status"], "degraded")
            self.assertEqual(value["tracking_failed_states"], ["rj"])
            self.assertIsNone(value["last_tracking_success_at"])
        collector.client.fetch.side_effect = None
        collector.client.fetch.return_value = FetchResult("ok", good)
        collector.clock = lambda: 1045
        collector.errors = []
        collector._tracking()
        self.assertFalse(collector.tracking_failures)
        self.assertEqual(collector.last_tracking_success, 1045)
        self.assertEqual(collector._payload("live")["status"], "live")
