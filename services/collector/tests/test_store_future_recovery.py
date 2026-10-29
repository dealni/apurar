"""A correção de relógio persiste e sobrevive ao reinício da sessão ao vivo."""

import tempfile
import unittest
from pathlib import Path

from apurar_collector.core.store import Store
from apurar_collector.runtime import LiveSession
from tests import test_partial_structure_collection
from tests.test_collector_future_recovery import NOW, result


class StoreFutureRecoveryTests(unittest.TestCase):
    def test_live_session_persists_recovered_national_and_units_before_restart(self):
        for idg in ("100", "101"):
            with self.subTest(previous_idg=idg), tempfile.TemporaryDirectory() as directory:
                store = Store(Path(directory) / "live-6258.sqlite3")
                for scope in ("br", "ac00001", "sp00001", "zz"):
                    self.assertTrue(store.save_official(
                        result(scope, "19:00:00", idg=idg, votes=90),
                    ))
                store.close()
                client = test_partial_structure_collection.PartialStructureCollectionTests().client("ok")
                session = LiveSession(directory, client)
                try:
                    session.collector.clock = lambda: NOW
                    session.store.clock = lambda: NOW
                    collection, _ = session.cycle()
                    self.assertIsNotNone(collection)
                    expected = {"br": session.collector.national, **session.collector.units}
                    self.assertEqual(session.store.official(), expected)
                finally:
                    session.close()
                restarted = LiveSession(directory, client)
                try:
                    restored = {"br": restarted.collector.national, **restarted.collector.units}
                    self.assertEqual(restored, expected)
                    self.assertTrue(all(row["votes"]["13"] == 80 for row in restored.values()))
                finally:
                    restarted.close()

    def test_normal_regressions_remain_rejected_and_later_vote_reduction_is_saved(self):
        cases = (
            (result("br", "18:00:00"), result("br", "17:59:00", idg="101")),
            (result("br", "18:00:00"), result("br", "18:00:00", idg="101")),
            (result("br", "18:00:00"), result("br", "18:00:00", votes=70)),
            (result("br", "18:01:00"), result("br", "18:00:00", idg="101")),
            (result("br", "19:00:00"), result("br", "18:01:01", idg="101")),
        )
        for previous, incoming in cases:
            with self.subTest(previous=previous["generated_at"]), tempfile.TemporaryDirectory() as directory:
                store = Store(Path(directory) / "official.sqlite3", clock=lambda: NOW)
                try:
                    self.assertTrue(store.save_official(previous))
                    self.assertFalse(store.save_official(incoming))
                    self.assertEqual(store.official()["br"], previous)
                finally:
                    store.close()
        with tempfile.TemporaryDirectory() as directory:
            store = Store(Path(directory) / "official.sqlite3", clock=lambda: NOW)
            try:
                self.assertTrue(store.save_official(result("br", "17:59:00", votes=90)))
                reduction = result("br", "18:00:00", idg="101", votes=70)
                self.assertTrue(store.save_official(reduction))
                self.assertEqual(store.official()["br"], reduction)
            finally:
                store.close()


if __name__ == "__main__":
    unittest.main()
