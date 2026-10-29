"""Arquivo integral é conferido mesmo quando o índice público omite o ponto."""

import copy
import hashlib
import json
import sqlite3
import tempfile
import unittest
from contextlib import closing
from pathlib import Path
from unittest.mock import patch

from apurar_collector.publication_archive import PublicationArchive
from apurar_collector.publisher import LocalBucket, Publisher
from apurar_collector.recovery_archive import reference, verify_archive
from apurar_collector.supplemental_publication import SupplementalPublication
from apurar_collector.supplemental_tse import pending_item
from apurar_collector.snapshot import encode
from apurar_collector.diagnostics import instant

STAMP = "2026-10-25T20:00:00+00:00"
ELECTION = {"id": "6258", "year": 2026, "round": 2, "office": "Presidente"}


class ArchiveRecoveryTests(unittest.TestCase):
    def setUp(self):
        self.temporary = tempfile.TemporaryDirectory()
        self.addCleanup(self.temporary.cleanup)
        self.root = Path(self.temporary.name)
        self.state = self.root / "state"
        self.state.mkdir()
        self.bucket = LocalBucket(self.root / "public")
        self.publisher = Publisher(self.bucket)

    def publish(self, identifier):
        snapshot = {"schema_version": 1, "snapshot_id": identifier, "mode": "live",
                    "election": ELECTION, "published_at": STAMP, "source": {"as_of": STAMP}}
        extra = {"schema_version": 1, "election": "6258", "snapshot_id": identifier}
        pointer = self.publisher.publish(snapshot, extra, extra)
        PublicationArchive(self.state, self.publisher).observe("core", pointer, STAMP, limit=2)
        return pointer

    def test_legacy_absent_and_configured_missing(self):
        self.assertFalse(verify_archive(self.bucket, self.state)["integral_references"])
        (self.state / "archive-status.json").write_text('{"status":"error"}')
        with self.assertRaises(ValueError):
            verify_archive(self.bucket, self.state)

    def test_all_integral_rows_checked_beyond_public_sample(self):
        self.publish("first")
        middle = self.publish("middle")
        self.publish("last")
        report = verify_archive(self.bucket, self.state)
        self.assertEqual(report["observations"], 3)
        self.assertEqual(report["references"], 9)
        (self.bucket.root / middle["key"]).write_text("corrompido")
        with self.assertRaises(ValueError):
            verify_archive(self.bucket, self.state)

    def test_supplemental_waiting_for_source_allows_null_source_time(self):
        payload = {"schema_version": 1, "mode": "live", "election": "6258",
                   "updated_at": STAMP, "governors": [pending_item({"id": "AC"})],
                   "exterior": {"cities": [], "countries": []}, "zones": [],
                   "coverage": {"pending": 1, "errors": 0}, "capabilities": {}}
        SupplementalPublication(self.state, self.publisher,
                                clock=lambda: instant(STAMP)).publish(payload)
        report = verify_archive(self.bucket, self.state)
        self.assertTrue(report["integral_references"])
        self.assertEqual(report["references"], 1)

    def test_core_still_requires_source_time(self):
        pointer = self.publish("first")
        PublicationArchive(self.state, self.publisher).observe("core", pointer, None)
        # A mesma identidade não substitui o registro anterior; usar outro lote.
        snapshot = {"schema_version": 1, "snapshot_id": "null-source", "mode": "live",
                    "election": ELECTION, "published_at": STAMP, "source": {"as_of": STAMP}}
        extra = {"schema_version": 1, "election": "6258", "snapshot_id": "null-source"}
        pointer = self.publisher.publish(snapshot, extra, extra)
        archive = PublicationArchive(self.state, self.publisher)
        with self.assertRaises(ValueError):
            archive.observe("core", pointer, None)
        with patch.object(archive, "_publish"):
            index = archive.observe("core", pointer, None)
        self.write_raw_index(index)
        with self.assertRaises(ValueError):
            verify_archive(self.bucket, self.state)

    def test_index_hash_and_missing_database(self):
        self.publish("first")
        database = self.state / "publication-archive.sqlite3"
        database.unlink()
        with self.assertRaises(ValueError):
            verify_archive(self.bucket, self.state)
        (self.bucket.root / "live/6258/archive-latest.json").write_text('{"schema_version": 1, "key": "live/6258/archive/bad.json", "sha256": "bad"}')
        with self.assertRaises(ValueError):
            verify_archive(self.bucket, self.state)

    def rewrite_index(self, mutate):
        pointer = json.loads(self.bucket.get("live/6258/archive-latest.json"))
        index = json.loads(self.bucket.get(pointer["key"]))
        mutate(index)
        self.write_raw_index(index)

    def write_raw_index(self, index):
        body = encode(index)
        sha = hashlib.sha256(body).hexdigest()
        key = f"live/6258/archive/{sha}.json"
        self.bucket.put(key, body, "no-store")
        self.bucket.put("live/6258/archive-latest.json", encode({
            "schema_version": 1, "key": key, "sha256": sha,
            "updated_at": index["updated_at"],
        }), "no-store")

    def test_public_sample_requires_exact_integral_observations(self):
        self.publish("first")
        self.publish("last")
        self.rewrite_index(lambda value: value["observations"][0].update(
            source_as_of="2026-10-25T19:00:00+00:00"
        ))
        with self.assertRaisesRegex(ValueError, "observação integral"):
            verify_archive(self.bucket, self.state)

    def test_public_sample_rejects_missing_endpoints_duplicates_and_metadata(self):
        self.publish("first")
        self.publish("last")
        pointer = json.loads(self.bucket.get("live/6258/archive-latest.json"))
        original = json.loads(self.bucket.get(pointer["key"]))
        mutations = [
            lambda value: value.update(observations=[]),
            lambda value: value.update(observations=value["observations"][1:]),
            lambda value: value["observations"].reverse(),
            lambda value: value.update(observations=[value["observations"][0]] * 2),
            lambda value: value.update(sampled=True),
            lambda value: value.update(started_at="2026-10-25T19:00:00Z"),
            lambda value: value.update(total_observations=True),
        ]
        for mutation in mutations:
            with self.subTest(mutation=mutation):
                changed = copy.deepcopy(original)
                mutation(changed)
                self.write_raw_index(changed)
                with self.assertRaises(ValueError):
                    verify_archive(self.bucket, self.state)

    def test_integral_identity_must_match_immutable_pointer(self):
        self.publish("first")
        with sqlite3.connect(self.state / "publication-archive.sqlite3") as connection:
            connection.execute("UPDATE publications SET identity = ?", ("f" * 64,))
        with self.assertRaisesRegex(ValueError, "Identidade"):
            verify_archive(self.bucket, self.state)

    def test_reference_cannot_substitute_another_object_family(self):
        pointer = self.publish("first")
        with self.assertRaisesRegex(ValueError, "Chave de referência"):
            reference(self.bucket, pointer, "supplemental")

    def test_integral_restore_rejects_hash_valid_incompatible_archived_envelopes(self):
        for family in ("municipalities", "history"):
            for changes in ({"schema_version": 999}, {"election": "9999"}):
                with self.subTest(family=family, changes=changes):
                    pointer = self.publish("first")
                    extra = json.loads(self.bucket.get(pointer[family]["key"]))
                    extra.update(changes)
                    body = encode(extra)
                    sha = hashlib.sha256(body).hexdigest()
                    key = f"live/6258/{family}/{sha}.json"
                    self.bucket.put(key, body, "no-store")
                    pointer[family] = {"key": key, "sha256": sha}
                    # A publicação recusa o envelope; simular um acervo antigo
                    # corrompido para exercer também a recuperação.
                    with self.assertRaisesRegex(ValueError, "Lote arquivado"):
                        PublicationArchive(self.state, self.publisher).observe("core", pointer, STAMP)
                    with patch.object(PublicationArchive, "_publish"):
                        index = PublicationArchive(self.state, self.publisher).observe("core", pointer, STAMP)
                    self.write_raw_index(index)
                    with self.assertRaisesRegex(ValueError, "Lote arquivado"):
                        verify_archive(self.bucket, self.state)
                    with closing(sqlite3.connect(self.state / "publication-archive.sqlite3")) as connection:
                        connection.execute("DELETE FROM publications")
                        connection.commit()
                    (self.bucket.root / "live/6258/archive-latest.json").unlink()

    def test_archived_publication_time_must_match_snapshot(self):
        pointer = self.publish("first")
        archive = PublicationArchive(self.state, self.publisher)
        changed = {**pointer, "published_at": "2026-10-25T20:01:00+00:00"}
        with self.assertRaisesRegex(ValueError, "Snapshot arquivado"):
            archive.observe("core", changed, STAMP)
        with patch.object(archive, "_publish"):
            index = archive.observe("core", changed, STAMP)
        self.write_raw_index(index)
        with self.assertRaisesRegex(ValueError, "Snapshot arquivado"):
            verify_archive(self.bucket, self.state)

    def test_archived_source_time_must_match_snapshot(self):
        pointer = self.publish("first")
        with closing(sqlite3.connect(self.state / "publication-archive.sqlite3")) as connection:
            connection.execute("DELETE FROM publications")
            connection.commit()
        archive = PublicationArchive(self.state, self.publisher)
        with self.assertRaises(ValueError):
            archive.observe("core", pointer, "2026-10-25T19:00:00+00:00")
        with patch.object(archive, "_publish"):
            index = archive.observe("core", pointer, "2026-10-25T19:00:00+00:00")
        self.write_raw_index(index)
        with self.assertRaisesRegex(ValueError, "Snapshot arquivado"):
            verify_archive(self.bucket, self.state)
