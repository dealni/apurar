"""Publicações antigas com horário municipal inválido não são reenviadas."""

import json
import tempfile
import unittest
from copy import deepcopy
from pathlib import Path
from unittest.mock import patch

from apurar_collector.demo import fixture
from apurar_collector.publisher import LocalBucket, Publisher
from apurar_collector.runtime import Runtime


STAMP = "2026-10-04T21:00:00Z"


class MunicipalPublicationRecoveryTests(unittest.TestCase):
    def setUp(self):
        directory = tempfile.TemporaryDirectory()
        self.addCleanup(directory.cleanup)
        self.root = Path(directory.name)
        self.collection, self.prior = fixture(STAMP)
        self.future = deepcopy(self.collection)
        self.future["units"][0]["result"]["generated_at"] = "2026-10-04T22:00:00Z"
        self.future["units"][0]["result"]["totalized_at"] = "2026-10-04T21:59:55Z"
        self.remote = Publisher(LocalBucket(self.root / "remote"), remote=True)
        self.runtime = Runtime(self.prior, self.root / "state", self.root / "local", self.remote)
        patcher = patch("apurar_collector.runtime.now", return_value=STAMP)
        patcher.start()
        self.addCleanup(patcher.stop)

    def test_direct_future_collection_is_rejected_before_any_publication(self):
        with self.assertRaisesRegex(ValueError, "municipal futuro"):
            self.runtime.emit(self.future, mode="live", collected_at=STAMP)
        self.assertFalse((self.root / "local").exists())
        self.assertFalse((self.root / "remote").exists())

    def test_legacy_pending_is_quarantined_and_clean_generation_can_publish(self):
        with patch("apurar_collector.runtime.future_collection", return_value=False):
            with patch.object(self.remote, "publish", side_effect=OSError("offline")):
                with self.assertRaises(OSError):
                    self.runtime.emit(self.future, mode="live", collected_at=STAMP)
        path = self.root / "state" / "pending-live.json"
        pending = json.loads(path.read_text())
        original = self.runtime.local.bucket.get(pending["pointer"]["municipalities"]["key"])
        self.runtime.projection_enabled = False
        with patch.object(self.remote, "publish", wraps=self.remote.publish) as publish:
            self.assertIsNone(self.runtime.retry_pending(mode="live"))
            publish.assert_not_called()
        self.assertFalse(path.exists())
        self.assertEqual(len(list(path.parent.glob("rejected-pending-live-*.json"))), 1)
        self.assertEqual(original, self.runtime.local.bucket.get(pending["pointer"]["municipalities"]["key"]))
        _, pointer = self.runtime.emit(self.collection, mode="live", collected_at=STAMP)
        self.assertNotEqual(pointer["snapshot_id"], pending["pointer"]["snapshot_id"])
        self.assertIsNotNone(self.remote.bucket.get(pointer["key"]))

    def test_invalid_receipt_is_not_repaired_remotely_before_clean_generation(self):
        with patch("apurar_collector.runtime.future_collection", return_value=False):
            _, previous = self.runtime.emit(self.future, mode="live", collected_at=STAMP)
        self.remote.bucket._path(previous["key"]).unlink()
        self.runtime._remote_confirmation.forget("live")
        with patch.object(self.remote, "publish", wraps=self.remote.publish) as publish:
            _, current = self.runtime.emit(self.collection, mode="live", collected_at=STAMP)
            self.assertEqual(publish.call_count, 1)
            self.assertNotEqual(publish.call_args.args[0]["snapshot_id"], previous["snapshot_id"])
        self.assertNotEqual(current["snapshot_id"], previous["snapshot_id"])
