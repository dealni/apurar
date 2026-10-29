"""Causalidade, amostragem explícita e recuperação do arquivo oficial."""

import hashlib
import json
import tempfile
import unittest
from contextlib import closing
from pathlib import Path
from unittest.mock import Mock, patch

from apurar_collector.publication_archive import PublicationArchive, archive_confirmed
from apurar_collector.publisher import LocalBucket, Publisher
from apurar_collector.supplemental_publication import SupplementalPublication
from apurar_collector.snapshot import encode
from apurar_collector.diagnostics import instant


class PublicationArchiveTests(unittest.TestCase):
    @staticmethod
    def pointer(index, bucket=None):
        stamp = "2026-10-25T20:00:00Z"
        body = encode(
            {
                "schema_version": 1,
                "mode": "live",
                "election": "6258",
                "updated_at": stamp,
                "test_observation": index,
            }
        )
        sha = hashlib.sha256(body).hexdigest()
        pointer = {
            "schema_version": 1,
            "key": f"live/6258/supplemental/{sha}.json",
            "sha256": sha,
            "updated_at": stamp,
        }
        if bucket is not None:
            bucket.put(pointer["key"], body, "no-store")
        return pointer

    def test_dedup_preserves_first_observation_but_records_corrections(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            archive = PublicationArchive(root, Publisher(LocalBucket(root / "bucket")))
            stamp = "2026-10-25T20:00:00Z"
            first = archive.observe(
                "supplemental", self.pointer(1, archive.local.bucket), stamp, stamp
            )
            same = archive.observe("supplemental", self.pointer(1), stamp, "2026-10-25T20:01:00Z")
            self.assertEqual(first, same)
            corrected = archive.observe(
                "supplemental", self.pointer(2, archive.local.bucket), stamp, "2026-10-25T20:02:00Z"
            )
            self.assertEqual(corrected["total_observations"], 2)
            self.assertEqual(
                corrected["observations"][0]["source_as_of"],
                corrected["observations"][1]["source_as_of"],
            )
            pointer = json.loads(archive.local.bucket.get("live/6258/archive-latest.json"))
            self.assertEqual(
                hashlib.sha256(archive.local.bucket.get(pointer["key"])).hexdigest(),
                pointer["sha256"],
            )

    def test_public_sample_keeps_endpoints_and_integral_sqlite(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            archive = PublicationArchive(root, Publisher(LocalBucket(root / "bucket")))
            for index in range(7):
                result = archive.observe(
                    "supplemental",
                    self.pointer(index, archive.local.bucket),
                    "2026-10-25T20:00:00Z",
                    limit=3,
                )
            self.assertTrue(result["sampled"])
            self.assertEqual(result["total_observations"], 7)
            self.assertEqual(result["observations"][0]["pointer"], self.pointer(0))
            self.assertEqual(result["observations"][-1]["pointer"], self.pointer(6))
            with closing(archive._open()) as connection:
                self.assertEqual(
                    connection.execute("SELECT COUNT(*) FROM publications").fetchone()[0], 7
                )
            with self.assertRaises(ValueError):
                archive.observe("demo", self.pointer(8), "2026-10-25T20:00:00Z")

    def test_archive_failure_does_not_fail_publication_and_same_payload_retries(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            local = Publisher(LocalBucket(root / "bucket"))
            publication = SupplementalPublication(
                root / "state", local, clock=lambda: instant("2026-10-25T20:00:00Z")
            )
            payload = {
                "schema_version": 1,
                "mode": "live",
                "election": "6258",
                "updated_at": "2026-10-25T20:00:00Z",
            }
            with patch.object(
                PublicationArchive, "_publish", side_effect=OSError("archive offline")
            ):
                pointer = publication.publish(payload)
            self.assertEqual(
                json.loads((root / "state/archive-status.json").read_text())["status"], "error"
            )
            self.assertEqual(publication.publish(payload), pointer)
            self.assertEqual(
                json.loads((root / "state/archive-status.json").read_text())["status"], "ok"
            )
            self.assertIsNotNone(local.bucket.get("live/6258/archive-latest.json"))

    def test_remote_unconfirmed_archive_remains_retryable(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            remote = Mock()
            remote.bucket.get.return_value = None
            remote.bucket.put.side_effect = OSError("offline")
            archive_confirmed(
                root,
                Publisher(LocalBucket(root / "bucket")),
                remote,
                "supplemental",
                self.pointer(0),
                "2026-10-25T20:00:00Z",
            )
            self.assertEqual(
                json.loads((root / "archive-status.json").read_text())["status"], "error"
            )

    def test_presidential_dedup_retries_archive_without_republishing_votes(self):
        from apurar_collector.demo import fixture
        from apurar_collector.runtime import Runtime
        from apurar_collector.snapshot import now

        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            collection, prior = fixture(now())
            runtime = Runtime(prior, root / "state", root / "bucket")
            with patch.object(
                PublicationArchive, "_publish", side_effect=OSError("archive offline")
            ):
                snapshot, pointer = runtime.emit(collection, mode="live")
            with patch.object(
                runtime.local, "publish", side_effect=AssertionError("Não republicar lote igual")
            ):
                retried, same = runtime.emit(collection, mode="live")
            self.assertEqual(snapshot, retried)
            self.assertEqual(pointer, same)
            self.assertEqual(
                json.loads((root / "state/archive-status.json").read_text())["status"], "ok"
            )
            index = json.loads(
                runtime.local.bucket.get(
                    json.loads(runtime.local.bucket.get("live/6258/archive-latest.json"))["key"]
                )
            )
            self.assertEqual(index["total_observations"], 1)
            self.assertEqual(index["observations"][0]["family"], "core")

    def test_invalid_limits_rejected_before_database_or_pointer_changes(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            archive = PublicationArchive(root, Publisher(LocalBucket(root / "bucket")))
            for limit in (1, 501, True, 2.5):
                with self.subTest(limit=limit), self.assertRaises(ValueError):
                    archive.observe("supplemental", self.pointer(0), None, limit=limit)
            self.assertFalse(archive.path.exists())
            self.assertIsNone(archive.local.bucket.get("live/6258/archive-latest.json"))

    def test_oversized_index_preserves_previous_pointer_and_integral_observation(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            local = Publisher(LocalBucket(root / "bucket"))
            archive = PublicationArchive(root, local)
            archive.observe("supplemental", self.pointer(0, local.bucket), None)
            previous = local.bucket.get("live/6258/archive-latest.json")
            local.bucket.put = Mock(wraps=local.bucket.put)
            with patch("apurar_collector.publication_archive.MAX_OBJECT_BYTES", 1):
                with self.assertRaisesRegex(ValueError, "excede limite"):
                    archive.observe("supplemental", self.pointer(1), None)
            local.bucket.put.assert_not_called()
            self.assertEqual(previous, local.bucket.get("live/6258/archive-latest.json"))
            with closing(archive._open()) as connection:
                self.assertEqual(
                    connection.execute("SELECT COUNT(*) FROM publications").fetchone()[0], 2
                )
