"""Nenhuma confirmação de um destino pode confirmar outro bucket."""

import json
import tempfile
import unittest
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import patch

from apurar_collector.demo import fixture
from apurar_collector.publisher import LocalBucket, Publisher
from apurar_collector.runtime import Runtime
from apurar_collector.snapshot import encode


class R2Fake:
    def __init__(self):
        self.name = "bucket-a"
        self.client = SimpleNamespace(meta=SimpleNamespace(endpoint_url="https://endpoint-a.example"))
        self.objects = {}

    def get(self, key):
        return self.objects.get((self.name, self.client.meta.endpoint_url, key))

    def put(self, key, body, cache_control):
        self.objects[self.name, self.client.meta.endpoint_url, key] = body


class DestinationTests(unittest.TestCase):
    def setUp(self):
        self.directory = tempfile.TemporaryDirectory()
        self.addCleanup(self.directory.cleanup)
        self.root = Path(self.directory.name)
        self.collection, self.prior = fixture("2020-01-01T00:00:00Z")
        self.runtime = Runtime(self.prior, self.root / "state", self.root / "public")

    def assert_published(self, publisher, pointer):
        self.assertEqual(publisher.bucket.get("live/6258/latest.json"), encode(pointer))
        for ref in (pointer, pointer["municipalities"], pointer["history"]):
            self.assertIsNotNone(publisher.bucket.get(ref["key"]))

    def test_remote_publisher_change_invalidates_fast_and_normal_dedup(self):
        self.runtime.remote = Publisher(LocalBucket(self.root / "remote-a"), remote=True)
        self.runtime.emit(self.collection, mode="live")
        for name in ("remote-b", "remote-c"):
            self.runtime.remote = Publisher(LocalBucket(self.root / name), remote=True)
            if name == "remote-c":
                self.runtime._input_signatures.clear()  # Exercita também dedup após build.
            _, pointer = self.runtime.emit(self.collection, mode="live")
            self.assert_published(self.runtime.remote, pointer)

    def test_same_r2_instance_changed_name_or_endpoint_requires_publication(self):
        bucket = R2Fake()
        self.runtime.remote = Publisher(bucket, remote=True)
        self.runtime.emit(self.collection, mode="live")
        receipt_path = self.root / "state" / "publication-live.json"
        first = json.loads(receipt_path.read_text())["destinations"]
        bucket.name = "bucket-b"
        _, pointer = self.runtime.emit(self.collection, mode="live")
        self.assert_published(self.runtime.remote, pointer)
        second = json.loads(receipt_path.read_text())["destinations"]
        self.assertNotEqual(first, second)
        bucket.client.meta.endpoint_url = "https://endpoint-b.example"
        _, pointer = self.runtime.emit(self.collection, mode="live")
        self.assert_published(self.runtime.remote, pointer)
        self.assertNotEqual(second, json.loads(receipt_path.read_text())["destinations"])
        self.assertNotIn("endpoint", receipt_path.read_text())
        self.assertNotIn("bucket-b", receipt_path.read_text())

    def test_same_local_bucket_instance_changed_root_requires_publication(self):
        self.runtime.remote = Publisher(LocalBucket(self.root / "remote-a"), remote=True)
        self.runtime.emit(self.collection, mode="live")
        self.runtime.remote.bucket.root = self.root / "remote-b"
        _, pointer = self.runtime.emit(self.collection, mode="live")
        self.assert_published(self.runtime.remote, pointer)
        self.runtime.local.bucket.root = self.root / "public-b"
        _, pointer = self.runtime.emit(self.collection, mode="live")
        self.assert_published(self.runtime.local, pointer)

    def test_failed_upload_retries_to_current_destination_and_receipts_it(self):
        self.runtime.remote = Publisher(LocalBucket(self.root / "remote-a"), remote=True)
        with patch.object(self.runtime.remote, "publish", side_effect=OSError("indisponível")):
            with self.assertRaises(OSError):
                self.runtime.emit(self.collection, mode="live")
        self.runtime.remote = Publisher(LocalBucket(self.root / "remote-b"), remote=True)
        snapshot, pointer = self.runtime.retry_pending(mode="live")
        self.assert_published(self.runtime.remote, pointer)
        receipt = json.loads((self.root / "state" / "publication-live.json").read_text())
        self.assertEqual(receipt["destinations"], self.runtime._destinations())
        with patch.object(self.runtime.remote, "publish", side_effect=AssertionError("upload repetido")):
            self.assertEqual(snapshot, self.runtime.emit(self.collection, mode="live")[0])
