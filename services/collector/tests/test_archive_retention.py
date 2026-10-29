"""Retenção nunca sugere excluir resultados que sustentam o arquivo integral."""

import tempfile
import unittest
from pathlib import Path
from apurar_collector.demo import fixture
from apurar_collector.runtime import Runtime
from apurar_collector.maintenance import plan


class ArchiveRetentionTests(unittest.TestCase):
    def test_old_published_references_and_indices_are_protected(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            state = root / "state"
            output = root / "bucket"
            collection, prior = fixture("2026-10-24T20:00:00Z")
            runtime = Runtime(prior, state, output)
            _, first = runtime.emit(collection, mode="live", collected_at="2026-10-24T20:00:00Z")
            collection["national"]["votes"]["13"] += 1
            _, second = runtime.emit(collection, mode="live", collected_at="2026-10-24T20:01:00Z")
            result = plan(state, output, current_time=9999999999)
            self.assertIn(first["key"], result["protected_keys"])
            self.assertIn(second["key"], result["protected_keys"])
            self.assertFalse(result["candidates"])
