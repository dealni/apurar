"""Metadados malformados não tornam o cache HTTP irrecuperável."""

import unittest
from unittest.mock import Mock
from urllib.error import HTTPError

from apurar_collector.core.tse import TSEClient, config_url, result_url
from tests.test_tse import Response, fixture


class TSECacheValidationTests(unittest.TestCase):
    def client(self, responses):
        opener = Mock(side_effect=responses)
        limiter = Mock()
        limiter.acquire.return_value = 0
        return TSEClient(opener=opener, limiter=limiter), opener

    def test_bad_generation_never_enters_cache_and_next_response_recovers(self):
        for change in ({"dg": "inválida"}, {"hg": ""}, {"hg": 180000}, {"dg": [2026]}):
            with self.subTest(change=change):
                malformed = {**fixture(), **change}
                client, opener = self.client([
                    Response(malformed, {"ETag": "invalid"}), Response(fixture()),
                ])
                self.assertEqual(client.fetch(result_url()).status, "error")
                self.assertNotIn(result_url(), client.cache)
                recovered = client.fetch(result_url())
                self.assertEqual(recovered.status, "ok")
                self.assertEqual(recovered.data, fixture())
                self.assertIsNone(opener.call_args.args[0].get_header("If-none-match"))

    def test_bad_generation_preserves_previous_cache(self):
        malformed = {**fixture(), "dg": "inválida"}
        client, _ = self.client([
            Response(fixture(), {"ETag": "valid"}),
            Response(malformed, {"ETag": "invalid"}), Response(fixture()),
        ])
        self.assertEqual(client.fetch(result_url()).status, "ok")
        self.assertEqual(client.fetch(result_url()).status, "error")
        self.assertEqual(client.cache[result_url()][1], "valid")
        self.assertEqual(client.fetch(result_url()).status, "ok")

    def test_catalog_without_generation_metadata_remains_supported(self):
        catalog = {"f": "o", "abr": []}
        client, _ = self.client([Response(catalog)])
        self.assertEqual(client.fetch(config_url()).data, catalog)

    def test_missing_or_empty_result_generation_preserves_revalidatable_cache(self):
        for generation in ({}, {"dg": "", "hg": ""}, {"dg": None, "hg": None}):
            with self.subTest(generation=generation):
                malformed = {key: value for key, value in fixture().items()
                             if key not in ("dg", "hg")}
                malformed.update(generation)
                client, opener = self.client([
                    Response(fixture(), {"ETag": "valid"}),
                    Response(malformed, {"ETag": "invalid"}),
                    HTTPError(result_url(), 304, "Not Modified", {}, None),
                ])
                self.assertEqual(client.fetch(result_url()).status, "ok")
                self.assertEqual(client.fetch(result_url()).status, "error")
                self.assertEqual(client.cache[result_url()][1], "valid")
                recovered = client.fetch(result_url())
                self.assertEqual(recovered.data, fixture())
                self.assertFalse(recovered.changed)
                self.assertEqual(opener.call_args.args[0].get_header("If-none-match"), "valid")

    def test_present_but_empty_catalog_generation_does_not_enter_cache(self):
        client, _ = self.client([Response({"f": "o", "abr": [], "dg": "", "hg": ""})])
        self.assertEqual(client.fetch(config_url()).status, "error")
        self.assertNotIn(config_url(), client.cache)


if __name__ == "__main__":
    unittest.main()
