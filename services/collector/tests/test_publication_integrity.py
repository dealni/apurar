"""Publicações locais íntegras, mesmo após perda ou troca de destino."""
import copy
import json
import tempfile
import unittest
from pathlib import Path
from unittest.mock import Mock

from apurar_collector.demo import fixture
from apurar_collector.publisher import LocalBucket, Publisher
from apurar_collector.snapshot import aware_datetime, build, municipalities
from apurar_collector.supplemental_publication import SupplementalPublication, source_as_of

STAMP = "2026-10-25T20:00:00Z"


class PublicationIntegrityTests(unittest.TestCase):
    def setUp(self):
        self.directory = tempfile.TemporaryDirectory()
        self.addCleanup(self.directory.cleanup)
        self.root = Path(self.directory.name)
        self.local = Publisher(LocalBucket(self.root / "local"))
        self.remote = Publisher(LocalBucket(self.root / "remote"), remote=True)
        self.publication = SupplementalPublication(self.root / "state", self.local, self.remote,
            clock=lambda: aware_datetime("2026-10-25T21:00:00Z").timestamp())
        self.payload = {"schema_version": 1, "election": "6258", "mode": "live",
                        "updated_at": STAMP, "governors": [], "exterior": {"cities": []}}

    def test_reused_receipt_restores_missing_remote_objects_and_pointer(self):
        pointer = self.publication.publish(self.payload)
        for key in (pointer["key"], "live/6258/supplemental-latest.json"):
            self.remote.bucket._path(key).unlink()
        repeated = dict(self.payload, updated_at="2026-10-25T21:00:00Z")
        self.assertEqual(pointer, self.publication.publish(repeated))
        self.assertEqual(self.local.bucket.get(pointer["key"]), self.remote.bucket.get(pointer["key"]))
        self.assertEqual(pointer, json.loads(self.remote.bucket.get("live/6258/supplemental-latest.json")))

    def test_reused_receipt_confirms_new_remote_destination(self):
        pointer = self.publication.publish(self.payload)
        self.publication.remote = Publisher(LocalBucket(self.root / "other"), remote=True)
        self.assertEqual(pointer, self.publication.publish(self.payload))
        self.assertIsNotNone(self.publication.remote.bucket.get(pointer["key"]))

    def test_reused_receipt_refuses_local_or_remote_corruption(self):
        pointer = self.publication.publish(self.payload)
        for publisher in (self.local, self.remote):
            path = publisher.bucket._path(pointer["key"])
            original = path.read_bytes()
            path.write_bytes(b"corrupt")
            with self.assertRaisesRegex(ValueError, "divergente"):
                self.publication.publish(self.payload)
            path.write_bytes(original)

    def test_remote_object_failure_preserves_both_previous_pointers(self):
        self.publication.publish(self.payload)
        before = self.local.bucket.get("live/6258/supplemental-latest.json")
        original = self.remote.bucket.put

        def fail(key, body, cache_control):
            if "/supplemental/" in key:
                raise OSError("offline")
            original(key, body, cache_control)

        self.remote.bucket.put = fail
        changed = dict(self.payload, updated_at="2026-10-25T21:00:00Z", governors=[{"as_of": STAMP}])
        with self.assertRaises(OSError):
            self.publication.publish(changed)
        for publisher in (self.local, self.remote):
            self.assertEqual(before, publisher.bucket.get("live/6258/supplemental-latest.json"))

    def test_supplemental_rollback_refused_before_any_write(self):
        self.publication.publish(self.payload)
        old = dict(self.payload, updated_at="2026-10-25T19:00:00Z", governors=[{"as_of": STAMP}])
        self.local.bucket.put = Mock(wraps=self.local.bucket.put)
        with self.assertRaisesRegex(ValueError, "anterior"):
            self.publication.publish(old)
        self.local.bucket.put.assert_not_called()

    def test_source_as_of_compares_instants_across_offsets(self):
        payload = {"governors": [{"as_of": "2026-10-25T18:00:00-03:00"},
                                 {"as_of": "2026-10-25T20:00:00Z"}]}
        self.assertEqual("2026-10-25T20:00:00Z", source_as_of(payload))

    def test_dates_require_explicit_timezone(self):
        for stamp in ("2026-10-25", "2026-10-25T20:00:00", None):
            with self.assertRaises(ValueError):
                aware_datetime(stamp)
        collection, prior = fixture("2026-10-25T20:00:00")
        with self.assertRaises(ValueError):
            build(collection, prior, mode="demo", collected_at="2026-10-25T20:00:00", published_at="2026-10-25T20:00:00")

    def test_publisher_rejects_other_election_envelope_without_io(self):
        collection, prior = fixture(STAMP)
        snapshot = build(collection, prior, mode="demo", collected_at=STAMP, published_at=STAMP)
        cities = municipalities(collection) | {"snapshot_id": snapshot["snapshot_id"]}
        history = {"schema_version": 1, "election": "6258", "snapshot_id": snapshot["snapshot_id"], "points": []}
        for field in ("cities", "history", "snapshot"):
            values = copy.deepcopy([snapshot, cities, history])
            values[{"snapshot": 0, "cities": 1, "history": 2}[field]]["election"] = "6257"
            bucket = Mock()
            with self.assertRaises(ValueError):
                Publisher(bucket).publish(*values)
            bucket.get.assert_not_called()
            bucket.put.assert_not_called()
