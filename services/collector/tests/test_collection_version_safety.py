"""Versões suplementares ambíguas e pausas nacionais preservam estado oficial."""
import tempfile
import unittest

from apurar_collector.core.tse import FetchResult
from apurar_collector.scheduling import next_delay
from apurar_collector.supplemental import SupplementalCollector
from apurar_collector.supplemental_tse import parse_supplemental
from tests.test_supplemental import RESULT_NOW, city_target, raw_result


class CollectionVersionSafetyTests(unittest.TestCase):
    def test_disabled_supplement_preserves_primary_cadence(self):
        for status, delay in (("live", 15), ("finished", 300), ("backoff", 600)):
            with self.subTest(status=status):
                self.assertEqual(next_delay({
                    "status": status, "next_poll_seconds": delay, "supplemental": None,
                }), delay)

    def test_pending_supplement_does_not_shorten_national_404_wait(self):
        self.assertEqual(next_delay({
            "status": "awaiting", "next_poll_seconds": 600,
            "supplemental": {"status": "ok", "pending": 100},
        }), 600)

    def test_supplemental_equal_generation_preserves_votes_and_recovers(self):
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
            collector = SupplementalCollector(client, directory, clock=lambda: RESULT_NOW)

            client.data = raw_result()
            client.data["carg"][0]["agr"][0]["par"][0]["cand"][0]["vap"] = "70"
            self.assertEqual(collector._fetch(key)[0], "error")
            self.assertEqual(collector.items[key]["candidates"][0]["votes"], 80)
            self.assertTrue(collector.items[key]["stale"])

            # Uma resposta idêntica confirma a observação anterior e limpa a falha.
            client.data = raw_result()
            self.assertEqual(collector._fetch(key)[0], "ok")
            self.assertFalse(collector.items[key]["stale"])
            self.assertNotIn("fetch_status", collector.items[key])

            # Correções com nova geração oficial podem reduzir a votação.
            client.data["hg"] = "18:01:00"
            client.data["carg"][0]["agr"][0]["par"][0]["cand"][0]["vap"] = "70"
            self.assertEqual(collector._fetch(key)[0], "ok")
            self.assertEqual(collector.items[key]["candidates"][0]["votes"], 70)

    def test_withheld_same_generation_recovers_after_network_failure(self):
        class Client:
            response = FetchResult("error")

            def fetch(self, url):
                return self.response

        with tempfile.TemporaryDirectory() as directory:
            client = Client()
            collector = SupplementalCollector(client, directory, clock=lambda: RESULT_NOW)
            target = city_target()
            key = "6258:" + target["id"]
            raw = raw_result()
            raw["dv"] = "n"
            collector.targets[key] = target
            collector.items[key] = parse_supplemental(raw, target)
            self.assertEqual(collector._fetch(key)[0], "error")
            self.assertEqual(collector.items[key]["status"], "error")
            client.response = FetchResult("ok", raw)
            self.assertEqual(collector._fetch(key)[0], "ok")
            self.assertEqual(collector.items[key]["status"], "withheld")
            self.assertFalse(collector.items[key]["stale"])
