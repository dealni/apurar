"""Upload pendente independe do backoff TSE e preserva o lote após reinício."""

import json
import tempfile
import unittest
from pathlib import Path
from unittest.mock import Mock, patch
from urllib.error import HTTPError

from apurar_collector.__main__ import main
from apurar_collector.core.tse import RateLimiter, TSEClient, result_url
from apurar_collector.demo import fixture as demo_fixture
from apurar_collector.runtime import LiveSession, Runtime
from tests.test_tse import Clock, Response, fixture


class TwoIterations:
    def __init__(self):
        self.waits = 0

    def is_set(self):
        return self.waits >= 2

    def wait(self, seconds):
        self.waits += 1

    def set(self):
        self.waits = 2


class PublicationRetryTests(unittest.TestCase):
    def run_cli(self, prior, state, output, remote, session, *, once=False):
        args = ["--live", "--publish-r2", "--state-dir", str(state), "--output", str(output)]
        if once:
            args.append("--once")
        with (
            patch("apurar_collector.__main__.load", return_value=({}, prior)),
            patch("apurar_collector.__main__.R2Bucket.from_environment"),
            patch("apurar_collector.__main__.Publisher", return_value=remote),
            patch("apurar_collector.__main__.LiveSession", return_value=session),
            patch("apurar_collector.__main__.signal.signal"),
            patch("apurar_collector.__main__.threading", Mock(Event=Mock(return_value=TwoIterations()))),
            patch("builtins.print"),
        ):
            return main(args)

    def test_real_global_backoff_does_not_delay_retry_or_query_tse_again(self):
        clock = Clock()
        national_url = result_url(election="6258")
        raw = fixture(final=True)
        raw.update(ele="6258", t="2")

        def open_source(request, timeout):
            if request.full_url == national_url:
                return Response(raw)
            raise HTTPError(request.full_url, 429, "Too Many Requests", {}, None)

        opener = Mock(side_effect=open_source)
        limiter = RateLimiter(clock=clock, sleep=clock.sleep)
        client = TSEClient(opener=opener, limiter=limiter, clock=clock)
        _, prior = demo_fixture("2020-01-01T00:00:00Z")
        with tempfile.TemporaryDirectory() as directory:
            state, output = Path(directory) / "state", Path(directory) / "bucket"
            session = LiveSession(state, client)
            session.collector.clock = clock
            session.collector.catalog = {"sp00001": {"scope": "sp00001", "uf": "SP"}}
            session.collector.last_catalog = clock()
            session.collector.structural_states = {"sp"}
            session.collector._tracking = Mock()
            session.cycle = Mock(wraps=session.cycle)
            remote = Mock()
            remote.publish.side_effect = [OSError("R2 offline"), None]
            self.assertEqual(self.run_cli(prior, state, output, remote, session), 0)
            self.assertEqual(remote.publish.call_count, 2)
            self.assertEqual(session.cycle.call_count, 1)
            self.assertEqual(opener.call_count, 2)
            self.assertGreater(limiter.blocked_until, clock())
            first, second = remote.publish.call_args_list
            self.assertEqual(first.args, second.args)
            self.assertFalse((state / "pending-live.json").exists())

    def test_restart_once_retries_identical_bundle_before_any_collection(self):
        collection, prior = demo_fixture("2020-01-01T00:00:00Z")
        with tempfile.TemporaryDirectory() as directory:
            state, output = Path(directory) / "state", Path(directory) / "bucket"
            failed = Mock()
            failed.publish.side_effect = OSError("R2 offline")
            with self.assertRaises(OSError):
                Runtime(prior, state, output, failed).emit(collection, mode="live")
            pending = json.loads((state / "pending-live.json").read_text())
            remote, session = Mock(), Mock()
            session.cycle.side_effect = AssertionError("TSE não deve ser consultado")
            self.assertEqual(self.run_cli(prior, state, output, remote, session, once=True), 0)
            session.cycle.assert_not_called()
            self.assertEqual(remote.publish.call_args.args[0], pending["snapshot"])
            self.assertFalse((state / "pending-live.json").exists())

    def test_invalid_build_does_not_create_pending_or_block_next_collection(self):
        collection, prior = demo_fixture("2020-01-01T00:00:00Z")
        invalid = dict(collection, national=dict(collection["national"], divulgation_allowed=False))
        session = Mock()
        session.cycle.side_effect = [(invalid, {}), (collection, {})]
        with tempfile.TemporaryDirectory() as directory:
            state, output = Path(directory) / "state", Path(directory) / "bucket"
            remote = Mock()
            self.assertEqual(self.run_cli(prior, state, output, remote, session), 0)
            self.assertEqual(session.cycle.call_count, 2)
            remote.publish.assert_called_once()
            self.assertFalse((state / "pending-live.json").exists())
