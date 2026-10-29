"""Encerramento nacional não impede a publicação nem congela os municípios."""

import tempfile
import unittest
from pathlib import Path
from unittest.mock import Mock

from apurar_collector.core.tse import FetchResult, result_url
from apurar_collector.demo import fixture as demo_fixture
from apurar_collector.runtime import LiveSession, Runtime
from tests.test_tse import fixture


class FinalSessionTests(unittest.TestCase):
    def test_failed_remote_publication_retries_reconfirmed_final(self):
        client, remote = Mock(), Mock()
        raw = fixture(final=True)
        raw.update(ele="6258", t="2")
        client.fetch.side_effect = lambda url: (
            FetchResult("ok", raw)
            if url == result_url(election="6258")
            else FetchResult("backoff", error="HTTP 429", retry_at=9999999999)
        )
        remote.publish.side_effect = [OSError("R2 indisponível"), None]
        _, prior = demo_fixture("2026-10-25T18:00:00-03:00")
        with tempfile.TemporaryDirectory() as folder:
            session = LiveSession(Path(folder) / "session", client)
            runtime = Runtime(prior, Path(folder) / "state", Path(folder) / "bucket", remote)
            try:
                first, _ = session.cycle()
                with self.assertRaises(OSError):
                    runtime.emit(first, mode="live")
                self.assertFalse((runtime.state_dir / "publication-live.json").exists())
                second, _ = session.cycle()
                self.assertIsNotNone(second)
                self.assertTrue(session.collector.national_confirmed)
                runtime.emit(second, mode="live")
                self.assertEqual(remote.publish.call_count, 2)
                # Após êxito, repetir o mesmo nacional não repete escrita remota.
                third, _ = session.cycle()
                runtime.emit(third, mode="live")
                self.assertEqual(remote.publish.call_count, 2)
                # Bloqueio na própria fonte nacional não confirma o final em cache.
                client.fetch.side_effect = None
                client.fetch.return_value = FetchResult("backoff", error="HTTP 429")
                publishable, _ = session.cycle()
                self.assertIsNone(publishable)
                self.assertFalse(session.collector.national_confirmed)
                self.assertEqual(remote.publish.call_count, 2)
            finally:
                session.close()

    def test_final_national_publishes_even_if_catalog_is_blocked(self):
        client = Mock()
        raw = fixture(final=True)
        raw.update(ele="6258", t="2")
        client.fetch.side_effect = lambda url: (
            FetchResult("ok", raw)
            if url == result_url(election="6258")
            else FetchResult("backoff", error="HTTP 429", retry_at=9999999999)
        )
        with tempfile.TemporaryDirectory() as folder:
            session = LiveSession(folder, client)
            try:
                publishable, collection = session.cycle()
                self.assertIs(publishable, collection)
                self.assertTrue(publishable["national"]["official_final"])
                self.assertFalse(publishable["units"])
                self.assertEqual(collection["status"], "backoff")
                self.assertGreaterEqual(collection["next_poll_seconds"], 60)
                # Uma falha posterior na própria fonte nacional não é dado novo.
                client.fetch.side_effect = None
                client.fetch.return_value = FetchResult("error", error="offline")
                publishable, collection = session.cycle()
                self.assertIsNone(publishable)
                self.assertTrue(collection["national"]["official_final"])
            finally:
                session.close()

    def test_final_national_publishes_even_if_municipal_result_is_blocked(self):
        client = Mock()
        raw = fixture(final=True)
        raw.update(ele="6258", t="2")
        client.fetch.side_effect = lambda url: (
            FetchResult("ok", raw)
            if url == result_url(election="6258")
            else FetchResult("backoff", error="HTTP 429")
        )
        with tempfile.TemporaryDirectory() as folder:
            session = LiveSession(folder, client)
            try:
                collector = session.collector
                collector.catalog = {"sp00001": {"scope": "sp00001", "uf": "SP"}}
                collector.last_catalog = collector.clock()
                collector.structural_states = {"sp"}
                collector._tracking = Mock()
                publishable, collection = session.cycle()
                self.assertIs(publishable, collection)
                self.assertTrue(publishable["national"]["official_final"])
                self.assertIsNone(publishable["units"][0]["result"])
                self.assertEqual(collection["status"], "backoff")
                self.assertEqual(list(collector.pending), ["sp00001"])
            finally:
                session.close()
