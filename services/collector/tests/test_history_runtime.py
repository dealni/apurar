"""Histórico integral, revisões e publicação idempotente, sem rede."""

import copy
import json
import os
import sqlite3
import tempfile
import unittest
from datetime import datetime, timedelta, timezone
from pathlib import Path
from unittest.mock import Mock

from apurar_collector.demo import fixture
from apurar_collector.history import History
from apurar_collector.maintenance import plan
from apurar_collector.publisher import LocalBucket, Publisher
from apurar_collector.runtime import Runtime


class HistoryTests(unittest.TestCase):
    def test_invalid_public_limits_do_not_create_archive(self):
        with tempfile.TemporaryDirectory() as directory:
            history = History(Path(directory), "demo")
            for limit in (1, 501, True, 2.5):
                with self.subTest(limit=limit), self.assertRaises(ValueError):
                    history.observe({}, limit=limit)
            self.assertFalse(history.path.exists())

    def test_sql_sample_preserves_temporal_order_and_same_time_revisions(self):
        with tempfile.TemporaryDirectory() as directory:
            history = History(Path(directory), "demo")
            for index, stamp in enumerate(("21:00:00", "20:00:00", "20:00:00", "22:00:00")):
                sample = history.observe({"snapshot_id": str(index),
                                          "as_of": f"2026-10-25T{stamp}Z",
                                          "sections": {"counted": index}}, limit=3)
            self.assertEqual([point["snapshot_id"] for point in sample], ["1", "0", "3"])

    def test_full_archive_and_public_sample_preserve_start_end_and_revisions(self):
        with tempfile.TemporaryDirectory() as directory:
            history = History(Path(directory), "demo")
            start = datetime(2026, 10, 25, 20, tzinfo=timezone.utc)
            for index in range(503):
                point = {
                    "snapshot_id": str(index),
                    "as_of": (start + timedelta(seconds=index)).isoformat(),
                    "sections": {"counted": index},
                }
                sample = history.observe(point)
            self.assertEqual(len(sample), 500)
            self.assertEqual(sample[0]["snapshot_id"], "0")
            self.assertEqual(sample[-1]["snapshot_id"], "502")
            correction = point | {"snapshot_id": "correction", "sections": {"counted": 499}}
            reverted = point | {"snapshot_id": "reverted"}
            history.observe(correction)
            sample = history.observe(reverted)
            self.assertEqual(sample[-1]["snapshot_id"], "reverted")
            with sqlite3.connect(history.path) as connection:
                rows = connection.execute("SELECT body FROM observations ORDER BY sequence").fetchall()
            self.assertEqual(len(rows), 505)
            self.assertEqual(json.loads(rows[-2][0])["sections"]["counted"], 499)
            self.assertEqual(json.loads(rows[-1][0])["sections"]["counted"], 502)

    def test_legacy_import_once_survives_restart(self):
        with tempfile.TemporaryDirectory() as directory:
            state = Path(directory)
            point = {"snapshot_id": "old", "as_of": "2026-10-25T20:00:00Z", "sections": {"counted": 1}}
            (state / "history-demo.json").write_text(json.dumps([point]))
            self.assertEqual(len(History(state, "demo").observe(point)), 1)
            self.assertEqual(len(History(state, "demo").observe(point)), 1)
            self.assertTrue((state / "history-demo.json").exists())


class PublicationTests(unittest.TestCase):
    def test_no_changes_reuse_entire_bundle_after_restart_and_preserve_source_clock(self):
        collection, prior = fixture("2020-01-01T00:00:00Z")
        with tempfile.TemporaryDirectory() as directory:
            state, output = Path(directory) / "state", Path(directory) / "bucket"
            remote = Publisher(LocalBucket(Path(directory) / "remote"))
            remote.publish = Mock(wraps=remote.publish)
            first, pointer = Runtime(prior, state, output, remote).emit(collection, mode="demo")
            files = sorted(str(path) for path in output.rglob("*.json"))
            second, pointer2 = Runtime(prior, state, output, remote).emit(collection, mode="demo")
            self.assertEqual(first, second)
            self.assertEqual(pointer, pointer2)
            self.assertEqual(files, sorted(str(path) for path in output.rglob("*.json")))
            self.assertEqual(remote.publish.call_count, 1)
            heartbeat = json.loads((state / "heartbeat-demo.json").read_text())
            self.assertEqual(heartbeat["source_as_of"], first["source"]["as_of"])
            self.assertNotEqual(heartbeat["checked_at"], heartbeat["source_as_of"])

    def test_municipal_change_publishes_even_if_national_did_not_change(self):
        collection, prior = fixture("2020-01-01T00:00:00Z")
        with tempfile.TemporaryDirectory() as directory:
            runtime = Runtime(prior, Path(directory) / "state", Path(directory) / "bucket")
            first, _ = runtime.emit(collection, mode="demo")
            collection["units"][0]["name"] = "Nome municipal atualizado"
            second, _ = runtime.emit(collection, mode="demo")
            self.assertNotEqual(first["snapshot_id"], second["snapshot_id"])
            self.assertEqual(first["source"]["as_of"], second["source"]["as_of"])

    def test_failed_remote_is_retried_and_observation_not_duplicated(self):
        collection, prior = fixture("2020-01-01T00:00:00Z")
        with tempfile.TemporaryDirectory() as directory:
            state = Path(directory) / "state"
            remote = Mock()
            remote.publish.side_effect = [OSError("offline"), None]
            runtime = Runtime(prior, state, Path(directory) / "bucket", remote)
            with self.assertRaises(OSError):
                runtime.emit(collection, mode="demo")
            self.assertFalse((state / "publication-demo.json").exists())
            runtime.emit(collection, mode="demo")
            self.assertEqual(remote.publish.call_count, 2)
            with sqlite3.connect(state / "history-demo.sqlite3") as connection:
                self.assertEqual(connection.execute("SELECT COUNT(*) FROM observations").fetchone()[0], 1)

    def test_enabling_remote_after_local_run_does_not_skip_publication(self):
        collection, prior = fixture("2020-01-01T00:00:00Z")
        with tempfile.TemporaryDirectory() as directory:
            state, output = Path(directory) / "state", Path(directory) / "bucket"
            Runtime(prior, state, output).emit(collection, mode="demo")
            remote = Mock()
            Runtime(prior, state, output, remote).emit(collection, mode="demo")
            remote.publish.assert_called_once()


class MaintenanceTests(unittest.TestCase):
    def test_plan_keeps_current_and_previous_bundles_without_deleting_anything(self):
        collection, prior = fixture("2020-01-01T00:00:00Z")
        with tempfile.TemporaryDirectory() as directory:
            state, output = Path(directory) / "state", Path(directory) / "bucket"
            runtime = Runtime(prior, state, output)
            pointers = []
            for index in range(3):
                changed = copy.deepcopy(collection)
                changed["units"][0]["name"] = str(index)
                pointers.append(runtime.emit(changed, mode="demo")[1])
            for path in output.rglob("*.json"):
                os.utime(path, (0, 0))
            files = list(output.rglob("*.json"))
            result = plan(state, output, current_time=86400 * 30)
            self.assertEqual(len(result["candidates"]), 3)
            self.assertEqual(len(result["protected_keys"]), 6)
            self.assertEqual(len(list(output.rglob("*.json"))), len(files))
            self.assertTrue((state / "history-demo.sqlite3").exists())
            with self.assertRaises(ValueError):
                plan(state, output, retain_days=1)
