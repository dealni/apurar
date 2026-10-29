"""A deduplicação antecede cálculos sem esconder mudanças ou recuperação."""

import json
import tempfile
import unittest
from pathlib import Path
from unittest.mock import Mock, patch

from apurar_collector.demo import fixture
from apurar_collector.runtime import Runtime
from apurar_collector.snapshot import build, municipalities


class InputSignatureTests(unittest.TestCase):
    def setUp(self):
        self.directory = tempfile.TemporaryDirectory()
        self.addCleanup(self.directory.cleanup)
        self.state = Path(self.directory.name) / "state"
        self.output = Path(self.directory.name) / "bucket"
        self.collection, self.prior = fixture("2020-01-01T00:00:00Z")
        self.runtime = Runtime(self.prior, self.state, self.output)

    def test_noop_skips_both_calculations_and_preserves_source_and_archive(self):
        with patch("apurar_collector.runtime.build", wraps=build) as calculate, patch(
            "apurar_collector.runtime.municipalities", wraps=municipalities
        ) as cities, patch("apurar_collector.runtime.archive_confirmed") as archive:
            first = self.runtime.emit(self.collection, mode="live")
            self.collection["progress"] = {"last_success": "new", "units_pending": 0}
            self.collection["revisions"] = ["operacional"]
            self.collection["next_poll_seconds"] = 15
            second = self.runtime.emit(self.collection, mode="live")
        self.assertEqual(calculate.call_count, 1)
        self.assertEqual(cities.call_count, 1)
        self.assertEqual(archive.call_count, 2)
        self.assertEqual(first, second)
        heartbeat = json.loads((self.state / "heartbeat-live.json").read_text())
        self.assertEqual(heartbeat["source_as_of"], "2020-01-01T00:00:00Z")
        self.assertFalse(heartbeat["changed"])

    def test_all_material_mutations_recalculate_even_if_output_is_same(self):
        changes = [
            lambda: self.collection["national"].update(generated_at="2020-01-01T00:00:01Z"),
            lambda: self.collection["national"]["votes"].update({"13": 319}),
            lambda: self.collection["units"][0].update(name="Nome corrigido"),
            lambda: self.collection["units"][0]["result"].update(stale=True),
            lambda: self.collection.update(projection_block_reason="Aguardando conciliação"),
            lambda: self.prior["units"]["SP:00001"]["votes_2026"].update({"13": 510}),
            lambda: self.prior.update(version="outra"),
            lambda: setattr(self.runtime, "projection_enabled", False),
            lambda: setattr(self.runtime, "projection_reason", "Operação"),
            lambda: self.collection["national"].update(divulgation_allowed=False),
        ]
        with patch("apurar_collector.runtime.build", wraps=build) as calculate:
            self.runtime.emit(self.collection, mode="demo")
            for change in changes:
                change()
                previous = calculate.call_count
                try:
                    self.runtime.emit(self.collection, mode="demo")
                except ValueError:
                    self.assertFalse(self.collection["national"]["divulgation_allowed"])
                self.assertEqual(calculate.call_count, previous + 1)

    def test_pending_remote_upload_retried_before_fast_path(self):
        remote = Mock()
        remote.publish.side_effect = OSError("indisponível")
        self.runtime.remote = remote
        with patch("apurar_collector.runtime.build", wraps=build) as calculate, patch(
            "apurar_collector.runtime.archive_confirmed"
        ):
            with self.assertRaises(OSError):
                self.runtime.emit(self.collection, mode="live")
            self.assertTrue((self.state / "pending-live.json").exists())
            remote.publish.side_effect = None
            snapshot, _ = self.runtime.emit(self.collection, mode="live")
        self.assertEqual(calculate.call_count, 1)
        self.assertEqual(remote.publish.call_count, 2)
        self.assertFalse((self.state / "pending-live.json").exists())
        self.assertEqual(snapshot["source"]["as_of"], "2020-01-01T00:00:00Z")

    def test_restart_recomputes_instead_of_trusting_previous_process_cache(self):
        self.runtime.emit(self.collection, mode="demo")
        restarted = Runtime(self.prior, self.state, self.output)
        with patch("apurar_collector.runtime.build", wraps=build) as calculate:
            restarted.emit(self.collection, mode="demo")
        self.assertEqual(calculate.call_count, 1)

    def test_local_corruption_cannot_hide_behind_cache(self):
        _, pointer = self.runtime.emit(self.collection, mode="demo")
        path = self.output / pointer["municipalities"]["key"]
        path.write_bytes(b"corrompido")
        with patch("apurar_collector.runtime.build", wraps=build) as calculate:
            _, repaired = self.runtime.emit(self.collection, mode="demo")
        self.assertEqual(calculate.call_count, 1)
        self.assertNotEqual(repaired["municipalities"]["key"], pointer["municipalities"]["key"])
        self.assertEqual(json.loads(self.runtime.local.bucket.get(repaired["municipalities"]["key"]))["items"][0]["name"], "Município Exemplo")

    def test_model_failure_is_retried_with_identical_inputs(self):
        with patch("apurar_collector.snapshot.forecast", side_effect=ArithmeticError):
            first, _ = self.runtime.emit(self.collection, mode="demo")
        self.assertFalse(first["projection"]["available"])
        with patch("apurar_collector.runtime.build", wraps=build) as calculate:
            recovered, _ = self.runtime.emit(self.collection, mode="demo")
        self.assertEqual(calculate.call_count, 1)
        self.assertTrue(recovered["projection"]["available"])

    def test_earlier_query_time_is_not_accepted_by_fast_path(self):
        self.runtime.emit(self.collection, mode="demo")
        with self.assertRaisesRegex(ValueError, "Cronologia inválida"):
            self.runtime.emit(self.collection, mode="demo", collected_at="2019-01-01T00:00:00Z")
