"""Transporte sempre simulado: nenhum alerta real nos testes."""

import json
import tempfile
import unittest
from pathlib import Path
from unittest.mock import Mock, patch

from apurar_collector.diagnostics_alerts import NoTelegramRedirect, atomic, deliver, notify


class AlertTests(unittest.TestCase):
    def test_dedup_recovery_and_failure_retry(self):
        with tempfile.TemporaryDirectory() as directory:
            state = Path(directory) / "alert.json"
            healthy, failure = {"ok": True, "issues": []}, {"ok": False, "issues": ["Falha da coleta"]}
            sender = Mock()
            self.assertFalse(notify(healthy, state, "fake", "fake", clock=0, transport=sender)["sent"])
            self.assertTrue(notify(failure, state, "fake", "fake", clock=1, transport=sender)["sent"])
            self.assertFalse(notify(failure, state, "fake", "fake", clock=2, transport=sender)["sent"])
            sender.side_effect = OSError("não imprimir URL/token")
            self.assertFalse(notify(healthy, state, "fake", "fake", clock=3, transport=sender)["ok"])
            self.assertFalse(json.loads(state.read_text())["healthy"])
            self.assertEqual(notify(healthy, state, "fake", "fake", clock=4, transport=sender)["reason"], "backoff")
            sender.side_effect = None
            self.assertTrue(notify(healthy, state, "fake", "fake", clock=64, transport=sender)["sent"])
            self.assertEqual(sender.call_count, 3)

    def test_telegram_ok_false_not_delivery(self):
        response = Mock()
        response.__enter__ = Mock(return_value=response)
        response.__exit__ = Mock(return_value=False)
        response.read.return_value = b'{"ok":false,"description":"recusado"}'
        with patch("urllib.request.OpenerDirector.open", return_value=response) as opened:
            with self.assertRaises(ValueError):
                deliver("fake", "fake", "teste")
        self.assertEqual(opened.call_args.kwargs["timeout"], 10)


class AlertRegressionTests(unittest.TestCase):
    def test_atomic_ignores_predictable_temp_link_and_uses_private_permissions(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            victim = root / "untouched"
            victim.write_text("preservar")
            path = root / "alert.json"
            path.with_suffix(".tmp").symlink_to(victim)
            atomic(path, {"ok": True})
            self.assertEqual(victim.read_text(), "preservar")
            self.assertEqual(json.loads(path.read_text()), {"ok": True})
            self.assertEqual(path.stat().st_mode & 0o777, 0o600)

    def test_destination_change_realerts_without_recording_recipient(self):
        with tempfile.TemporaryDirectory() as directory:
            state = Path(directory) / "alert.json"
            failure = {"ok": False, "issues": ["Falha"]}
            sender = Mock()
            self.assertTrue(notify(failure, state, "fake", "chat-private-one", clock=1, transport=sender)["sent"])
            self.assertTrue(notify(failure, state, "fake", "chat-private-two", clock=2, transport=sender)["sent"])
            self.assertNotIn("chat-private", state.read_text())

    def test_redirect_and_invalid_telegram_response_rejected(self):
        with self.assertRaises(ValueError):
            NoTelegramRedirect().redirect_request(None, None, 302, "", {}, "https://private.example")
        for raw in (b"[]", b"x" * 100001):
            response = Mock()
            response.__enter__ = Mock(return_value=response)
            response.__exit__ = Mock(return_value=False)
            response.read.return_value = raw
            with patch("urllib.request.OpenerDirector.open", return_value=response):
                with self.assertRaises(ValueError):
                    deliver("fake", "fake", "teste")
