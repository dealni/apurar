"""Regressões de renovação e falhas de estrutura, sem acesso à rede."""

import copy
import unittest
from unittest.mock import Mock

from apurar_collector.core.collector import LiveCollector
from apurar_collector.core.tse import FetchResult, parse_catalog, parse_result
from tests.test_tse import fixture


class CollectorRefreshTests(unittest.TestCase):
    def test_catalog_refresh_removes_retired_scopes_from_active_state(self):
        client = Mock()
        client.fetch.return_value = FetchResult("ok", {
            "f": "o", "abr": [{"cd": "sp", "mu": [{"cd": "2", "nm": "Nova"}]}]
        })
        collector = LiveCollector(client)
        collector.catalog = {"ac00001": {"scope": "ac00001", "uf": "AC"}}
        collector.units = {"ac00001": {"idg": "antigo"}}
        collector.tracking_hints = {"ac00001": ("antigo",)}
        collector.tracking_failures = {"ac": "offline"}
        collector._queue("ac00001")
        collector._load_catalog()
        self.assertFalse(collector.units)
        self.assertFalse(collector.tracking_hints)
        self.assertFalse(collector.tracking_failures)
        self.assertEqual(list(collector.pending), ["sp00002", "zz"])
        self.assertEqual(collector.queued, {"sp00002", "zz"})

    def test_empty_catalog_preserves_previous_state(self):
        client = Mock()
        client.fetch.return_value = FetchResult("ok", {"f": "o", "abr": []})
        collector = LiveCollector(client)
        collector.catalog = {"sp00001": {"scope": "sp00001", "uf": "SP"}}
        collector._queue("sp00001")
        with self.assertRaises(ValueError):
            collector._load_catalog()
        self.assertIn("sp00001", collector.catalog)
        self.assertEqual(list(collector.pending), ["sp00001"])

    def test_duplicate_tracking_does_not_override_structural_metadata(self):
        collector = LiveCollector(Mock())
        collector.catalog = {"sp00001": {"scope": "sp00001", "uf": "SP"}}
        entry = {"tpabr": "mu", "cdabr": "00001", "s": {"ts": "2"}, "e": {"te": "500"}}
        raw = {"ele": "6257", "t": "1", "f": "o", "abr": [entry, entry]}
        collector._apply_tracking("sp", FetchResult("ok", raw))
        self.assertNotIn("sections_total", collector.catalog["sp00001"])
        self.assertFalse(collector.structural_states)
        self.assertIn("sp", collector.tracking_failures)

    def test_malformed_result_structures_are_invalid_not_uncaught_failures(self):
        mutations = [
            lambda raw: raw.update(s=None),
            lambda raw: raw.update(carg=[None]),
            lambda raw: raw["carg"][0].update(agr=[None]),
            lambda raw: raw["carg"][0]["agr"][0].update(par=None),
        ]
        for mutate in mutations:
            raw = copy.deepcopy(fixture())
            mutate(raw)
            with self.subTest(raw=raw), self.assertRaises(ValueError):
                parse_result(raw)
        with self.assertRaises(ValueError):
            parse_catalog({"f": "o", "abr": [None]})

    def test_tracking_requires_integer_structural_counts(self):
        for invalid in (True, 2.5, None):
            collector = LiveCollector(Mock())
            collector.catalog = {"sp00001": {"scope": "sp00001", "uf": "SP"}}
            entry = {"tpabr": "mu", "cdabr": "00001", "s": {"ts": invalid}, "e": {"te": "500"}}
            raw = {"ele": "6257", "t": "1", "f": "o", "abr": [entry]}
            collector.client.fetch.return_value = FetchResult("ok", raw)
            collector._tracking()
            self.assertIn("sp", collector.tracking_failures)
            self.assertFalse(collector.structural_states)

    def test_rejected_municipal_version_remains_pending_for_retry(self):
        collector = LiveCollector(Mock())
        old = parse_result(fixture("sp00001"), "sp00001")
        collector.units["sp00001"] = dict(
            old, idg="101", generated_at="2026-10-04T18:01:00-03:00"
        )
        collector._fetch_unit = lambda scope: (scope, old, None, "ok")
        collector._collect_batch(["sp00001"])
        self.assertEqual(collector.units["sp00001"]["idg"], "101")
        self.assertEqual(list(collector.pending), ["sp00001"])
        self.assertIn("sp00001", collector.queued)
