"""Regressões da extração headless, sem rede nem segredo."""

import copy
import json
import tempfile
import unittest
from pathlib import Path
from unittest.mock import Mock

from apurar_collector.demo import fixture
from apurar_collector.model import forecast
from apurar_collector.publisher import LocalBucket, Publisher, R2Bucket
from apurar_collector.runtime import LiveSession, Runtime, exclusive
from apurar_collector.snapshot import build, municipalities

STAMP = "2026-10-25T18:00:00-03:00"


def prepared():
    collection, prior = fixture(STAMP)
    snapshot = build(
        collection, prior, mode="demo", collected_at=STAMP, published_at=STAMP
    )
    cities = municipalities(collection) | {"snapshot_id": snapshot["snapshot_id"]}
    history = {
        "schema_version": 1,
        "election": "6258",
        "snapshot_id": snapshot["snapshot_id"],
        "points": [],
    }
    return collection, prior, snapshot, cities, history


class ModelTests(unittest.TestCase):
    def test_projection_preserves_observed_votes_and_sums_shares(self):
        collection, prior, snapshot, _, _ = prepared()
        self.assertTrue(snapshot["projection"]["available"])
        self.assertAlmostEqual(sum(snapshot["projection"]["shares"].values()), 100)
        for cid, votes in collection["national"]["votes"].items():
            self.assertGreaterEqual(snapshot["projection"]["votes"][cid], votes)
        self.assertFalse(snapshot["source"]["signature_verified"])

    def test_missing_registry_suspends_only_projection(self):
        collection, prior = fixture(STAMP)
        collection["units"].pop()
        result = build(
            collection, prior, mode="demo", collected_at=STAMP, published_at=STAMP
        )
        self.assertFalse(result["projection"]["available"])
        self.assertEqual(result["candidates"][0]["votes"], 320)

    def test_same_count_but_wrong_municipality_rejects_registry(self):
        collection, prior = fixture(STAMP)
        collection["units"][0]["scope"] = "sp99999"
        result, _, _, notes = forecast(collection, prior)
        self.assertIsNone(result)
        self.assertIn("cadastro", notes[0])

    def test_municipal_candidate_divergence_suspends(self):
        collection, prior = fixture(STAMP)
        row = collection["units"][0]["result"]
        row["votes"] = {"13": 0, "22": 400}
        self.assertIsNone(forecast(collection, prior)[0])

    def test_section_divergence_suspends(self):
        collection, prior = fixture(STAMP)
        collection["national"]["sections_counted"] = 10
        self.assertIsNone(forecast(collection, prior)[0])

    def test_final_uses_official_without_municipal_dependency(self):
        collection, prior = fixture(STAMP)
        collection["national"]["official_final"] = True
        collection["units"] = []
        predicted, model, _, _ = forecast(collection, prior)
        self.assertEqual(predicted, collection["national"]["votes"])
        self.assertEqual(model, "official_final")

    def test_no_vote_estimate_is_marked_pre_count(self):
        collection, prior = fixture(STAMP)
        for row in [
            collection["national"],
            *[u["result"] for u in collection["units"]],
        ]:
            row.update(sections_counted=0, votes={"13": 0, "22": 0}, valid_votes=0)
        result = build(
            collection, prior, mode="demo", collected_at=STAMP, published_at=STAMP
        )
        self.assertTrue(result["projection"]["pre_count"])
        self.assertTrue(result["projection"]["available"])
        self.assertEqual(sum(c["votes"] for c in result["candidates"]), 0)

    def test_undisclosed_or_wrong_election_not_published(self):
        collection, prior = fixture(STAMP)
        for change in (
            {"divulgation_allowed": False},
            {"election": "6257"},
            {"round": 1},
        ):
            altered = copy.deepcopy(collection)
            altered["national"].update(change)
            with self.assertRaises(ValueError):
                build(
                    altered, prior, mode="demo", collected_at=STAMP, published_at=STAMP
                )

    def test_future_or_impossible_order_not_published(self):
        collection, prior = fixture(STAMP)
        with self.assertRaises(ValueError):
            build(
                collection,
                prior,
                mode="demo",
                collected_at="2026-10-25T17:00:00-03:00",
                published_at=STAMP,
            )

    def test_unavailable_city_keeps_unknown_counts_and_time(self):
        collection, _ = fixture(STAMP)
        collection["units"][0]["result"] = None
        city = municipalities(collection)["items"][0]
        self.assertFalse(city["available"])
        self.assertIsNone(city["sections"]["counted"])
        self.assertIsNone(city["as_of"])
        self.assertEqual(city["candidates"], [])


