import io
import json
import unittest
from unittest.mock import Mock
from urllib.error import HTTPError

from apurar_collector.core.tse import (
    RateLimiter,
    TSEClient,
    config_url,
    election_round,
    parse_catalog,
    parse_result,
    result_url,
    tracking_url,
    validate_url,
)


def fixture(scope="br", final=False):
    return {
        "ele": "6257",
        "t": "1",
        "f": "o",
        "dv": "s",
        "tpabr": "br" if scope == "br" else ("uf" if scope == "zz" else "mu"),
        "cdabr": scope if scope in ("br", "zz") else scope[2:],
        "idg": "100",
        "dg": "04/10/2026",
        "hg": "18:00:00",
        "dt": "04/10/2026",
        "ht": "17:59:55",
        "and": "f" if final else "p",
        "s": {"ts": "2", "st": "2" if final else "1", "snt": "0" if final else "1"},
        "e": {"te": "500", "c": "200"},
        "v": {"vv": "180", "vb": "10", "tvn": "10"},
        "carg": [
            {
                "cd": "1",
                "agr": [
                    {
                        "par": [
                            {
                                "sg": "PT",
                                "cand": [
                                    {
                                        "n": "13",
                                        "nm": "LULA",
                                        "nmu": "LULA",
                                        "st": "",
                                        "vap": "80",
                                    }
                                ],
                            },
                            {
                                "sg": "PL",
                                "cand": [
                                    {"n": "22", "nm": "FLAVIO", "st": "", "vap": "100"}
                                ],
                            },
                        ]
                    }
                ],
            }
        ],
    }


class Response(io.BytesIO):
    def __init__(self, data, headers=None):
        super().__init__(json.dumps(data).encode())
        self.headers = headers or {}


class Clock:
    def __init__(self):
        self.now = 1000.0

    def __call__(self):
        return self.now

    def sleep(self, seconds):
        self.now += seconds


