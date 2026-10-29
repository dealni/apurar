"""Falhas do protocolo HTTP preservam o cache e permitem retentativa normal."""

import tempfile
import unittest
from http.client import BadStatusLine, IncompleteRead
from unittest.mock import Mock
from urllib.error import HTTPError

from apurar_collector.core.tse import TSEClient, result_url
from apurar_collector.runtime import LiveSession
from tests import test_partial_structure_collection
from tests.test_tse import Response, fixture


class TruncatedResponse(Response):
    def read(self, size=-1):
        raise IncompleteRead(b'{"partial":', 200)


class TSETransportTests(unittest.TestCase):
    def client(self, responses):
        opener = Mock(side_effect=responses)
        limiter = Mock()
        limiter.acquire.return_value = 0
        return TSEClient(opener=opener, limiter=limiter), opener

    def test_truncated_response_preserves_previous_cache_and_revalidates(self):
        broken = TruncatedResponse(fixture(), {"ETag": "broken"})
        client, opener = self.client([
            Response(fixture(), {"ETag": "valid"}), broken,
            HTTPError(result_url(), 304, "Not Modified", {}, None),
        ])
        self.assertEqual(client.fetch(result_url()).status, "ok")
        failed = client.fetch(result_url())
        self.assertEqual(failed.status, "error")
        self.assertIn("IncompleteRead", failed.error)
        self.assertTrue(broken.closed)
        self.assertEqual(client.cache[result_url()][1], "valid")
        recovered = client.fetch(result_url())
        self.assertEqual(recovered.status, "ok")
        self.assertFalse(recovered.changed)
        self.assertEqual(opener.call_args.args[0].get_header("If-none-match"), "valid")

    def test_malformed_status_line_does_not_abort_collection_or_poison_cache(self):
        client, _ = self.client([BadStatusLine("invalid"), Response(fixture())])
        failed = client.fetch(result_url())
        self.assertEqual(failed.status, "error")
        self.assertIn("BadStatusLine", failed.error)
        self.assertNotIn(result_url(), client.cache)
        self.assertEqual(client.fetch(result_url()).status, "ok")

    def test_municipal_protocol_failure_keeps_national_publishable(self):
        source = test_partial_structure_collection.PartialStructureCollectionTests().client("ok")

        def open_response(request, **kwargs):
            raw = source.fetch(request.full_url).data
            response = TruncatedResponse if request.full_url == result_url("sp00001", "6258") else Response
            return response(raw)

        client = TSEClient(opener=open_response, limiter=Mock(acquire=lambda: 0))
        with tempfile.TemporaryDirectory() as directory:
            session = LiveSession(directory, client)
            try:
                publishable, status = session.cycle()
                self.assertIs(publishable, status)
                self.assertTrue(session.collector.national_confirmed)
                self.assertEqual(status["national"]["votes"], {"13": 80, "22": 100})
                self.assertEqual(status["status"], "degraded")
                self.assertIn("sp00001", session.collector.pending)
                self.assertEqual(set(session.collector.units), {"ac00001", "zz"})
                self.assertIn("coleta municipal parcial", publishable["projection_block_reason"])
            finally:
                session.close()


if __name__ == "__main__":
    unittest.main()