class PublisherTests(unittest.TestCase):
    def test_publication_reads_back_all_objects_before_latest(self):
        _, _, snapshot, cities, history = prepared()
        bucket = Mock()
        objects, operations = {}, []

        def get(key):
            operations.append(("get", key))
            return objects.get(key)

        def put(key, body, policy):
            operations.append(("put", key))
            objects[key] = body

        bucket.get.side_effect, bucket.put.side_effect = get, put
        pointer = Publisher(bucket).publish(snapshot, cities, history)
        latest_index = operations.index(("put", "demo/6258/latest.json"))
        for kind, key in [
            ("snapshot", pointer["key"]),
            ("municipalities", pointer["municipalities"]["key"]),
            ("history", pointer["history"]["key"]),
        ]:
            self.assertLess(operations.index(("put", key)), latest_index, kind)
            reads = [i for i, op in enumerate(operations) if op == ("get", key)]
            self.assertGreater(len(reads), 1)
            self.assertLess(reads[-1], latest_index)

    def test_partial_write_does_not_advance_latest(self):
        _, _, snapshot, cities, history = prepared()
        with tempfile.TemporaryDirectory() as folder:
            bucket = LocalBucket(folder)
            bucket.put(
                "demo/6258/latest.json",
                b'{"published_at":"2026-10-24T18:00:00-03:00"}',
                "no-store",
            )
            before = bucket.get("demo/6258/latest.json")
            original_put = bucket.put

            def fail(key, body, policy):
                if "/history/" in key:
                    raise OSError("upload interrompido")
                original_put(key, body, policy)

            bucket.put = fail
            with self.assertRaises(OSError):
                Publisher(bucket).publish(snapshot, cities, history)
            self.assertEqual(bucket.get("demo/6258/latest.json"), before)

    def test_remote_rejects_demo_before_any_write(self):
        _, _, snapshot, cities, history = prepared()
        bucket = Mock()
        with self.assertRaises(ValueError):
            Publisher(bucket, remote=True).publish(snapshot, cities, history)
        bucket.put.assert_not_called()
        bucket.get.assert_not_called()

    def test_mixed_generation_rejected(self):
        _, _, snapshot, cities, history = prepared()
        cities["snapshot_id"] = "outro"
        with self.assertRaises(ValueError):
            Publisher(Mock()).publish(snapshot, cities, history)

    def test_readback_corruption_preserves_pointer(self):
        _, _, snapshot, cities, history = prepared()
        bucket = Mock()
        bucket.get.side_effect = [None, None, b"corrompido"]
        with self.assertRaises(ValueError):
            Publisher(bucket).publish(snapshot, cities, history)
        self.assertFalse(
            any(
                call.args[0].endswith("latest.json")
                for call in bucket.put.call_args_list
            )
        )

    def test_rollback_check_compares_instants_not_offsets(self):
        _, _, snapshot, cities, history = prepared()
        with tempfile.TemporaryDirectory() as folder:
            bucket = LocalBucket(folder)
            bucket.put(
                "demo/6258/latest.json",
                b'{"published_at":"2026-10-25T20:30:00Z"}',
                "no-store",
            )
            Publisher(bucket).publish(snapshot, cities, history)  # 18h -03 == 21h UTC
            snapshot["published_at"] = "2026-10-25T20:00:00Z"
            with self.assertRaises(ValueError):
                Publisher(bucket).publish(snapshot, cities, history)

    def test_r2_adapter_does_not_swallow_auth_errors(self):
        client = Mock()
        client.get_object.side_effect = RuntimeError("proibido")
        with self.assertRaises(RuntimeError):
            R2Bucket(client, "bucket").get("live/6258/latest.json")


class RuntimeTests(unittest.TestCase):
    def test_repeated_source_retains_one_history_observation(self):
        collection, prior = fixture("2020-01-01T00:00:00Z")
        with tempfile.TemporaryDirectory() as folder:
            runtime = Runtime(prior, Path(folder) / "state", Path(folder) / "bucket")
            first, _ = runtime.emit(collection, mode="demo")
            second, pointer = runtime.emit(collection, mode="demo")
            self.assertEqual(first["snapshot_id"], second["snapshot_id"])
            history = json.loads(
                (Path(folder) / "bucket" / pointer["history"]["key"]).read_text()
            )
            self.assertEqual(len(history["points"]), 1)
            self.assertEqual(history["snapshot_id"], second["snapshot_id"])

    def test_single_writer_lock_rejects_second_process(self):
        with tempfile.TemporaryDirectory() as folder, exclusive(folder):
            with self.assertRaises(RuntimeError), exclusive(folder):
                pass

    def test_live_session_failure_preserves_official_and_does_not_publish(self):
        client = Mock()
        from apurar_collector.core.tse import FetchResult

        client.fetch.return_value = FetchResult("error", error="offline")
        with tempfile.TemporaryDirectory() as folder:
            session = LiveSession(folder, client)
            try:
                publishable, status = session.cycle()
                self.assertIsNone(publishable)
                self.assertEqual(status["status"], "error")
            finally:
                session.close()


if __name__ == "__main__":
    unittest.main()


class SourceMetadataTests(unittest.TestCase):
    def test_catalog_ibge_is_preserved_to_municipality_envelope(self):
        from apurar_collector.core.tse import parse_catalog

        catalog = parse_catalog(
            {
                "f": "o",
                "abr": [
                    {
                        "cd": "sp",
                        "mu": [{"cd": "00001", "nm": "Exemplo", "cdi": "3550308"}],
                    }
                ],
            },
            "6258",
        )
        collection, _ = fixture(STAMP)
        collection["units"][0].update(catalog[0])
        self.assertEqual(municipalities(collection)["items"][0]["ibge_code"], "3550308")

    def test_official_zero_sections_empty_totalization_times_are_legitimate(self):
        from apurar_collector.core.tse import parse_result
        from tests.test_tse import fixture as source_fixture

        raw = source_fixture()
        raw.update(ele="6258", t="2", and_="n", dt="", ht="")
        raw["and"] = "n"
        raw["s"].update(st="0", snt="2")
        raw["e"]["c"] = "0"
        raw["v"].update(vv="0", vb="0", tvn="0")
        for group in raw["carg"][0]["agr"]:
            for party in group["par"]:
                for candidate in party["cand"]:
                    candidate["vap"] = "0"
        result = parse_result(raw, "br", "6258")
        self.assertIsNone(result["totalized_at"])
        self.assertEqual(result["valid_votes"], 0)
        self.assertFalse(result["official_final"])
        collection, prior = fixture(STAMP)
        collection["national"] = result
        snapshot = build(
            collection, prior, mode="demo", collected_at=STAMP, published_at=STAMP
        )
        self.assertTrue(snapshot["projection"]["pre_count"])
        self.assertEqual(snapshot["source"]["as_of"], result["generated_at"])
