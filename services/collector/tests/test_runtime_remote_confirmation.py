"""Deduplicação presidencial confirma e recupera o destino real periodicamente."""

import json
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

from apurar_collector.demo import fixture
from apurar_collector.publication_confirmation import CONFIRMATION_TTL_SECONDS
from apurar_collector.publisher import LocalBucket, Publisher
from apurar_collector.runtime import Runtime
from apurar_collector.snapshot import encode


class CountingBucket(LocalBucket):
    def __init__(self, root):
        super().__init__(root)
        self.gets = self.puts = 0
        self.fail = False

    def get(self, key):
        self.gets += 1
        if self.fail:
            raise OSError("indisponível")
        return super().get(key)

    def put(self, key, body, cache_control):
        self.puts += 1
        if self.fail:
            raise OSError("indisponível")
        return super().put(key, body, cache_control)


class RemoteConfirmationTests(unittest.TestCase):
    def setUp(self):
        directory = tempfile.TemporaryDirectory()
        self.addCleanup(directory.cleanup)
        self.root = Path(directory.name)
        self.clock = 1000
        self.collection, self.prior = fixture("2020-01-01T00:00:00Z")
        self.remote = Publisher(CountingBucket(self.root / "remote"), remote=True)
        self.runtime = self.make_runtime()
        # Isola o lote presidencial; o acervo tem confirmação independente.
        archive = patch("apurar_collector.runtime.archive_confirmed")
        archive.start()
        self.addCleanup(archive.stop)
        self.first = self.runtime.emit(self.collection, mode="live")

    def make_runtime(self):
        return Runtime(self.prior, self.root / "state", self.root / "local", self.remote,
                       confirmation_clock=lambda: self.clock)

    def emit(self):
        return self.runtime.emit(self.collection, mode="live")

    def expire(self):
        self.clock += CONFIRMATION_TTL_SECONDS

    def test_noop_has_no_remote_requests_or_recalculation_and_does_not_extend_ttl(self):
        counts = self.remote.bucket.gets, self.remote.bucket.puts
        with patch("apurar_collector.runtime.build", side_effect=AssertionError("recalculou")):
            self.clock += CONFIRMATION_TTL_SECONDS - 1
            self.assertEqual(self.first, self.emit())
            self.assertEqual(counts, (self.remote.bucket.gets, self.remote.bucket.puts))
            self.clock += 1
            self.assertEqual(self.first, self.emit())
        self.assertEqual(counts[0] + 4, self.remote.bucket.gets)
        self.assertEqual(counts[1], self.remote.bucket.puts)

    def test_missing_pointer_and_objects_are_repaired_without_new_generation(self):
        pointer = self.first[1]
        for key in ("live/6258/latest.json", pointer["key"],
                    pointer["municipalities"]["key"], pointer["history"]["key"]):
            with self.subTest(key=key):
                self.remote.bucket._path(key).unlink()
                self.expire()
                with patch("apurar_collector.runtime.build", side_effect=AssertionError("recalculou")):
                    self.assertEqual(self.first, self.emit())
                self.assertIsNotNone(self.remote.bucket.get(key))
        self.assertFalse((self.root / "state" / "pending-live.json").exists())

    def test_missing_pointer_and_snapshot_together_are_repaired(self):
        for key in ("live/6258/latest.json", self.first[1]["key"]):
            self.remote.bucket._path(key).unlink()
        self.expire()
        self.assertEqual(self.first, self.emit())
        for key in ("live/6258/latest.json", self.first[1]["key"]):
            self.assertIsNotNone(self.remote.bucket.get(key))

    def test_failed_confirmation_invalidates_cache_and_retries_immediately(self):
        self.expire()
        self.remote.bucket.fail = True
        with self.assertRaises(OSError):
            self.emit()
        self.assertEqual({}, self.runtime._remote_confirmation.entries)
        counts = self.remote.bucket.gets
        self.remote.bucket.fail = False
        self.assertEqual(self.first, self.emit())
        self.assertGreater(self.remote.bucket.gets, counts)

    def test_failed_repair_leaves_original_bundle_pending(self):
        self.remote.bucket._path(self.first[1]["key"]).unlink()
        self.expire()
        with patch.object(self.remote, "publish", side_effect=OSError("falha no upload")):
            with self.assertRaises(OSError):
                self.emit()
        pending_path = self.root / "state" / "pending-live.json"
        self.assertEqual(self.first[1], json.loads(pending_path.read_text())["pointer"])
        self.assertEqual({}, self.runtime._remote_confirmation.entries)
        self.assertEqual(self.first, self.emit())
        self.assertFalse(pending_path.exists())

    def test_corrupt_immutable_is_not_overwritten_or_cached(self):
        key = self.first[1]["history"]["key"]
        self.remote.bucket._path(key).write_bytes(b"corrompido")
        self.expire()
        for _ in range(2):
            with self.assertRaisesRegex(ValueError, "divergente"):
                self.emit()
        self.assertEqual(b"corrompido", self.remote.bucket.get(key))
        self.assertEqual({}, self.runtime._remote_confirmation.entries)

    def test_pending_repair_refuses_another_generation_published_before_retry(self):
        self.remote.bucket._path(self.first[1]["key"]).unlink()
        self.expire()
        with patch.object(self.remote, "publish", side_effect=OSError("falha no upload")):
            with self.assertRaises(OSError):
                self.emit()
        for stamp in ("2099-01-01T00:00:00Z", self.first[1]["published_at"]):
            with self.subTest(stamp=stamp):
                body = encode({**self.first[1], "published_at": stamp, "snapshot_id": "another-writer"})
                self.remote.bucket.put("live/6258/latest.json", body, "no-store")
                with self.assertRaisesRegex(ValueError, "Geração remota divergente"):
                    self.emit()
                self.assertEqual(body, self.remote.bucket.get("live/6258/latest.json"))

    def test_newer_or_same_time_different_remote_generation_is_preserved(self):
        for stamp in ("2099-01-01T00:00:00Z", self.first[1]["published_at"]):
            with self.subTest(stamp=stamp):
                pointer = {**self.first[1], "published_at": stamp, "snapshot_id": "another-writer"}
                body = encode(pointer)
                self.remote.bucket.put("live/6258/latest.json", body, "no-store")
                self.expire()
                with self.assertRaisesRegex(ValueError, "Geração remota divergente"):
                    self.emit()
                self.assertEqual(body, self.remote.bucket.get("live/6258/latest.json"))

    def test_restart_requires_remote_reads_but_no_upload(self):
        counts = self.remote.bucket.gets, self.remote.bucket.puts
        self.runtime = self.make_runtime()
        self.assertEqual(self.first, self.emit())
        self.assertEqual(counts[0] + 4, self.remote.bucket.gets)
        self.assertEqual(counts[1], self.remote.bucket.puts)

    def test_replaced_bucket_with_same_path_cannot_use_previous_cache(self):
        replacement = CountingBucket(self.remote.bucket.root)
        self.remote.bucket = replacement
        self.assertEqual(self.first, self.emit())
        self.assertEqual(4, replacement.gets)
        self.assertEqual(0, replacement.puts)

    def test_destination_replaced_during_upload_stays_pending_without_confirmation(self):
        self.collection["units"][0]["name"] = "Nome corrigido"
        publish = self.remote.publish

        def replace_after_upload(*args):
            result = publish(*args)
            self.remote.bucket = CountingBucket(self.remote.bucket.root)
            return result

        with patch.object(self.remote, "publish", side_effect=replace_after_upload):
            with self.assertRaisesRegex(RuntimeError, "Destino alterado"):
                self.emit()
        self.assertTrue((self.root / "state" / "pending-live.json").exists())
        self.assertEqual({}, self.runtime._remote_confirmation.entries)
        self.emit()
        self.assertFalse((self.root / "state" / "pending-live.json").exists())

    def test_changed_root_is_published_and_clock_rollback_requires_confirmation(self):
        self.remote.bucket.root = self.root / "new-remote"
        self.emit()
        self.assertIsNotNone(self.remote.bucket.get("live/6258/latest.json"))
        counts = self.remote.bucket.gets
        self.clock -= 1
        self.emit()
        self.assertEqual(counts + 4, self.remote.bucket.gets)


if __name__ == "__main__":
    unittest.main()
