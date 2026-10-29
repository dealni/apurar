"""Restore valida também o feed independente de governadores/exterior/zonas."""

import hashlib
import json
import tempfile
import unittest
from pathlib import Path

from apurar_collector.publisher import LocalBucket
from apurar_collector.recovery import verify_supplemental
from apurar_collector.snapshot import encode


class SupplementalRecoveryTests(unittest.TestCase):
    def setUp(self):
        self.temporary = tempfile.TemporaryDirectory()
        self.addCleanup(self.temporary.cleanup)
        self.bucket = LocalBucket(Path(self.temporary.name))
        payload = {"schema_version": 1, "election": "6258", "mode": "live", "updated_at": "2026-10-25T20:00:00+00:00"}
        self.body = encode(payload)
        sha = hashlib.sha256(self.body).hexdigest()
        self.pointer = {"schema_version": 1, "key": f"live/6258/supplemental/{sha}.json", "sha256": sha, "updated_at": payload["updated_at"]}

    def put(self):
        self.bucket.put(self.pointer["key"], self.body, "no-store")
        self.bucket.put("live/6258/supplemental-latest.json", encode(self.pointer), "no-store")

    def test_legacy_absent_is_explicit(self):
        self.assertEqual(verify_supplemental(self.bucket, "live"), (None, None))

    def test_complete_hash_and_no_presidential_id_needed(self):
        self.put()
        pointer, reference = verify_supplemental(self.bucket, "live")
        self.assertEqual(pointer, self.pointer)
        self.assertEqual(reference["sha256"], self.pointer["sha256"])

    def test_corrupt_or_missing_object_rejected(self):
        self.put()
        path = self.bucket.root / self.pointer["key"]
        path.write_bytes(b"{}")
        with self.assertRaises(ValueError):
            verify_supplemental(self.bucket, "live")
        path.unlink()
        with self.assertRaises(ValueError):
            verify_supplemental(self.bucket, "live")

    def test_missing_pointer_and_bad_metadata_rejected(self):
        self.put()
        (self.bucket.root / "live/6258/supplemental-latest.json").unlink()
        with self.assertRaises(ValueError):
            verify_supplemental(self.bucket, "live")
        pointer = {**self.pointer, "updated_at": "sem horário"}
        self.bucket.put("live/6258/supplemental-latest.json", json.dumps(pointer).encode(), "no-store")
        with self.assertRaises(ValueError):
            verify_supplemental(self.bucket, "live")
