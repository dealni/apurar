import json
import hashlib
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch
from apurar_collector import dataset


class DatasetTests(unittest.TestCase):
    def test_corruption_refuses_bootstrap_before_destination_write(self):
        with tempfile.TemporaryDirectory() as folder:
            root = Path(folder)
            source, destination = root / "source", root / "destination"
            source.mkdir()
            upstream = source / "runoff_manifest.json"
            upstream.write_text('{"basis":"first-turn-2026-only"}')
            (source / "prior_runoff2026.json").write_text("corrompido")
            manifest = root / "manifest.json"
            manifest.write_text(
                json.dumps(
                    {
                        "upstream_manifest_sha256": hashlib.sha256(
                            upstream.read_bytes()
                        ).hexdigest(),
                        "files": {"prior_runoff2026.json": {"sha256": "0" * 64}},
                    }
                )
            )
            with (
                patch.object(dataset, "MANIFEST", manifest),
                self.assertRaises(ValueError),
            ):
                dataset.bootstrap(source, destination)
            self.assertFalse(destination.exists())

    def test_bootstrapped_minimum_dataset_if_available(self):
        registry, prior = dataset.load()
        self.assertEqual(len(registry), 5572)
        self.assertEqual(
            sum(u["valid_votes"] for u in prior["units"].values()), 119300788
        )
        self.assertEqual(prior["basis"], "first-turn-2026-only")

    def test_export_import_is_deterministic_and_preserves_hashes(self):
        with tempfile.TemporaryDirectory() as folder:
            root = Path(folder)
            first = dataset.export_bundle(None, root / "first.zip")
            second = dataset.export_bundle(None, root / "second.zip")
            self.assertEqual(first["sha256"], second["sha256"])
            dataset.import_bundle(root / "first.zip", root / "restored")
            dataset.load(root / "restored")

    def test_zip_traversal_refused_before_writing(self):
        import zipfile

        with tempfile.TemporaryDirectory() as folder:
            root = Path(folder)
            bundle = root / "evil.zip"
            with zipfile.ZipFile(bundle, "w") as archive:
                archive.writestr("../outside.json", "{}")
            with self.assertRaises(ValueError):
                dataset.import_bundle(bundle, root / "restore")
            self.assertFalse((root / "restore").exists())

    def test_clean_clone_uses_vendored_dataset_in_memory_without_writes(self):
        original_root = dataset.ROOT
        with tempfile.TemporaryDirectory() as folder:
            root = Path(folder)
            (root / "resources").mkdir()
            (root / "resources/runtime-data.zip").write_bytes(
                (original_root / "resources/runtime-data.zip").read_bytes()
            )
            with patch.object(dataset, "ROOT", root):
                registry, prior = dataset.load()
                self.assertEqual(len(registry), 5572)
                self.assertEqual(prior["basis"], "first-turn-2026-only")
                self.assertFalse((root / "data").exists())
                with self.assertRaises(FileNotFoundError):
                    dataset.load(root / "explicit-missing")
