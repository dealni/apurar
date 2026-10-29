import unittest
from unittest.mock import Mock

from apurar_collector.core.collector import LiveCollector
from apurar_collector.core.tse import FetchResult, parse_result, result_url
from tests.test_tse import fixture
from tests.test_partial_structure_collection import NOW


class CollectorTests(unittest.TestCase):
    def final_collector(self, election="6257", clock=None):
        client = Mock()

        def fetch(url):
            raw = fixture(
                "br" if url == result_url(election=election) else "sp00001",
                final=True,
            )
            raw.update(ele=election, t="2" if election == "6258" else "1")
            return FetchResult("ok", raw)

        client.fetch.side_effect = fetch
        collector = LiveCollector(
            client, election=election, **({"clock": clock} if clock else {})
        )
        collector.catalog = {"sp00001": {"scope": "sp00001", "uf": "SP"}}
        collector.last_catalog = collector.clock()
        collector.structural_states = {"sp"}
        collector._tracking = Mock()
        return collector

    def test_official_final_continues_municipal_fanout(self):
        collector = self.final_collector()
        collector.on_national = Mock()
        old = dict(
            parse_result(fixture("sp00001"), "sp00001"),
            idg="99",
            generated_at="2026-10-04T17:59:00-03:00",
        )
        collector.units["sp00001"] = old
        value = collector.cycle()
        self.assertEqual(value["status"], "finished")
        self.assertEqual(value["next_poll_seconds"], 300)
        self.assertTrue(value["progress"]["coherent"])
        self.assertEqual(collector.client.fetch.call_count, 2)
        self.assertEqual(value["units"][0]["result"]["sections_counted"], 2)
        collector.on_national.assert_called_once()
        # Sem nova revisão nem divergência, não repete uma varredura nacional.
        collector.client.fetch.reset_mock()
        collector.cycle()
        self.assertEqual(collector.client.fetch.call_count, 1)

    def test_second_round_fetch_and_wrong_round_rejection(self):
        collector = self.final_collector("6258")
        result = collector.cycle()
        self.assertEqual(result["status"], "finished")
        self.assertEqual(result["national"]["round"], 2)
        self.assertEqual(
            collector.client.fetch.call_args_list[0].args[0], result_url(election="6258")
        )
        collector.client.fetch.side_effect = None
        collector.client.fetch.return_value = FetchResult("ok", fixture(final=True))
        rejected = collector.cycle()
        self.assertEqual(rejected["status"], "error")
        self.assertEqual(rejected["national"]["election"], "6258")

    def test_restart_after_final_reconciles_restored_partial_units(self):
        collector = self.final_collector()
        collector.national = parse_result(fixture(final=True))
        collector.units["sp00001"] = dict(
            parse_result(fixture("sp00001"), "sp00001"),
            idg="99",
            generated_at="2026-10-04T17:59:00-03:00",
        )
        self.assertFalse(collector.pending)
        result = collector.cycle()
        self.assertTrue(result["progress"]["coherent"])
        self.assertEqual(result["status"], "finished")
        self.assertEqual(collector.client.fetch.call_count, 2)

    def test_final_incoherence_retries_full_sweep_only_after_cooldown(self):
        clock = Mock(return_value=NOW)
        collector = self.final_collector(clock=clock)
        collector.client.fetch.side_effect = lambda url: FetchResult(
            "ok",
            fixture(
                "br" if url == result_url() else "sp00001", final=url == result_url()
            ),
        )
        result = collector.cycle()
        self.assertEqual(result["status"], "live")
        self.assertFalse(result["progress"]["coherent"])
        collector.client.fetch.reset_mock()
        clock.return_value = NOW + 299
        collector.cycle()
        self.assertEqual(collector.client.fetch.call_count, 1)
        clock.return_value = NOW + 300
        collector.cycle()
        self.assertEqual(collector.client.fetch.call_count, 3)

    def test_new_national_final_revision_refreshes_municipalities(self):
        collector = self.final_collector()
        collector.cycle()
        fetch = collector.client.fetch.side_effect

        def corrected(url):
            value = fetch(url)
            value.data.update(idg="101", hg="18:01:00", ht="18:00:55")
            return value

        collector.client.fetch.side_effect = corrected
        collector.client.fetch.reset_mock()
        result = collector.cycle()
        self.assertEqual(result["status"], "finished")
        self.assertEqual(collector.units["sp00001"]["idg"], "101")
        self.assertEqual(collector.client.fetch.call_count, 2)

    def test_final_sweep_drains_pending_even_when_totals_already_match(self):
        collector = self.final_collector()
        collector.batch_size = 1
        collector.catalog["sp00002"] = {"scope": "sp00002", "uf": "SP"}
        collector.units["sp00002"] = dict(
            parse_result(fixture("sp00002", final=True), "sp00002"),
            sections_counted=0,
            sections_total=0,
            votes={"13": 0, "22": 0},
        )
        result = collector.cycle()
        self.assertTrue(result["progress"]["coherent"])
        self.assertEqual(result["status"], "collecting")
        self.assertEqual(result["next_poll_seconds"], 2)
        self.assertEqual(list(collector.pending), ["sp00002"])

    def test_final_confirmation_rejects_ambiguous_or_undisclosed_national(self):
        collector = self.final_collector()
        collector.cycle()
        self.assertTrue(collector.national_confirmed)
        for changes in ({"idg": "101"}, {"dv": "n"}, {"ele": "6258"}):
            with self.subTest(changes=changes):
                raw = fixture(final=True)
                raw.update(changes)
                collector.client.fetch.side_effect = None
                collector.client.fetch.return_value = FetchResult("ok", raw)
                collector.cycle()
                self.assertFalse(collector.national_confirmed)

    def test_second_round_tracking_rejects_first_round(self):
        collector = LiveCollector(Mock(), election="6258")
        collector.catalog = {"sp00001": {"scope": "sp00001", "uf": "SP"}}
        raw = {
            "ele": "6257",
            "t": "1",
            "f": "o",
            "abr": [
                {
                    "tpabr": "mu",
                    "cdabr": "00001",
                    "s": {"ts": "20", "st": "0"},
                    "e": {"te": "500"},
                }
            ],
        }
        collector._apply_tracking("sp", FetchResult("ok", raw))
        self.assertFalse(collector.structural_states)
        raw.update(ele="6258", t="2")
        collector._apply_tracking("sp", FetchResult("ok", raw))
        self.assertEqual(collector.structural_states, {"sp"})
        self.assertEqual(collector.catalog["sp00001"]["sections_total"], 20)
        self.assertFalse(collector.units)

    def test_unpublished_second_round_never_reuses_first_round(self):
        raw = fixture()
        raw.update(ele="6258", t="2", dv="n")
        client = Mock()
        client.fetch.return_value = FetchResult("ok", raw)
        value = LiveCollector(client, election="6258").cycle()
        self.assertEqual(value["status"], "awaiting")
        self.assertIsNone(value["national"])
        self.assertFalse(value["units"])

    def test_failure_preserves_last_official_snapshot(self):
        client = Mock()
        collector = LiveCollector(client)
        client.fetch.return_value = FetchResult("ok", fixture(final=True))
        before = collector.cycle()["national"]
        client.fetch.return_value = FetchResult("error", error="offline")
        value = collector.cycle()
        self.assertEqual(value["status"], "error")
        self.assertEqual(value["national"], before)

    def test_idg_is_not_numerically_sorted(self):
        collector = LiveCollector(Mock())
        old = parse_result(fixture())
        new = dict(old, idg="1", generated_at="2026-10-04T18:01:00-03:00")
        self.assertTrue(collector._accept(old, new))
        self.assertFalse(collector._accept(new, old))

    def test_newer_correction_can_reduce_votes(self):
        collector = LiveCollector(Mock())
        old = parse_result(fixture())
        new = dict(
            old,
            idg="1",
            generated_at="2026-10-04T18:01:00-03:00",
            votes={"13": 70, "22": 100},
        )
        self.assertTrue(collector._accept(old, new))
        self.assertEqual(len(collector.revisions), 1)

    def test_ambiguous_version_is_never_merged(self):
        collector = LiveCollector(Mock())
        old = parse_result(fixture())
        self.assertFalse(collector._accept(old, dict(old, idg="101")))
        self.assertFalse(collector._accept(old, dict(old, votes={"13": 0})))

    def test_awaiting_does_not_generate_fake_results(self):
        client = Mock()
        client.fetch.return_value = FetchResult("awaiting", retry_at=1200)
        value = LiveCollector(client, clock=lambda: 1000).cycle()
        self.assertIsNone(value["national"])
        self.assertEqual(value["units"], [])
        self.assertEqual(value["next_poll_seconds"], 200)

    def test_full_coherence_requires_structural_sections_too(self):
        collector = LiveCollector(Mock())
        national = parse_result(fixture())
        collector.national = national
        collector.catalog = {"sp00001": {"scope": "sp00001", "uf": "SP"}}
        collector.units = {"sp00001": dict(national, scope="sp00001", sections_total=3)}
        self.assertFalse(collector._payload("live")["progress"]["coherent"])
        collector.units["sp00001"]["sections_total"] = 2
        self.assertTrue(collector._payload("live")["progress"]["coherent"])

    def test_bootstrap_loads_every_state_before_municipal_batch(self):
        states = "ac al ap am ba ce df es go ma mt ms mg pa pb pr pe pi rj rn rs ro rr sc sp se to".split()
        client = Mock()

        def fetch(url):
            uf = url.rsplit("/", 1)[1][:2]
            return FetchResult(
                "ok",
                {
                    "ele": "6257",
                    "t": "1",
                    "f": "o",
                    "abr": [
                        {
                            "tpabr": "mun",
                            "cdabr": "00001",
                            "dt": "04/10/2026",
                            "ht": "18:00:00",
                            "s": {"ts": "2", "st": "1"},
                            "e": {"te": str(100 + states.index(uf))},
                        }
                    ],
                },
            )

        client.fetch.side_effect = fetch
        collector = LiveCollector(client)
        collector.catalog = {
            uf + "00001": {"scope": uf + "00001", "uf": uf.upper()} for uf in states
        }
        collector.catalog["zz"] = {"scope": "zz", "uf": "ZZ"}
        for scope in collector.catalog:
            collector._queue(scope)
        collector._tracking()
        self.assertEqual(collector.structural_states, set(states))
        self.assertEqual(client.fetch.call_count, 27)
        self.assertEqual(collector.catalog["sp00001"]["sections_total"], 2)
        self.assertEqual(collector.pending[0], "zz")
        self.assertEqual(collector.pending[1], "to00001")
        self.assertEqual(
            list(collector.pending)[1:], [uf + "00001" for uf in reversed(states)]
        )

    def test_bootstrap_prioritizes_missing_structure_before_larger_known_cities(self):
        client = Mock()
        structures = [
            ("00001", 0, 10),
            ("00002", 200, 10000),
            ("00003", 0, 20),
            ("00004", 100, 5000),
        ]
        client.fetch.return_value = FetchResult(
            "ok",
            {
                "ele": "6258",
                "t": "2",
                "f": "o",
                "abr": [
                    {
                        "tpabr": "mu",
                        "cdabr": code,
                        "s": {"ts": str(sections), "st": "0"},
                        "e": {"te": str(electorate)},
                    }
                    for code, sections, electorate in structures
                ],
            },
        )
        collector = LiveCollector(client, election="6258")
        collector.catalog = {
            "sp" + code: {"scope": "sp" + code, "uf": "SP"} for code, _, _ in structures
        }
        collector.catalog["zz"] = {"scope": "zz", "uf": "ZZ"}
        for scope in collector.catalog:
            collector._queue(scope)
        collector._tracking()
        self.assertEqual(
            list(collector.pending), ["zz", "sp00003", "sp00001", "sp00002", "sp00004"]
        )
        self.assertFalse(collector.units)
        # Cache válido de EA20 já resolve a estrutura, mesmo com EA15 ainda zerado.
        collector.units["sp00003"] = {"sections_total": 3}
        collector.structural_states.clear()
        collector._tracking()
        self.assertEqual(
            list(collector.pending), ["zz", "sp00001", "sp00002", "sp00004", "sp00003"]
        )

    def test_bootstrap_stops_batches_when_source_blocks(self):
        client = Mock()
        client.fetch.return_value = FetchResult(
            "backoff", retry_at=999999, error="HTTP 429"
        )
        collector = LiveCollector(client)
        states = "ac al ap am ba ce df es go ma mt ms mg pa pb pr pe pi rj rn rs ro rr sc sp se to".split()
        collector.catalog = {
            uf + "00001": {"scope": uf + "00001", "uf": uf.upper()} for uf in states
        }
        collector._tracking()
        self.assertEqual(client.fetch.call_count, 8)
        self.assertEqual(collector.collection_backoff, 999999)
        self.assertFalse(collector.structural_states)
        self.assertTrue(collector.errors)

    def test_municipal_block_keeps_whole_pending_queue(self):
        client = Mock()
        client.fetch.side_effect = lambda url: (
            FetchResult("ok", fixture())
            if url == result_url()
            else FetchResult("backoff", error="HTTP 429")
        )
        collector = LiveCollector(client, batch_size=128)
        collector.catalog = {
            "sp" + str(i).zfill(5): {"scope": "sp" + str(i).zfill(5), "uf": "SP"}
            for i in range(40)
        }
        collector.last_catalog = collector.clock()
        collector.structural_states = {"sp"}
        collector._tracking = Mock()
        for scope in collector.catalog:
            collector._queue(scope)
        value = collector.cycle()
        self.assertEqual(value["status"], "backoff")
        self.assertEqual(len(collector.pending), 40)
        self.assertEqual(client.fetch.call_count, 9)

    def test_undisclosable_votes_are_never_published(self):
        raw = fixture()
        raw["dv"] = "n"
        client = Mock()
        client.fetch.return_value = FetchResult("ok", raw)
        callback = Mock()
        collector = LiveCollector(client, on_national=callback)
        value = collector.cycle()
        self.assertEqual(value["status"], "awaiting")
        self.assertIsNone(value["national"])
        callback.assert_not_called()

    def test_structural_metadata_does_not_fabricate_votes(self):
        collector = LiveCollector(Mock())
        collector.catalog = {
            "sp00001": {"scope": "sp00001", "uf": "SP", "sections_total": 20}
        }
        self.assertIsNone(collector.snapshot_units()[0]["result"])
        self.assertFalse(collector._payload("collecting")["progress"]["coherent"])


if __name__ == "__main__":
    unittest.main()
