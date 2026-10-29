"""Hidratação de metadados novos não autoriza reescrever uma observação TSE."""

import copy
import tempfile
import unittest
from pathlib import Path

from apurar_collector.core.collector import LiveCollector
from apurar_collector.core.enrichment import OPTIONAL_COUNTS, metadata_enrichment
from apurar_collector.core.store import Store
from apurar_collector.core.tse import parse_result
from tests.test_tse import fixture


def pair():
    current = parse_result(fixture("sp00001"), "sp00001")
    current.update(electorate_installed=100, electorate_totalized=120, abstention=20)
    legacy = {k: v for k, v in current.items() if k not in OPTIONAL_COUNTS}
    return legacy, current


class ResultEnrichmentTests(unittest.TestCase):
    def test_collector_accepts_enrichment_at_original_idg_and_clock(self):
        legacy, current = pair()
        collector = LiveCollector()
        self.assertTrue(collector._accept(legacy, current))
        self.assertEqual(collector.revisions, [])
        self.assertEqual(current["idg"], legacy["idg"])
        self.assertEqual(current["generated_at"], legacy["generated_at"])

    def test_cache_persists_enrichment_across_restart(self):
        legacy, current = pair()
        with tempfile.TemporaryDirectory() as folder:
            path = Path(folder) / "official.sqlite3"
            store = Store(path)
            self.assertTrue(store.save_official(legacy))
            self.assertTrue(store.save_official(current))
            store.close()
            restored = Store(path)
            self.assertEqual(restored.official()["sp00001"], current)
            restored.close()

    def test_equal_idg_never_changes_existing_votes_identity_or_clock(self):
        legacy, current = pair()
        mutations = [
            {"votes": {"13": 999, "22": 0}},
            {"valid_votes": 999},
            {"generated_at": "2026-10-04T18:01:00-03:00"},
            {"election": "6258"},
            {"scope": "sp00002"},
            {"candidates": []},
            {"unknown_metadata": 10},
        ]
        collector = LiveCollector()
        for mutation in mutations:
            changed = dict(current, **mutation)
            with self.subTest(mutation=mutation):
                self.assertFalse(metadata_enrichment(legacy, changed))
                self.assertFalse(collector._accept(legacy, changed))

    def test_known_metadata_cannot_be_replaced_or_removed(self):
        _, current = pair()
        for value in (101, None):
            changed = dict(current, electorate_installed=value)
            self.assertFalse(metadata_enrichment(current, changed))
        removed = dict(current)
        del removed["electorate_installed"]
        self.assertFalse(metadata_enrichment(current, removed))
        absent = dict(current, electorate_installed=None)
        self.assertTrue(metadata_enrichment(absent, current))

    def test_store_rejects_same_idg_conflicting_votes_after_enrichment(self):
        legacy, current = pair()
        with tempfile.TemporaryDirectory() as folder:
            store = Store(Path(folder) / "official.sqlite3")
            store.save_official(legacy)
            changed = copy.deepcopy(current)
            changed["votes"]["13"] += 1
            self.assertFalse(store.save_official(changed))
            self.assertEqual(store.official()["sp00001"], legacy)
            store.close()

    def test_bad_optional_counts_are_not_schema_hydration(self):
        legacy, current = pair()
        for value in (-1, True, 0.5, "100"):
            self.assertFalse(
                metadata_enrichment(legacy, dict(current, electorate_installed=value))
            )


if __name__ == "__main__":
    unittest.main()
