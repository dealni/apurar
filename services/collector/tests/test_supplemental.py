"""Regressões de identidade, divulgação, soma e recuperação suplementares."""

import copy
import tempfile
import unittest
from datetime import datetime
from pathlib import Path

from apurar_collector.core.tse import FetchResult
from apurar_collector.supplemental import SupplementalCollector, catalog_targets, country_results
from apurar_collector.supplemental_tse import parse_supplemental, supplemental_url

RESULT_NOW = datetime.fromisoformat("2026-10-25T21:01:00Z").timestamp()


def raw_result(election="6258", office="1", scope="29955", tp="mu"):
    return {
        "ele": election,
        "t": "2",
        "f": "o",
        "tpabr": tp,
        "cdabr": scope,
        "dg": "25/10/2026",
        "hg": "18:00:00",
        "dt": "25/10/2026",
        "ht": "17:59:00",
        "dv": "s",
        "s": {"ts": "2", "st": "1", "snt": "1"},
        "e": {"te": "200", "c": "90", "a": "10"},
        "v": {"vv": "80", "vb": "5", "tvn": "5"},
        "carg": [
            {
                "cd": office,
                "agr": [
                    {
                        "par": [
                            {
                                "sg": "PT",
                                "cand": [{"n": "13", "nm": "CANDIDATO TESTE", "vap": "80"}],
                            }
                        ]
                    }
                ],
            }
        ],
    }


def city_target():
    catalog = {
        "f": "o",
        "abr": [
            {"cd": "zz", "ds": "EXTERIOR", "mu": [{"cd": "29955", "nm": "LISBOA", "z": ["0001"]}]}
        ],
    }
    return catalog_targets(
        catalog, "6258", {"29955": {"country": "Portugal", "country_code": "PT"}}
    )[0]


