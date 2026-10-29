"""Publicação suplementar idempotente, sem alterar ponteiro presidencial."""

import json
import tempfile
import unittest
from pathlib import Path
from unittest.mock import Mock

from apurar_collector.publisher import LocalBucket, Publisher
from apurar_collector.supplemental_publication import SupplementalPublication
from apurar_collector.core.tse import validate_url


class SupplementalPublicationTests(unittest.TestCase):
    def payload(self, count=0):
        return {
            "schema_version": 1,
            "election": "6258",
            "mode": "live",
            "updated_at": "2026-10-24T20:00:00Z",
            "governors": [],
            "exterior": {"cities": [], "countries": []},
            "zones": [],
            "capabilities": {},
            "coverage": {"pending": count, "errors": 0},
        }

    def test_verified_idempotent_publication_and_independent_pointer(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            local = Publisher(LocalBucket(root / "bucket"))
            publication = SupplementalPublication(root / "state", local)
            pointer = publication.publish(self.payload())
            unchanged = self.payload()
            unchanged["updated_at"] = "2026-10-24T21:00:00Z"
            self.assertEqual(publication.publish(unchanged), pointer)
            self.assertIsNone(local.bucket.get("live/6258/latest.json"))
            self.assertEqual(
                json.loads(local.bucket.get(pointer["key"]))["updated_at"], "2026-10-24T20:00:00Z"
            )
            with self.assertRaises(ValueError):
                publication.publish(dict(self.payload(), mode="demo"))

    def test_remote_failure_never_confirms_receipt(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            remote = Mock()
            remote.bucket.get.return_value = None
            remote.bucket.put.side_effect = OSError("offline")
            publication = SupplementalPublication(
                root / "state", Publisher(LocalBucket(root / "bucket")), remote
            )
            with self.assertRaises(OSError):
                publication.publish(self.payload())
            self.assertFalse((root / "state" / "supplemental-publication.json").exists())

    def test_only_additional_official_urls_are_allowed(self):
        validate_url(
            "https://resultados.tse.jus.br/oficial/ele2026/6260/dados/ac/ac-c0003-e006260-u.json"
        )
        validate_url("https://resultados.tse.jus.br/oficial/comum/config/ele-c.json")
        for url in [
            "https://example.com/oficial/ele2026/6260/data.json",
            "https://resultados.tse.jus.br/oficial/ele2026/6259/data.json",
        ]:
            with self.assertRaises(ValueError):
                validate_url(url)
