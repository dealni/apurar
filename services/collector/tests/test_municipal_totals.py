"""Semântica municipal EA20: votos válidos e computados são distintos."""

import copy
import json
import unittest
from pathlib import Path

from apurar_collector.core.tse import parse_result
from apurar_collector.snapshot import municipalities
from tests.test_tse import fixture


def raw_municipality():
    raw = fixture("ac01120")
    raw.update(ele="6258", t="2")
    raw["e"] = {"te": "10208", "est": "500", "esi": "450", "c": "200", "a": "250"}
    raw["v"] = {
        "vv": "80", "vvc": "180", "van": "70", "vansj": "30",
        "tv": "200", "vb": "10", "tvn": "10",
    }
    candidates = raw["carg"][0]["agr"][0]["par"]
    candidates[0]["cand"][0]["dvt"] = "Válidos"
    candidates[1]["cand"][0]["dvt"] = "Anulados sub judice"
    return raw


def row_for(result):
    return municipalities({"units": [{
        "scope": "ac01120", "uf": "AC", "name": "ACRELÂNDIA", "result": result,
    }]})["items"][0]


class MunicipalTotalsTests(unittest.TestCase):
    def test_partial_keeps_electorates_and_official_abstention_separate(self):
        parsed = parse_result(raw_municipality(), "ac01120", "6258")
        totals = row_for(parsed)["totals"]
        self.assertEqual(totals["electorate"], 10208)
        self.assertEqual(totals["electorate_totalized"], 500)
        self.assertEqual(totals["electorate_installed"], 450)
        self.assertEqual(totals["turnout"], 200)
        self.assertEqual(totals["abstention"], 250)
        self.assertEqual(totals["turnout"] + totals["abstention"], 450)

    def test_computed_candidates_are_not_official_valid_votes(self):
        row = row_for(parse_result(raw_municipality(), "ac01120", "6258"))
        self.assertEqual(sum(c["votes"] for c in row["candidates"]), 180)
        self.assertEqual(row["totals"], {
            "electorate": 10208, "electorate_totalized": 500,
            "electorate_installed": 450, "turnout": 200, "abstention": 250,
            "valid": 80, "computed": 180, "annulled": 70, "sub_judice": 30,
            "blank": 10, "null": 10, "total": 200,
        })
        self.assertEqual(row["candidates"][1]["validity"], "Anulados sub judice")

    def test_precount_preserves_zero_and_total_electorate(self):
        raw = raw_municipality()
        raw.update(dt="", ht="")
        raw["s"].update(st="0", snt="2")
        for key in raw["e"]:
            if key != "te":
                raw["e"][key] = "0"
        raw["v"] = dict.fromkeys(raw["v"], "0")
        for party in raw["carg"][0]["agr"][0]["par"]:
            party["cand"][0]["vap"] = "0"
        row = row_for(parse_result(raw, "ac01120", "6258"))
        self.assertTrue(row["available"])
        self.assertEqual(row["totals"]["electorate"], 10208)
        self.assertEqual(row["totals"]["electorate_totalized"], 0)
        self.assertEqual(row["totals"]["abstention"], 0)
        self.assertEqual(row["totals"]["computed"], 0)

    def test_legacy_optional_fields_remain_unknown_without_derivation(self):
        raw = fixture("ac01120")
        raw.update(ele="6258", t="2")
        result = parse_result(raw, "ac01120", "6258")
        row = row_for(result)
        for key in ("electorate_totalized", "electorate_installed", "abstention",
                    "computed", "annulled", "sub_judice", "total"):
            self.assertIsNone(row["totals"][key])
        self.assertEqual(row["totals"]["valid"], 180)
        legacy = copy.deepcopy(result)
        legacy.pop("candidates")
        self.assertNotIn("validity", row_for(legacy)["candidates"][0])

    def test_missing_unit_has_unknown_totals(self):
        row = row_for(None)
        self.assertFalse(row["available"])
        self.assertEqual(row["candidates"], [])
        self.assertTrue(all(value is None for value in row["totals"].values()))

    def test_frozen_official_acrelandia_precount_transports_complete_totals(self):
        path = Path(__file__).parent / "fixtures" / "tse-6258-precount.json"
        fixtures = json.loads(path.read_text())
        national = parse_result(fixtures["national"]["raw"], "br", "6258")
        municipal = parse_result(fixtures["municipality"]["raw"], "ac01120", "6258")
        self.assertEqual(national["electorate"], 158745502)
        self.assertEqual(national["valid_votes"], 0)
        self.assertEqual(national["computed_votes"], 0)
        self.assertEqual(national["source_url"], fixtures["national"]["url"])
        row = row_for(municipal)
        self.assertEqual(row["sections"], {"counted": 0, "total": 45})
        self.assertEqual(row["totals"]["electorate"], 10208)
        self.assertTrue(all(value == 0 for key, value in row["totals"].items()
                            if key != "electorate"))
        self.assertEqual(row["candidates"], [
            {"id": "22", "votes": 0, "validity": ""},
            {"id": "13", "votes": 0, "validity": ""},
        ])

    def test_negative_or_malformed_optional_counts_rejected(self):
        for key, value in (("a", "-1"), ("est", True), ("esi", "1.5")):
            raw = raw_municipality()
            raw["e"][key] = value
            with self.subTest(field=key), self.assertRaises(ValueError):
                parse_result(raw, "ac01120", "6258")


if __name__ == "__main__":
    unittest.main()