class SupplementalTests(unittest.TestCase):
    def test_identity_and_office(self):
        target = city_target()
        self.assertEqual(parse_supplemental(raw_result(), target)["candidates"][0]["votes"], 80)
        for field, wrong in (("ele", "6260"), ("cdabr", "11111"), ("f", "s"), ("t", "1")):
            raw = raw_result()
            raw[field] = wrong
            with self.assertRaises(ValueError):
                parse_supplemental(raw, target)
        raw = raw_result()
        raw["carg"][0]["cd"] = "3"
        with self.assertRaises(ValueError):
            parse_supplemental(raw, target)

    def test_governor_and_historical_zone_parser(self):
        raw = {
            "f": "o",
            "abr": [
                {"cd": "ac", "ds": "ACRE", "mu": [{"cd": "00035", "nm": "TESTE", "z": ["0001"]}]}
            ],
        }
        targets = catalog_targets(raw, "6260", {})
        result = parse_supplemental(raw_result("6260", "3", "ac", "uf"), targets[0])
        self.assertEqual(result["office"], "governor")
        zone_target = {
            **targets[1],
            "id": "AC:00035:0001",
            "kind": "zone",
            "zone": "0001",
            "municipality_id": "AC:00035",
            "source_url": supplemental_url("ac00035", "6260", "governor", "0001"),
        }
        result = parse_supplemental(raw_result("6260", "3", "0001", "zona"), zone_target)
        self.assertEqual(result["municipality_id"], "AC:00035")
        self.assertIn("-z0001-c0003-", result["source_url"])

    def test_withheld_is_not_zero(self):
        raw = raw_result()
        raw["dv"] = "n"
        item = parse_supplemental(raw, city_target())
        self.assertEqual(item["status"], "withheld")
        self.assertIsNone(item["candidates"][0]["votes"])
        self.assertIsNone(item["totals"]["valid"])
        self.assertIsNone(item["sections"]["counted"])
        self.assertEqual(country_results([item])[0]["status"], "awaiting")

    def test_country_uses_official_votes_and_oldest_time(self):
        item = parse_supplemental(raw_result(), city_target())
        other = copy.deepcopy(item)
        other["id"] = "ZZ:99999"
        other["as_of"] = "2026-10-25T17:50:00-03:00"
        country = country_results([item, other])[0]
        self.assertEqual(country["candidates"][0]["votes"], 160)
        self.assertEqual(country["as_of"], other["as_of"])
        other["status"] = "awaiting"
        country = country_results([item, other])[0]
        self.assertTrue(country["stale"])
        self.assertEqual(country["coverage"], {"available": 1, "total": 2})

    def test_missing_time_or_inconsistent_sections_rejected(self):
        for change in ({"dt": "", "ht": ""}, {"s": {"ts": "2", "st": "3", "snt": "0"}}):
            with self.assertRaises(ValueError):
                parse_supplemental({**raw_result(), **change}, city_target())

    def test_urls_reject_invalid_input(self):
        for args in (("../zz",), ("zz", "6260", "president"), ("zz", "6258", "president", "0001")):
            with self.assertRaises(ValueError):
                supplemental_url(*args)

    def test_restore_preserves_official_result_and_error(self):
        with tempfile.TemporaryDirectory() as directory:

            class Client:
                def fetch(self, url):
                    return FetchResult("backoff", error="HTTP 429", url=url)

            collector = SupplementalCollector(Client(), directory, clock=lambda: 1000)
            target = city_target()
            key = "6258:" + target["id"]
            collector.targets[key] = target
            collector.items[key] = parse_supplemental(raw_result(), target)
            collector._fetch(key)
            self.assertTrue(collector.items[key]["stale"])
            self.assertEqual(collector.items[key]["totals"]["valid"], 80)
            collector._save()
            restored = SupplementalCollector(Client(), directory)
            self.assertEqual(restored.items, collector.items)
            self.assertEqual(restored.payload()["coverage"]["errors"], 1)
            self.assertTrue(Path(directory, "supplemental-state.json").exists())

    def test_step_budgets_cursor_and_catalog_restore(self):
        catalog = {
            "f": "o",
            "abr": [
                {
                    "cd": "zz",
                    "ds": "EXTERIOR",
                    "mu": [
                        {"cd": "29955", "nm": "LISBOA", "z": ["0001"]},
                        {"cd": "29416", "nm": "BOSTON", "z": ["0001"]},
                    ],
                }
            ],
        }

        class Client:
            def __init__(self):
                self.calls = []

            def fetch(self, url):
                self.calls.append(url)
                if "/config/" in url:
                    return FetchResult(
                        "ok", catalog if "/6258/" in url else {"f": "o", "abr": []}, url=url
                    )
                code = url.rsplit("/", 1)[1][2:7]
                zone = "-z0001-" in url
                return FetchResult(
                    "ok",
                    raw_result(scope="0001" if zone else code, tp="zona" if zone else "mu"),
                    url=url,
                )

        with tempfile.TemporaryDirectory() as directory:
            client = Client()
            collector = SupplementalCollector(client, directory, clock=lambda: RESULT_NOW)
            payload = collector.step(budget=1)
            self.assertEqual(len(client.calls), 3)
            self.assertEqual(payload["coverage"]["available"], 1)
            client.calls.clear()
            payload = collector.step(budget=1)
            self.assertEqual(len(client.calls), 1)
            self.assertIn("zz29416-c", client.calls[0])
            self.assertEqual(payload["coverage"]["available"], 2)
            restored = SupplementalCollector(client, directory, clock=lambda: RESULT_NOW)
            self.assertEqual(restored.cursors["detail"], 2)

    def test_restart_rejects_older_generation_but_accepts_vote_correction(self):
        class Client:
            data = raw_result()

            def fetch(self, url):
                return FetchResult("ok", self.data, url=url)

        with tempfile.TemporaryDirectory() as directory:
            client = Client()
            collector = SupplementalCollector(client, directory, clock=lambda: RESULT_NOW)
            target = city_target()
            key = "6258:" + target["id"]
            collector.targets[key] = target
            collector.items[key] = parse_supplemental(raw_result(), target)
            collector._save()
            restored = SupplementalCollector(client, directory, clock=lambda: RESULT_NOW)
            client.data = raw_result()
            client.data["hg"] = "17:00:00"
            restored._fetch(key)
            self.assertTrue(restored.items[key]["stale"])
            self.assertEqual(restored.items[key]["generated_at"], "2026-10-25T18:00:00-03:00")
            client.data = raw_result()
            client.data["hg"] = "18:01:00"
            client.data["carg"][0]["agr"][0]["par"][0]["cand"][0]["vap"] = "70"
            restored._fetch(key)
            self.assertFalse(restored.items[key]["stale"])
            self.assertEqual(restored.items[key]["candidates"][0]["votes"], 70)
