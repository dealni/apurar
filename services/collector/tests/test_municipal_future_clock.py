"""Resposta municipal futura não contamina o último lote oficial válido."""

import tempfile
import unittest
from pathlib import Path

from apurar_collector.core.collector import LiveCollector
from apurar_collector.core.store import Store
from apurar_collector.core.tse import result_url
from apurar_collector.runtime import LiveSession, Runtime
from apurar_collector.snapshot import municipalities
from tests.test_collector_future_recovery import NOW, result
from tests import test_partial_structure_collection


class MunicipalFutureClockTests(unittest.TestCase):
    def client(self):
        client = test_partial_structure_collection.PartialStructureCollectionTests().client("ok")
        original = client.fetch.side_effect
        client.future = False

        def fetch(url):
            response = original(url)
            if client.future and url == result_url("sp00001", "6258"):
                response.data.update(hg="19:00:00", ht="18:59:55", idg="101")
            return response

        client.fetch.side_effect = fetch
        return client

    def test_future_detail_preserves_valid_result_and_remains_pending(self):
        client = self.client()
        collector = LiveCollector(client, clock=lambda: NOW, election="6258")
        collector.cycle()
        previous = collector.units["sp00001"]
        client.future = True
        collector._queue("sp00001")
        status = collector.cycle()
        self.assertEqual(status["status"], "degraded")
        self.assertEqual(collector.units["sp00001"], previous)
        self.assertIn("sp00001", collector.pending)
        self.assertTrue(any("futuro" in error.lower() for error in status["progress"]["errors"]))
        with tempfile.TemporaryDirectory() as directory:
            runtime = Runtime({}, Path(directory) / "state", Path(directory) / "bucket")
            runtime.emit(status, mode="live", collected_at="2026-10-04T21:00:00Z")
        self.assertTrue(all(row["as_of"] <= "2026-10-04T18:00:00-03:00"
                            for row in municipalities(status)["items"]))
        client.future = False
        collector.cycle()
        self.assertNotIn("sp00001", collector.pending)

    def test_future_generation_alone_is_rejected_even_with_valid_totalization(self):
        client = self.client()
        client.sp_time = "19:00:00"
        collector = LiveCollector(client, clock=lambda: NOW, election="6258")
        scope, value, error, status = collector._fetch_unit("sp00001")
        self.assertEqual((scope, value, status), ("sp00001", None, "invalid"))
        self.assertIn("futuro", error.lower())

    def test_restored_future_detail_is_hidden_before_its_batch_and_then_recovers(self):
        with tempfile.TemporaryDirectory() as directory:
            store = Store(Path(directory) / "live-6258.sqlite3")
            store.save_official(result("sp00001", "19:00:00", votes=90))
            store.close()
            client = self.client()
            session = LiveSession(directory, client)
            session.collector.clock = lambda: NOW
            session.store.clock = lambda: NOW
            session.collector.batch_size = 1
            try:
                collection, _ = session.cycle()
                rows = {row["scope"]: row for row in collection["units"]}
                self.assertIsNone(rows["sp00001"]["result"])
                self.assertIn("sp00001", session.collector.pending)
                self.assertFalse(session.collector._coherent())
                runtime = Runtime({}, Path(directory) / "state", Path(directory) / "bucket")
                runtime.emit(collection, mode="live", collected_at="2026-10-04T21:00:00Z")
                for _ in range(3):
                    session.cycle()
                self.assertEqual(session.collector.units["sp00001"]["votes"]["13"], 80)
                self.assertEqual(session.store.official()["sp00001"]["votes"]["13"], 80)
            finally:
                session.close()
