"""Hashes válidos não autorizam misturar modos, eleições ou famílias no restore."""

import hashlib
import json
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

from apurar_collector.demo import fixture
from apurar_collector.recovery import verify_bundle
from apurar_collector.runtime import Runtime
from apurar_collector.snapshot import encode

STAMP = "2026-10-25T20:00:00+00:00"


class RecoveryProvenanceTests(unittest.TestCase):
    def setUp(self):
        self.directory = tempfile.TemporaryDirectory()
        self.addCleanup(self.directory.cleanup)
        root = Path(self.directory.name)
        collection, prior = fixture(STAMP)
        self.output = root / "public"
        runtime = Runtime(prior, root / "state", self.output)
        with patch("apurar_collector.runtime.now", return_value="2026-10-25T20:01:00+00:00"):
            runtime.emit(collection, mode="demo", collected_at=STAMP)
        self.bucket = runtime.local.bucket
        self.pointer = json.loads(self.bucket.get("demo/6258/latest.json"))

    def replace_object(self, kind, mutate):
        reference = self.pointer if kind == "snapshots" else self.pointer[kind]
        value = json.loads(self.bucket.get(reference["key"]))
        mutate(value)
        body = encode(value)
        sha = hashlib.sha256(body).hexdigest()
        key = f"demo/6258/{kind}/{sha}.json"
        self.bucket.put(key, body, "no-store")
        reference.update(key=key, sha256=sha)
        self.bucket.put("demo/6258/latest.json", encode(self.pointer), "no-store")

    def test_hash_valid_snapshot_with_wrong_mode_is_rejected(self):
        self.replace_object("snapshots", lambda value: value.update(mode="live"))
        with self.assertRaisesRegex(ValueError, "Proveniência"):
            verify_bundle(self.output, "demo")

    def test_hash_valid_snapshot_with_wrong_election_is_rejected(self):
        self.replace_object("snapshots", lambda value: value["election"].update(round=1))
        with self.assertRaisesRegex(ValueError, "Proveniência"):
            verify_bundle(self.output, "demo")

    def test_hash_valid_envelope_with_wrong_election_is_rejected(self):
        for kind in ("municipalities", "history"):
            with self.subTest(kind=kind):
                self.replace_object(kind, lambda value: value.update(election="6257"))
                with self.assertRaisesRegex(ValueError, "Envelope"):
                    verify_bundle(self.output, "demo")
                self.replace_object(kind, lambda value: value.update(election="6258"))

    def test_reference_cannot_substitute_other_family(self):
        self.pointer["municipalities"] = dict(self.pointer["history"])
        self.bucket.put("demo/6258/latest.json", encode(self.pointer), "no-store")
        with self.assertRaisesRegex(ValueError, "família"):
            verify_bundle(self.output, "demo")

    def test_unsupported_schema_is_rejected_for_every_object(self):
        for kind in ("snapshots", "municipalities", "history"):
            with self.subTest(kind=kind):
                self.replace_object(kind, lambda value: value.update(schema_version=2))
                with self.assertRaisesRegex(ValueError, "Envelope"):
                    verify_bundle(self.output, "demo")
                self.replace_object(kind, lambda value: value.update(schema_version=1))

    def test_snapshot_and_pointer_publication_times_must_match(self):
        self.replace_object("snapshots", lambda value: value.update(published_at=STAMP))
        with self.assertRaisesRegex(ValueError, "Proveniência"):
            verify_bundle(self.output, "demo")
