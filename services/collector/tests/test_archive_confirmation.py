"""Cache remoto sem ocultar falhas, restauração ou auditoria periódica."""

import hashlib
import json
import tempfile
import unittest
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import patch

from apurar_collector import archive_confirmation as cache
from apurar_collector import archive_objects
from apurar_collector.publication_archive import PublicationArchive, archive_confirmed
from apurar_collector.publisher import Publisher
from apurar_collector.snapshot import encode


class CountingBucket:
    def __init__(self):
        self.objects = {}
        self.gets = self.puts = 0
        self.fail = False

    def get(self, key):
        self.gets += 1
        if self.fail:
            raise OSError("offline")
        return self.objects.get(key)

    def put(self, key, body, cache_control):
        self.puts += 1
        if self.fail:
            raise OSError("offline")
        self.objects[key] = body


class ArchiveConfirmationTests(unittest.TestCase):
    def setUp(self):
        cache._confirmations.clear()
        archive_objects._references.clear()
        self.directory = tempfile.TemporaryDirectory()
        self.addCleanup(self.directory.cleanup)
        self.addCleanup(cache._confirmations.clear)
        self.addCleanup(archive_objects._references.clear)
        self.local, self.remote = Publisher(CountingBucket()), Publisher(CountingBucket())
        self.clock = 1000
        self.monotonic = patch.object(cache.time, "monotonic", side_effect=lambda: self.clock)
        self.wall = patch.object(cache.time, "time", side_effect=lambda: self.clock)
        self.monotonic.start()
        self.wall.start()
        self.addCleanup(self.monotonic.stop)
        self.addCleanup(self.wall.stop)

    def observe(self, remote=True, number=1):
        archive = PublicationArchive(
            self.directory.name, self.local, self.remote if remote else None
        )
        body = encode(
            {
                "schema_version": 1,
                "mode": "live",
                "election": "6258",
                "updated_at": "2026-10-25T20:00:00Z",
                "observation": number,
            }
        )
        sha = hashlib.sha256(body).hexdigest()
        pointer = {
            "key": f"live/6258/supplemental/{sha}.json",
            "sha256": sha,
            "updated_at": "2026-10-25T20:00:00Z",
        }
        self.local.bucket.objects[pointer["key"]] = body
        return archive.observe("supplemental", pointer, "2026-10-25T20:00:00Z")

    def test_noop_has_zero_remote_requests_but_checks_local(self):
        self.observe()
        counts = self.remote.bucket.gets, self.remote.bucket.puts
        self.observe()
        self.assertEqual(counts, (self.remote.bucket.gets, self.remote.bucket.puts))
        pointer_key = "live/6258/archive-latest.json"
        self.local.bucket.objects.pop(pointer_key)
        self.observe()
        self.assertIn(pointer_key, self.local.bucket.objects)

    def test_busy_noops_do_not_extend_ttl_and_missing_remote_is_repaired(self):
        self.observe()
        pointer_key = "live/6258/archive-latest.json"
        key = json.loads(self.remote.bucket.objects[pointer_key])["key"]
        self.remote.bucket.objects.clear()
        counts = self.remote.bucket.gets
        self.clock += 200
        self.observe()
        self.assertEqual(counts, self.remote.bucket.gets)
        self.clock += 101
        self.observe()
        self.assertIn(key, self.remote.bucket.objects)
        self.assertIn(pointer_key, self.remote.bucket.objects)

    def test_immutable_corruption_is_refused_and_retried(self):
        self.observe()
        key = json.loads(self.remote.bucket.objects["live/6258/archive-latest.json"])["key"]
        self.remote.bucket.objects[key] = b"corrupt"
        self.clock += 300
        for _ in range(2):
            with self.assertRaisesRegex(ValueError, "corrompida"):
                self.observe()
        self.assertEqual(b"corrupt", self.remote.bucket.objects[key])
        self.assertEqual(0, len(cache._confirmations))

    def test_failed_remote_is_not_cached_and_status_recovers(self):
        self.remote.bucket.fail = True
        body = encode(
            {
                "schema_version": 1,
                "mode": "live",
                "election": "6258",
                "updated_at": "2026-10-25T20:00:00Z",
            }
        )
        sha = hashlib.sha256(body).hexdigest()
        pointer = {
            "key": f"live/6258/supplemental/{sha}.json",
            "sha256": sha,
            "updated_at": "2026-10-25T20:00:00Z",
        }
        self.local.bucket.objects[pointer["key"]] = body
        archive_confirmed(
            self.directory.name, self.local, self.remote, "supplemental", pointer, None
        )
        self.assertEqual(0, len(cache._confirmations))
        status = Path(self.directory.name) / "archive-status.json"
        self.assertEqual("error", json.loads(status.read_text())["status"])
        self.remote.bucket.fail = False
        archive_confirmed(
            self.directory.name, self.local, self.remote, "supplemental", pointer, None
        )
        self.assertEqual("ok", json.loads(status.read_text())["status"])

    def test_new_remote_bucket_and_remote_activation_require_confirmation(self):
        self.observe(remote=False)
        self.observe()
        self.assertGreater(self.remote.bucket.gets, 0)
        self.remote.bucket = CountingBucket()
        self.observe()
        self.assertGreater(self.remote.bucket.puts, 0)

    def test_changed_content_requires_confirmation(self):
        self.observe()
        counts = self.remote.bucket.puts
        self.observe(number=2)
        self.assertGreater(self.remote.bucket.puts, counts)

    def test_remote_object_failure_preserves_both_archive_pointers(self):
        self.observe()
        pointer_key = "live/6258/archive-latest.json"
        previous = self.local.bucket.objects[pointer_key]
        original_put = self.remote.bucket.put

        def fail_object(key, body, cache_control):
            if "/archive/" in key:
                raise OSError("Objeto remoto indisponível")
            original_put(key, body, cache_control)

        self.remote.bucket.put = fail_object
        with self.assertRaises(OSError):
            self.observe(number=2)
        self.assertEqual(previous, self.local.bucket.objects[pointer_key])
        self.assertEqual(previous, self.remote.bucket.objects[pointer_key])
        self.assertEqual(0, len(cache._confirmations))
        self.remote.bucket.put = original_put
        result = self.observe(number=2)
        self.assertEqual(2, result["total_observations"])
        self.assertEqual(
            self.local.bucket.objects[pointer_key], self.remote.bucket.objects[pointer_key]
        )

    def test_same_bucket_with_changed_name_or_endpoint_is_reconfirmed(self):
        bucket = self.remote.bucket
        bucket.name = "bucket-a"
        bucket.client = SimpleNamespace(meta=SimpleNamespace(endpoint_url="https://one.invalid"))
        self.observe()
        for change in (
            lambda: setattr(bucket, "name", "bucket-b"),
            lambda: setattr(bucket.client.meta, "endpoint_url", "https://two.invalid"),
        ):
            counts = bucket.gets
            change()
            self.observe()
            self.assertGreater(bucket.gets, counts)

    def test_wall_clock_rollback_alone_requires_confirmation(self):
        self.observe()
        counts = self.remote.bucket.gets
        self.clock += 10
        with patch.object(cache.time, "time", return_value=999):
            self.observe()
        self.assertGreater(self.remote.bucket.gets, counts)

    def test_restart_and_clock_rollback_force_confirmation(self):
        self.observe()
        cache._confirmations.clear()
        counts = self.remote.bucket.gets
        self.observe()
        self.assertGreater(self.remote.bucket.gets, counts)
        counts = self.remote.bucket.gets
        self.clock -= 1
        self.observe()
        self.assertGreater(self.remote.bucket.gets, counts)

    def test_local_corruption_invalidates_remote_confirmation(self):
        self.observe()
        pointer_key = "live/6258/archive-latest.json"
        key = json.loads(self.local.bucket.objects[pointer_key])["key"]
        original = self.local.bucket.objects[key]
        self.local.bucket.objects[key] = b"corrupt"
        with self.assertRaises(ValueError):
            self.observe()
        self.local.bucket.objects[key] = original
        counts = self.remote.bucket.gets
        self.observe()
        self.assertGreater(self.remote.bucket.gets, counts)

    def test_cache_has_bounded_destinations(self):
        for index in range(cache.MAX_CONFIRMATIONS + 5):
            key = (str(index), None, None, "digest")
            cache.confirm(key, self.local, self.remote)
        self.assertEqual(cache.MAX_CONFIRMATIONS, len(cache._confirmations))
        self.assertNotIn(("0", None, None, "digest"), cache._confirmations)
