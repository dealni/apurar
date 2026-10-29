"""Falhas de catálogo/estado não inventam cobertura nem interrompem o núcleo."""

import copy
import json
import tempfile
import unittest

from apurar_collector.core.tse import FetchResult
from apurar_collector.supplemental import SupplementalCollector, catalog_targets, country_results
from apurar_collector.supplemental_tse import parse_supplemental, pending_item
from tests.test_supplemental import city_target, raw_result


class SupplementalResilienceTests(unittest.TestCase):
    def test_totalization_cannot_follow_its_own_official_generation(self):
        target = catalog_targets(
            {"f": "o", "abr": [{"cd": "ac", "ds": "ACRE", "mu": []}]},
            "6260", {},
        )[0]
        raw = raw_result("6260", "3", "ac", "uf")
        raw["ht"] = "18:01:00"
        with self.assertRaises(ValueError):
            parse_supplemental(raw, target)

    def test_foreign_local_clock_uses_official_generation(self):
        for local_hour in ("17:59:00", "18:01:00", "23:59:00"):
            with self.subTest(local_hour=local_hour):
                raw = raw_result()
                raw["ht"] = local_hour
                item = parse_supplemental(raw, city_target())
                self.assertEqual(item["as_of"], item["generated_at"])
                self.assertEqual(item["as_of"], "2026-10-25T18:00:00-03:00")

    def test_catalog_refresh_removes_retired_targets_and_retry(self):
        class Client:
            def fetch(self, url):
                return FetchResult("ok", {"f": "o", "abr": []}, url=url)

        with tempfile.TemporaryDirectory() as directory:
            collector = SupplementalCollector(Client(), directory, clock=lambda: 10000)
            target = city_target()
            key = "6258:" + target["id"]
            collector.targets[key] = target
            collector.items[key] = pending_item(target)
            collector.detail_retry[key] = 20000
            collector._catalogs()
            self.assertFalse(collector.targets)
            self.assertFalse(collector.items)
            self.assertFalse(collector.detail_retry)
            self.assertEqual(collector.payload()["coverage"]["total"], 0)

    def test_invalid_catalog_preserves_previous_election(self):
        class Client:
            def fetch(self, url):
                return FetchResult("ok", {"f": "o", "abr": [None]}, url=url)

        with tempfile.TemporaryDirectory() as directory:
            collector = SupplementalCollector(Client(), directory, clock=lambda: 10000)
            target = city_target()
            key = "6258:" + target["id"]
            collector.targets[key] = target
            collector.items[key] = pending_item(target)
            collector._catalogs()
            self.assertEqual(collector.targets, {key: target})
            self.assertEqual(collector.payload()["coverage"]["errors"], 1)

    def test_malformed_source_preserves_votes_and_marks_stale(self):
        class Client:
            def fetch(self, url):
                raw = raw_result()
                raw["carg"] = [None]
                return FetchResult("ok", raw, url=url)

        with tempfile.TemporaryDirectory() as directory:
            collector = SupplementalCollector(Client(), directory, clock=lambda: 10000)
            target = city_target()
            key = "6258:" + target["id"]
            collector.targets[key] = target
            collector.items[key] = parse_supplemental(raw_result(), target)
            collector._safe_fetch(key)
            self.assertEqual(collector.items[key]["totals"]["valid"], 80)
            self.assertTrue(collector.items[key]["stale"])
            self.assertEqual(collector.items[key]["fetch_status"], "error")

    def test_restore_rejects_corruption_atomically(self):
        with tempfile.TemporaryDirectory() as directory:
            collector = SupplementalCollector(None, directory)
            target = city_target()
            key = "6258:" + target["id"]
            collector.targets[key] = target
            collector.items[key] = pending_item(target)
            collector._save()
            original = json.loads(collector.path.read_text())
            for change in (
                "missing_item",
                "bad_cursor",
                "wrong_identity",
                "bad_target",
                "bad_counts",
            ):
                with self.subTest(change=change):
                    state = copy.deepcopy(original)
                    if change == "missing_item":
                        state["items"] = {}
                    elif change == "bad_cursor":
                        state["cursors"] = {"detail": -1}
                    elif change == "wrong_identity":
                        state["items"][key]["scope"] = "zz99999"
                    elif change == "bad_counts":
                        state["items"][key]["totals"] = None
                    else:
                        state["targets"][key] = None
                    collector.path.write_text(json.dumps(state))
                    restored = SupplementalCollector(None, directory)
                    self.assertFalse(restored.targets)
                    self.assertFalse(restored.items)
                    self.assertEqual(restored.payload()["coverage"]["errors"], 1)

    def test_municipal_alias_and_absent_country_timestamp(self):
        raw = raw_result()
        raw["tpabr"] = "mun"
        timed = parse_supplemental(raw, city_target())
        raw = raw_result()
        raw.update(dt="", ht="")
        raw["s"] = {"ts": "2", "st": "0", "snt": "2"}
        raw["v"] = {"vv": "0", "vb": "0", "tvn": "0"}
        raw["e"]["c"] = "0"
        raw["carg"][0]["agr"][0]["par"][0]["cand"][0]["vap"] = "0"
        untimed = parse_supplemental(raw, city_target())
        untimed["id"] = "ZZ:99999"
        country = country_results([timed, untimed])[0]
        self.assertIsNone(country["as_of"])
        self.assertEqual(country["coverage"], {"available": 2, "total": 2})

    def test_restore_available_requires_votes_generation_and_sections(self):
        with tempfile.TemporaryDirectory() as directory:
            collector = SupplementalCollector(None, directory)
            target = city_target()
            key = "6258:" + target["id"]
            collector.targets[key] = target
            collector.items[key] = parse_supplemental(raw_result(), target)
            collector._save()
            original = json.loads(collector.path.read_text())
            for change in (
                "votes",
                "absent_votes",
                "generated_at",
                "sections",
                "section_order",
                "missing_as_of",
                "future_as_of",
            ):
                with self.subTest(change=change):
                    state = copy.deepcopy(original)
                    item = state["items"][key]
                    if change == "votes":
                        item["candidates"][0]["votes"] = None
                    elif change == "absent_votes":
                        del item["candidates"][0]["votes"]
                    elif change == "generated_at":
                        item["generated_at"] = None
                    elif change == "sections":
                        item["sections"]["counted"] = None
                    elif change == "missing_as_of":
                        item["as_of"] = None
                    elif change == "future_as_of":
                        item["as_of"] = "2026-10-25T18:01:00-03:00"
                    else:
                        item["sections"]["counted"] = item["sections"]["total"] + 1
                    collector.path.write_text(json.dumps(state))
                    restored = SupplementalCollector(None, directory)
                    self.assertFalse(restored.items)
                    self.assertEqual(restored.payload()["coverage"]["errors"], 1)

    def test_restore_preserves_untimed_precount_result(self):
        raw = raw_result()
        raw.update(dt="", ht="")
        raw["s"] = {"ts": "2", "st": "0", "snt": "2"}
        raw["v"] = {"vv": "0", "vb": "0", "tvn": "0"}
        raw["e"]["c"] = "0"
        raw["carg"][0]["agr"][0]["par"][0]["cand"][0]["vap"] = "0"
        with tempfile.TemporaryDirectory() as directory:
            collector = SupplementalCollector(None, directory)
            target = city_target()
            key = "6258:" + target["id"]
            collector.targets[key] = target
            collector.items[key] = parse_supplemental(raw, target)
            collector._save()
            restored = SupplementalCollector(None, directory)
            self.assertEqual(restored.items, collector.items)
            self.assertIsNone(restored.last_error)

    def test_restore_migrates_valid_foreign_time_after_validation(self):
        with tempfile.TemporaryDirectory() as directory:
            collector = SupplementalCollector(None, directory)
            target = city_target()
            key = "6258:" + target["id"]
            item = parse_supplemental(raw_result(), target)
            item["as_of"] = "2026-10-25T17:59:00-03:00"
            collector.targets[key] = target
            collector.items[key] = item
            collector._save()
            restored = SupplementalCollector(None, directory)
            self.assertEqual(restored.items[key]["as_of"], item["generated_at"])
            self.assertEqual(restored.items[key]["candidates"], item["candidates"])
            self.assertIsNone(restored.last_error)

    def test_restore_schedule_rejects_nonfinite_numbers_and_booleans(self):
        with tempfile.TemporaryDirectory() as directory:
            collector = SupplementalCollector(None, directory)
            target = city_target()
            key = "6258:" + target["id"]
            collector.targets[key] = target
            collector.items[key] = pending_item(target)
            collector._save()
            original = json.loads(collector.path.read_text())
            for field in ("catalog_checked_at", "detail_retry"):
                for value in (float("nan"), float("inf"), float("-inf"), True):
                    with self.subTest(field=field, value=value):
                        state = copy.deepcopy(original)
                        state[field] = {key: value} if field == "detail_retry" else value
                        collector.path.write_text(json.dumps(state))
                        restored = SupplementalCollector(None, directory)
                        self.assertFalse(restored.items)
                        self.assertEqual(restored.payload()["coverage"]["errors"], 1)
