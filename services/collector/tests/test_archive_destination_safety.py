"""Ativação, troca de destino e restauração preservam um arquivo legível."""
import json
import shutil
import tempfile
import unittest
from pathlib import Path
from unittest.mock import Mock

from apurar_collector import archive_confirmation, archive_objects
from apurar_collector.publication_archive import PublicationArchive
from apurar_collector.publisher import LocalBucket, Publisher
from apurar_collector.recovery_archive import observation
from apurar_collector.snapshot import encode

STAMP = "2026-10-25T20:00:00Z"
ELECTION = {"id": "6258", "year": 2026, "round": 2, "office": "Presidente"}


class ArchiveDestinationSafetyTests(unittest.TestCase):
    def setUp(self):
        self.directory = tempfile.TemporaryDirectory()
        self.addCleanup(self.directory.cleanup)
        self.root = Path(self.directory.name)
        self.local = Publisher(LocalBucket(self.root / "local"))
        self.remote = Publisher(LocalBucket(self.root / "remote"))
        self.state = self.root / "state"
        archive_confirmation._confirmations.clear()
        archive_objects._references.clear()
        self.addCleanup(archive_confirmation._confirmations.clear)
        self.addCleanup(archive_objects._references.clear)

    def publish(self, identifier, remote=None, stamp=STAMP):
        snapshot = {"schema_version": 1, "snapshot_id": identifier, "mode": "live",
                    "election": ELECTION, "published_at": stamp, "source": {"as_of": stamp}}
        extra = {"schema_version": 1, "snapshot_id": identifier, "election": "6258"}
        pointer = self.local.publish(snapshot, extra, extra)
        if remote is not None:
            remote.publish(snapshot, extra, extra)
        return pointer

    def observe(self, pointer, remote=None, stamp=STAMP, limit=500):
        return PublicationArchive(self.state, self.local, remote).observe(
            "core", pointer, pointer["published_at"], stamp, limit=limit)

    @staticmethod
    def index(publisher):
        pointer = json.loads(publisher.bucket.get("live/6258/archive-latest.json"))
        return json.loads(publisher.bucket.get(pointer["key"]))

    def test_activation_copies_historical_snapshot_and_both_envelopes(self):
        first = self.publish("A")
        self.observe(first)
        self.observe(self.publish("B", self.remote), self.remote)
        index = self.index(self.remote)
        self.assertEqual(2, index["total_observations"])
        for entry in index["observations"]:
            self.assertEqual(3, observation(self.remote.bucket, entry))

    def test_new_bucket_copies_all_public_references_even_with_same_state(self):
        self.observe(self.publish("A", self.remote), self.remote)
        latest = self.publish("B", self.remote)
        self.observe(latest, self.remote)
        replacement = Publisher(LocalBucket(self.root / "replacement"))
        self.observe(latest, replacement)
        for entry in self.index(replacement)["observations"]:
            self.assertEqual(3, observation(replacement.bucket, entry))

    def test_missing_or_corrupt_historical_object_keeps_both_pointers(self):
        for corrupt in (None, b"corrompido"):
            with self.subTest(corrupt=corrupt):
                first = self.publish("A")
                self.observe(first)
                before = self.local.bucket.get("live/6258/archive-latest.json")
                path = self.local.bucket.root / first["history"]["key"]
                original = path.read_bytes()
                if corrupt is None:
                    path.unlink()
                else:
                    path.write_bytes(corrupt)
                with self.assertRaises(ValueError):
                    self.observe(self.publish("B", self.remote), self.remote)
                self.assertEqual(before, self.local.bucket.get("live/6258/archive-latest.json"))
                self.assertIsNone(self.remote.bucket.get("live/6258/archive-latest.json"))
                path.write_bytes(original)

    def test_hash_valid_reference_with_wrong_family_is_rejected(self):
        pointer = self.publish("A")
        pointer["history"] = pointer["municipalities"]
        with self.assertRaisesRegex(ValueError, "Chave de referência"):
            self.observe(pointer, self.remote)
        self.assertIsNone(self.local.bucket.get("live/6258/archive-latest.json"))
        self.assertIsNone(self.remote.bucket.get("live/6258/archive-latest.json"))

    def test_restore_older_state_and_public_bucket_cannot_regress_remote(self):
        first = self.publish("A", self.remote)
        self.observe(first, self.remote)
        shutil.copytree(self.state, self.root / "backup-state")
        shutil.copytree(self.local.bucket.root, self.root / "backup-public")
        self.observe(self.publish("B", self.remote), self.remote)
        before = self.remote.bucket.get("live/6258/archive-latest.json")
        core_before = self.remote.bucket.get("live/6258/latest.json")
        shutil.rmtree(self.state)
        shutil.rmtree(self.local.bucket.root)
        shutil.copytree(self.root / "backup-state", self.state)
        shutil.copytree(self.root / "backup-public", self.local.bucket.root)
        local_before = self.local.bucket.get("live/6258/archive-latest.json")
        self.local.bucket.put = Mock(wraps=self.local.bucket.put)
        self.remote.bucket.put = Mock(wraps=self.remote.bucket.put)
        with self.assertRaisesRegex(ValueError, "anterior ao índice"):
            self.observe(first, self.remote)
        self.assertEqual(before, self.remote.bucket.get("live/6258/archive-latest.json"))
        self.assertEqual(core_before, self.remote.bucket.get("live/6258/latest.json"))
        self.assertEqual(local_before, self.local.bucket.get("live/6258/archive-latest.json"))
        self.local.bucket.put.assert_not_called()
        self.remote.bucket.put.assert_not_called()

    def test_equal_timestamp_and_count_do_not_allow_replacing_another_trajectory(self):
        self.observe(self.publish("A", self.remote), self.remote)
        other_state = self.root / "other-state"
        other = Publisher(LocalBucket(self.root / "other-public"))
        current = self.publish("B")
        for ref in (current, current["municipalities"], current["history"]):
            other.bucket.put(ref["key"], self.local.bucket.get(ref["key"]), "no-store")
        before = self.remote.bucket.get("live/6258/archive-latest.json")
        with self.assertRaisesRegex(ValueError, "Trajetória"):
            PublicationArchive(other_state, other, self.remote).observe("core", current, STAMP, STAMP)
        self.assertIsNone(other.bucket.get("live/6258/archive-latest.json"))
        self.assertEqual(before, self.remote.bucket.get("live/6258/archive-latest.json"))

    def test_newer_remote_timestamp_rejects_even_when_count_is_lower(self):
        first = self.publish("A")
        self.observe(first)
        newer = "2026-10-25T21:00:00Z"
        remote_entry = self.publish("B", self.remote, stamp=newer)
        PublicationArchive(self.root / "other", self.remote).observe(
            "core", remote_entry, newer, newer)
        # O backup local continua em A; B só foi confirmado no destino remoto.
        self.local.bucket.put("live/6258/latest.json", encode(first), "no-store")
        self.local.bucket.put = Mock(wraps=self.local.bucket.put)
        with self.assertRaisesRegex(ValueError, "anterior ao índice"):
            self.observe(self.publish("C"), self.remote)
        # publish(C) atualiza os votos, mas nenhum objeto de arquivo é escrito.
        self.assertFalse(any("archive" in call.args[0]
                             for call in self.local.bucket.put.call_args_list))

    def test_only_public_sample_is_required_at_publication_time(self):
        self.observe(self.publish("A"), limit=2)
        middle = self.publish("B")
        self.observe(middle, limit=2)
        (self.local.bucket.root / middle["key"]).unlink()
        self.observe(self.publish("C"), self.remote, limit=2)
        index = self.index(self.remote)
        self.assertEqual(3, index["total_observations"])
        self.assertEqual(2, len(index["observations"]))
        for entry in index["observations"]:
            observation(self.remote.bucket, entry)

    def test_missing_archive_index_is_repaired_from_other_destination(self):
        first = self.publish("A", self.remote)
        self.observe(first, self.remote)
        for publisher in (self.local, self.remote):
            with self.subTest(destination=publisher.bucket.root):
                pointer = json.loads(publisher.bucket.get("live/6258/archive-latest.json"))
                path = publisher.bucket.root / pointer["key"]
                original = path.read_bytes()
                path.unlink()
                archive_confirmation._confirmations.clear()
                self.observe(first, self.remote)
                self.assertEqual(original, path.read_bytes())
                self.assertEqual(pointer, json.loads(
                    publisher.bucket.get("live/6258/archive-latest.json")))

    def test_missing_local_only_archive_index_is_rebuilt_from_same_observations(self):
        first = self.publish("A")
        self.observe(first)
        pointer = json.loads(self.local.bucket.get("live/6258/archive-latest.json"))
        path = self.local.bucket.root / pointer["key"]
        original = path.read_bytes()
        path.unlink()
        self.observe(first)
        self.assertEqual(original, path.read_bytes())

    def test_remote_corruption_is_rejected_when_reference_cache_expires(self):
        first = self.publish("A", self.remote)
        self.observe(first, self.remote)
        path = self.remote.bucket.root / first["history"]["key"]
        path.write_bytes(b"corrompido")
        archive_confirmation._confirmations.clear()
        archive_objects._references.clear()
        before = self.remote.bucket.get("live/6258/archive-latest.json")
        with self.assertRaisesRegex(ValueError, "divergente"):
            self.observe(first, self.remote)
        self.assertEqual(before, self.remote.bucket.get("live/6258/archive-latest.json"))
        self.assertEqual(b"corrompido", path.read_bytes())

    def test_new_index_only_confirms_new_remote_references(self):
        first = self.publish("A", self.remote)
        self.observe(first, self.remote)
        following = self.publish("B", self.remote)
        self.remote.bucket.get = Mock(wraps=self.remote.bucket.get)
        self.local.bucket.get = Mock(wraps=self.local.bucket.get)
        self.observe(following, self.remote)
        requested = [call.args[0] for call in self.remote.bucket.get.call_args_list]
        local_requested = [call.args[0] for call in self.local.bucket.get.call_args_list]
        for name in (None, "municipalities", "history"):
            old_ref = first if name is None else first[name]
            new_ref = following if name is None else following[name]
            self.assertNotIn(old_ref["key"], requested)
            self.assertNotIn(old_ref["key"], local_requested)
            self.assertIn(new_ref["key"], requested)
            self.assertIn(new_ref["key"], local_requested)
        # 2 leituras de preflight, 3 referências novas, índice e ponteiro.
        self.assertEqual(9, len(requested))
        self.remote.bucket.get.reset_mock()
        self.observe(following, self.remote)
        self.remote.bucket.get.assert_not_called()

    def test_failed_archive_invalidates_reference_confirmations(self):
        first = self.publish("A", self.remote)
        self.observe(first, self.remote)
        following = self.publish("B", self.remote)
        self.assertTrue(archive_objects._references)
        original = self.remote.bucket.put

        def fail_archive(key, body, cache_control):
            if "/archive/" in key:
                raise OSError("offline")
            original(key, body, cache_control)

        self.remote.bucket.put = fail_archive
        with self.assertRaises(OSError):
            self.observe(following, self.remote)
        self.assertFalse(archive_objects._references)

    def test_reference_cache_is_bounded(self):
        from unittest.mock import patch
        with patch.object(archive_objects, "MAX_REFERENCE_CONFIRMATIONS", 2):
            for identifier in ("A", "B", "C"):
                self.observe(self.publish(identifier, self.remote), self.remote)
        self.assertEqual(2, len(archive_objects._references))

    def test_expired_local_reference_is_restored_from_remote(self):
        from unittest.mock import patch
        first = self.publish("A", self.remote)
        self.observe(first, self.remote)
        missing = self.local.bucket.root / first["history"]["key"]
        missing.unlink()
        original = self.remote.bucket.get(first["history"]["key"])
        # A janela do cache é fixa; os polls não a prolongam.
        with patch.object(archive_confirmation.time, "monotonic", return_value=float("inf")):
            self.observe(first, self.remote)
        self.assertEqual(original, missing.read_bytes())

    def test_expired_local_corruption_is_refused(self):
        from unittest.mock import patch
        first = self.publish("A", self.remote)
        self.observe(first, self.remote)
        path = self.local.bucket.root / first["history"]["key"]
        path.write_bytes(b"corrompido")
        previous = self.remote.bucket.get("live/6258/archive-latest.json")
        with patch.object(archive_confirmation.time, "monotonic", return_value=float("inf")):
            with self.assertRaisesRegex(ValueError, "corrompida"):
                self.observe(first, self.remote)
        self.assertEqual(previous, self.remote.bucket.get("live/6258/archive-latest.json"))
        self.assertFalse(archive_objects._references)