class TSETests(unittest.TestCase):
    def test_real_schema_final_and_municipal(self):
        value = parse_result(fixture(final=True), "br")
        self.assertTrue(value["official_final"])
        self.assertEqual(value["votes"], {"13": 80, "22": 100})
        self.assertEqual(
            parse_result(fixture("sp00001"), "sp00001")["scope"], "sp00001"
        )
        self.assertEqual(parse_result(fixture("zz"), "zz")["scope"], "zz")

    def test_rejects_different_election_and_simulated(self):
        for field, value in [("ele", "6258"), ("t", "2"), ("f", "s")]:
            raw = fixture()
            raw[field] = value
            with self.assertRaises(ValueError):
                parse_result(raw)

    def test_rejects_mismatched_scope_and_totals(self):
        with self.assertRaises(ValueError):
            parse_result(fixture("sp00001"), "sp00002")
        raw = fixture()
        raw["s"]["snt"] = "0"
        with self.assertRaises(ValueError):
            parse_result(raw)
        raw = fixture()
        raw["v"]["vv"] = "181"
        self.assertEqual(parse_result(raw)["valid_votes"], 181)

    def test_flag_without_zero_missing_is_not_final(self):
        raw = fixture()
        raw["and"] = "f"
        self.assertFalse(parse_result(raw)["official_final"])

    def test_url_allowlist_and_padding(self):
        self.assertIn("sp00001-c0001", result_url("sp00001"))
        for url in [
            "http://resultados.tse.jus.br/oficial/ele2026/6257/a",
            "https://evil.test/oficial/ele2026/6257/a",
            "https://resultados.tse.jus.br/oficial/ele2026/6259/a",
        ]:
            with self.assertRaises(ValueError):
                validate_url(url)
        with self.assertRaises(ValueError):
            result_url("sp1")

    def test_second_round_urls_and_explicit_parser_contract(self):
        raw = fixture()
        raw.update(ele="6258", t="2")
        value = parse_result(raw, "br", election="6258")
        self.assertEqual((value["election"], value["round"]), ("6258", 2))
        self.assertEqual(value["source_url"], result_url(election="6258"))
        self.assertIn("/6258/", config_url("6258"))
        self.assertIn("e006258-ab.json", tracking_url("sp", "6258"))
        validate_url(value["source_url"])
        with self.assertRaises(ValueError):
            parse_result(raw, election="6257")
        with self.assertRaises(ValueError):
            parse_result(fixture(), election="6258")
        with self.assertRaises(ValueError):
            election_round("6259")
        catalog = {"f": "o", "abr": [{"cd": "sp", "mu": [{"cd": "1", "nm": "Cidade"}]}]}
        self.assertTrue(
            all("/6258/" in x["source_url"] for x in parse_catalog(catalog, "6258"))
        )

    def test_precount_real_second_round_blank_totalization_time(self):
        # EA20 6258 observado em 24/10: gerado 15/10, dt/ht vazios e zero votos.
        raw = fixture()
        raw.update(ele="6258", t="2", dt="", ht="", and_="n")
        raw["and"] = "n"
        raw["s"].update(st="0", snt="2")
        raw["e"]["c"] = "0"
        raw["v"] = {"vv": "0", "vb": "0", "tvn": "0"}
        for alliance in raw["carg"][0]["agr"]:
            for party in alliance["par"]:
                for candidate in party["cand"]:
                    candidate["vap"] = "0"
        value = parse_result(raw, election="6258")
        self.assertIsNone(value["totalized_at"])
        self.assertFalse(value["official_final"])
        self.assertEqual(value["valid_votes"], 0)
        raw["s"].update(st="1", snt="1")
        with self.assertRaises(ValueError):
            parse_result(raw, election="6258")

    def test_empty_structure_cannot_signal_official_completion(self):
        raw = fixture(final=True)
        raw["s"] = {"ts": "0", "st": "0", "snt": "0"}
        self.assertFalse(parse_result(raw)["official_final"])

    def test_rejects_totalization_after_official_generation(self):
        for scope in ("br", "sp00001", "zz"):
            with self.subTest(scope=scope):
                raw = fixture(scope)
                raw["ht"] = "18:00:01"
                with self.assertRaisesRegex(ValueError, "Totalização posterior"):
                    parse_result(raw, scope)
                raw["ht"] = raw["hg"]
                result = parse_result(raw, scope)
                self.assertEqual(result["totalized_at"], result["generated_at"])

    def test_catalog_exterior_aggregate(self):
        data = {
            "f": "o",
            "abr": [
                {"cd": "sp", "mu": [{"cd": "1", "nm": "Cidade"}]},
                {"cd": "zz", "mu": [{"cd": "1", "nm": "Exterior cidade"}]},
            ],
        }
        self.assertEqual([x["scope"] for x in parse_catalog(data)], ["sp00001", "zz"])

    def test_older_cdn_response_never_replaces_cache(self):
        new = fixture()
        new["hg"] = "18:01:00"
        clock = Clock()
        opener = Mock(
            side_effect=[
                Response(new, {"ETag": "new"}),
                Response(fixture(), {"ETag": "old"}),
            ]
        )
        client = TSEClient(
            opener=opener, limiter=RateLimiter(clock=clock, sleep=clock.sleep)
        )
        client.fetch(result_url())
        self.assertEqual(client.fetch(result_url()).status, "error")
        self.assertEqual(client.cache[result_url()][1], "new")

    def test_conditional_304_preserves_cache(self):
        url = result_url()
        clock = Clock()
        opener = Mock(
            side_effect=[
                Response(fixture(), {"ETag": "abc"}),
                HTTPError(url, 304, "Not Modified", {}, None),
            ]
        )
        client = TSEClient(
            opener=opener, limiter=RateLimiter(clock=clock, sleep=clock.sleep)
        )
        self.assertTrue(client.fetch(url).changed)
        response = client.fetch(url)
        self.assertFalse(response.changed)
        self.assertEqual(response.data["idg"], "100")
        self.assertEqual(opener.call_args.args[0].get_header("If-none-match"), "abc")
        self.assertGreaterEqual(clock.now, 1000 + 1 / 70)

    def test_last_modified_fallback(self):
        opener = Mock(
            side_effect=[
                Response(fixture(), {"Last-Modified": "today"}),
                Response(fixture()),
            ]
        )
        clock = Clock()
        client = TSEClient(
            opener=opener, limiter=RateLimiter(clock=clock, sleep=clock.sleep)
        )
        client.fetch(result_url())
        client.fetch(result_url())
        self.assertEqual(
            opener.call_args.args[0].get_header("If-modified-since"), "today"
        )

    def test_backoff_does_not_retry_or_reset_lockout(self):
        clock = Clock()
        url = result_url()
        opener = Mock(
            side_effect=HTTPError(url, 429, "Limited", {"Retry-After": "2"}, None)
        )
        client = TSEClient(
            opener=opener,
            clock=clock,
            limiter=RateLimiter(clock=clock, sleep=clock.sleep),
        )
        self.assertEqual(client.fetch(url).status, "backoff")
        clock.now += 10
        self.assertEqual(client.fetch(tracking_url("sp")).status, "backoff")
        self.assertEqual(opener.call_count, 1)
        self.assertEqual(client.limiter.blocked_until, 1600)

    def test_404_cached_for_ten_minutes(self):
        clock = Clock()
        url = result_url()
        opener = Mock(side_effect=HTTPError(url, 404, "Missing", {}, None))
        client = TSEClient(
            opener=opener,
            clock=clock,
            limiter=RateLimiter(clock=clock, sleep=clock.sleep),
        )
        self.assertEqual(client.fetch(url).status, "awaiting")
        self.assertEqual(client.fetch(url).status, "awaiting")
        self.assertEqual(opener.call_count, 1)

    def test_limiter_caps_even_if_misconfigured(self):
        clock = Clock()
        limiter = RateLimiter(1000, clock, clock.sleep)
        limiter.acquire()
        limiter.acquire()
        self.assertGreaterEqual(clock.now - 1000, 1 / 70 - 1e-8)


if __name__ == "__main__":
    unittest.main()
