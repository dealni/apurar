"""Monitor offline: transporte Telegram e Analytics sempre simulados."""

import copy
import io
import json
import tempfile
import unittest
import urllib.error
from pathlib import Path
from unittest.mock import Mock

from apurar_collector.consumption_alerts import run
from apurar_collector.consumption_analytics import AnalyticsUnavailable, NoRedirect, finite_totals, parse, query, read_analytics, window_end
from apurar_collector.consumption_rules import DEFAULTS, conditions, message


def response(requests=100, previous=100, cpu=1000000):
    account = {}
    for label, count in (("current", requests), ("previous", previous)):
        account[label + "Workers"] = [{"sum": {"requests": count, "errors": 0, "cpuTimeUs": cpu}}]
        account[label + "R2"] = [{"sum": {"requests": 10}, "dimensions": {"actionType": "GetObject"}}]
    return {"data": {"viewer": {"accounts": [account]}}}


class ConsumptionAnalyticsTests(unittest.TestCase):
    def test_windows_and_project_filters(self):
        end = window_end(1801)
        self.assertEqual(end, 1500)
        text = query("private-account", "selected-worker", "selected-bucket", end)
        self.assertEqual(text.count('scriptName:"selected-worker"'), 2)
        self.assertEqual(text.count('bucketName:"selected-bucket"'), 2)
        self.assertIn('datetime_geq:"1970-01-01T00:15:00Z",datetime_lt:"1970-01-01T00:25:00Z"', text)
        self.assertIn('datetime_geq:"1970-01-01T00:05:00Z",datetime_lt:"1970-01-01T00:15:00Z"', text)
        self.assertIn('accountTag:"private-account"', text)

    def test_units_classes_and_gross_cost(self):
        payload = response(1_000_000, cpu=1_000_000_000)
        rows = payload["data"]["viewer"]["accounts"][0]["currentR2"]
        rows[:] = [{"sum": {"requests": 1_000_000}, "dimensions": {"actionType": action}}
                   for action in ("PutObject", "GetObject", "DeleteObject", "FutureAction")]
        sample = parse(payload)
        current = sample["current"]
        self.assertEqual(current["cpu_ms"], 1_000_000)
        self.assertEqual(current["r2_requests"], 4_000_000)
        self.assertAlmostEqual(current["usd_hour"], 6 * (.30 + .02 + 4.50 + .36))
        text = message("usd_hour", True, sample, 1500)
        for value in ("BRUTA", "Não é fatura", "franquias compartilhadas", "não classificadas", "R2 Standard"):
            self.assertIn(value, text)

    def test_invalid_and_partial_graphql_never_become_zero(self):
        payload = response()
        partial = copy.deepcopy(payload)
        partial["errors"] = [{"message": "secret"}]
        variants = [None, {}, {"data": None}, partial]
        for field, invalid in (("currentWorkers", None), ("currentR2", None), ("currentWorkers", [{"sum": {"requests": None}}]),
                               ("currentR2", [{"sum": {"requests": 2}, "dimensions": {}}])):
            changed = copy.deepcopy(payload)
            changed["data"]["viewer"]["accounts"][0][field] = invalid
            variants.append(changed)
        for value in variants:
            with self.subTest(value=value), self.assertRaises(AnalyticsUnavailable):
                parse(value)

    def test_empty_series_zero_requires_sibling_rows(self):
        payload = response()
        account = payload["data"]["viewer"]["accounts"][0]
        account["currentWorkers"] = []
        self.assertEqual(parse(payload)["current"]["requests"], 0)
        account["currentWorkers"] = account["previousWorkers"]
        account["currentR2"] = []
        self.assertEqual(parse(payload)["current"]["r2_requests"], 0)
        account["currentWorkers"] = []
        with self.assertRaises(AnalyticsUnavailable):
            parse(payload)

    def test_empty_baseline_is_unknown_without_discarding_valid_current(self):
        payload = response(60000)
        account = payload["data"]["viewer"]["accounts"][0]
        account["previousWorkers"], account["previousR2"] = [], []
        sample = parse(payload)
        self.assertEqual(sample["current"]["requests"], 60000)
        self.assertIsNone(sample["previous"])
        self.assertEqual(conditions(sample, [], DEFAULTS), {"requests"})
        self.assertEqual(conditions(sample, ["growth"], DEFAULTS), {"requests", "growth"})

    def test_empty_current_is_not_replaced_with_previous_sample(self):
        payload = response(60000)
        account = payload["data"]["viewer"]["accounts"][0]
        account["currentWorkers"], account["currentR2"] = [], []
        with self.assertRaises(AnalyticsUnavailable) as caught:
            parse(payload)
        self.assertEqual(caught.exception.reason, "empty_current_window")

    def test_invalid_baseline_is_rejected_instead_of_becoming_unknown(self):
        for invalid in (None, [{"sum": {"requests": None}}]):
            payload = response()
            account = payload["data"]["viewer"]["accounts"][0]
            account["previousWorkers"] = invalid
            with self.assertRaises(AnalyticsUnavailable):
                parse(payload)

    def test_truncated_negative_boolean_nan_rejected(self):
        for value in (-1, True, float("nan")):
            with self.assertRaises(AnalyticsUnavailable):
                parse(response(value))
        payload = response()
        payload["data"]["viewer"]["accounts"][0]["currentR2"] *= 10000
        with self.assertRaises(AnalyticsUnavailable):
            parse(payload)

    def test_http_network_and_malformed_sanitized(self):
        failures = [urllib.error.HTTPError("secret-url", code, "secret", {}, None) for code in (400, 403, 429)]
        failures.extend([TimeoutError("secret-token"), urllib.error.URLError("secret"), ValueError("secret")])
        for failure in failures:
            with self.subTest(failure=type(failure).__name__), self.assertRaisesRegex(AnalyticsUnavailable, "indisponível") as caught:
                read_analytics("private-token", "account", "worker", "bucket", 1500, opener=Mock(side_effect=failure))
            self.assertNotIn("secret", str(caught.exception))
            if isinstance(failure, urllib.error.HTTPError):
                failure.close()
        for raw in (b"not-json", b'{"data":null}', b"x" * 2_000_001):
            opened = Mock(return_value=io.BytesIO(raw))
            with self.assertRaises(AnalyticsUnavailable):
                read_analytics("fake", "a", "w", "b", 1500, opener=opened)

    def test_aggregates_and_24h_extrapolation_must_be_finite(self):
        payload = response(1e308)
        account = payload["data"]["viewer"]["accounts"][0]
        account["currentWorkers"] *= 2
        with self.assertRaises(AnalyticsUnavailable):
            parse(payload)
        # Protege a mensagem mesmo se tarifas/estimativas forem ampliadas no futuro.
        with self.assertRaises(AnalyticsUnavailable):
            finite_totals({"requests": 1, "usd_hour": 1e307})

    def test_redirect_refused_without_exposing_destination(self):
        with self.assertRaises(AnalyticsUnavailable) as caught:
            NoRedirect().redirect_request(None, None, 302, "", {}, "https://secret-destination/")
        self.assertNotIn("secret-destination", str(caught.exception))

    def test_successful_transport_uses_fixed_endpoint_and_timeout(self):
        opened = Mock(return_value=io.BytesIO(json.dumps(response()).encode()))
        self.assertEqual(read_analytics("fake", "a", "w", "b", 1500, opener=opened)["current"]["requests"], 100)
        request = opened.call_args.args[0]
        self.assertEqual(request.full_url, "https://api.cloudflare.com/client/v4/graphql")
        self.assertEqual(request.get_method(), "POST")
        self.assertEqual(opened.call_args.kwargs["timeout"], 20)

    def test_failure_categories_survive_http_wrapper_without_private_content(self):
        cases = [(io.BytesIO(b"bad-json"), "invalid_json"),
                 (io.BytesIO(json.dumps({"errors": [{"message": "private-token"}]}).encode()), "graphql_error"),
                 (io.BytesIO(b"x" * 2_000_001), "response_too_large")]
        for response_body, reason in cases:
            with self.subTest(reason=reason), self.assertRaises(AnalyticsUnavailable) as caught:
                read_analytics("private-token", "a", "w", "b", 1500, opener=Mock(return_value=response_body))
            self.assertEqual(caught.exception.reason, reason)
            self.assertNotIn("private-token", str(caught.exception))
        error = urllib.error.HTTPError("private-url", 403, "private-token", {}, None)
        self.addCleanup(error.close)
        with self.assertRaises(AnalyticsUnavailable) as caught:
            read_analytics("fake", "a", "w", "b", 1500, opener=Mock(side_effect=error))
        self.assertEqual(caught.exception.reason, "http_403")


class ConsumptionMonitorTests(unittest.TestCase):
    def setUp(self):
        self.directory = tempfile.TemporaryDirectory()
        self.addCleanup(self.directory.cleanup)
        self.path = Path(self.directory.name) / "usage.json"
        self.sender = Mock()
        self.reader = Mock(return_value=parse(response()))

    def invoke(self, now):
        return run(self.path, "private-token", "private-chat", "private-analytics", "private-account",
                   now=now, reader=self.reader, transport=self.sender)

    def test_normal_empty_notification_and_persisted_poll_cadence(self):
        self.assertTrue(self.invoke(1800)["ok"])
        self.assertFalse(self.invoke(1860)["queried"])
        self.assertFalse(self.invoke(2099)["queried"])
        self.assertTrue(self.invoke(2100)["queried"])
        self.assertEqual(self.reader.call_count, 2)
        self.assertEqual(self.sender.call_count, 0)

    def test_stable_conditions_not_counts_dedup_and_hysteresis(self):
        self.reader.return_value = parse(response(60000, previous=30000))
        self.assertEqual(self.invoke(1800)["sent"], 1)
        self.reader.return_value = parse(response(70000, previous=40000))
        self.assertEqual(self.invoke(2100)["sent"], 0)
        self.reader.return_value = parse(response(45000, previous=30000))
        self.assertEqual(self.invoke(2400)["sent"], 0)
        self.reader.return_value = parse(response(39000, previous=30000))
        self.assertEqual(self.invoke(2700)["sent"], 1)
        self.assertIn("normalização confirmada", self.sender.call_args.args[2])
        self.assertEqual(self.invoke(3000)["sent"], 0)

    def test_failure_delivery_retry_survives_restart_without_repoll(self):
        self.reader.return_value = parse(response(60000, previous=30000))
        self.sender.side_effect = OSError("secret-url-private-token")
        self.assertEqual(self.invoke(1800)["pending"], 1)
        self.assertEqual(self.invoke(1830)["pending"], 1)
        self.assertEqual(self.sender.call_count, 1)
        self.sender.side_effect = None
        self.assertEqual(self.invoke(1860)["sent"], 1)
        self.assertEqual(self.reader.call_count, 1)
        saved = self.path.read_text()
        for secret in ("private-token", "private-chat", "private-account", "private-analytics", "secret-url"):
            self.assertNotIn(secret, saved)
        self.assertEqual(self.path.stat().st_mode & 0o777, 0o600)

    def test_analytics_failures_keep_old_conditions_until_valid_recovery(self):
        self.reader.return_value = parse(response(60000, previous=30000))
        self.invoke(1800)
        self.reader.side_effect = AnalyticsUnavailable("secret")
        for now in (2100, 2400):
            self.assertFalse(self.invoke(now)["ok"])
        self.assertEqual(self.sender.call_count, 1)
        self.assertEqual(self.invoke(2700)["sent"], 1)
        self.assertEqual(self.invoke(3000)["sent"], 0)
        saved = json.loads(self.path.read_text())
        self.assertEqual(saved["active"], ["analytics", "requests"])
        self.reader.side_effect = None
        self.reader.return_value = parse(response())
        self.assertEqual(self.invoke(3300)["sent"], 2)
        self.assertIn("normalização confirmada", self.sender.call_args.args[2])

    def test_analytics_recovery_preserves_still_high_traffic(self):
        self.reader.return_value = parse(response(60000, previous=30000))
        self.invoke(1800)
        self.reader.side_effect = AnalyticsUnavailable("secret")
        for now in (2100, 2400, 2700):
            self.invoke(now)
        self.reader.side_effect = None
        self.assertEqual(self.invoke(3000)["sent"], 1)
        self.assertIn("Leitura do Analytics restabelecida", self.sender.call_args.args[2])
        self.assertEqual(json.loads(self.path.read_text())["active"], ["requests"])

    def test_retry_does_not_claim_recovery_on_invalid_data(self):
        self.reader.side_effect = AnalyticsUnavailable("secret")
        self.sender.side_effect = OSError("secret-token")
        for now in (1800, 2100, 2400):
            self.invoke(now)
        self.sender.side_effect = None
        self.assertEqual(self.invoke(2460)["sent"], 1)
        self.assertIn("não confirma recuperação", self.sender.call_args.args[2])
        self.assertFalse(self.invoke(2520)["ok"])

    def prepare_failed_traffic_recovery(self):
        self.reader.return_value = parse(response(60000, previous=30000))
        self.invoke(1800)
        self.reader.return_value = parse(response())
        self.sender.side_effect = OSError("fake")
        self.invoke(2100)
        self.assertEqual(self.sender.call_count, 2)
        self.reader.side_effect = AnalyticsUnavailable("fake")
        self.sender.side_effect = None
        self.assertEqual(self.invoke(2400)["sent"], 0)
        self.assertEqual(self.invoke(2460)["sent"], 0)
        self.assertEqual(self.sender.call_count, 2)

    def test_pending_recovery_waits_for_valid_low_sample(self):
        self.prepare_failed_traffic_recovery()
        self.reader.side_effect = None
        self.assertEqual(self.invoke(2700)["sent"], 1)
        self.assertIn("normalização", self.sender.call_args.args[2])
        self.assertEqual(self.invoke(3000)["sent"], 0)

    def test_pending_recovery_canceled_when_valid_sample_is_high(self):
        self.prepare_failed_traffic_recovery()
        self.reader.side_effect = None
        self.reader.return_value = parse(response(60000, previous=30000))
        self.assertEqual(self.invoke(2700)["sent"], 0)
        self.assertEqual(json.loads(self.path.read_text())["pending"], {})

    def test_pending_analytics_recovery_waits_for_valid_sample(self):
        self.reader.side_effect = AnalyticsUnavailable("fake")
        for now in (1800, 2100, 2400):
            self.invoke(now)
        self.reader.side_effect = None
        self.sender.side_effect = OSError("fake")
        self.invoke(2700)
        self.reader.side_effect = AnalyticsUnavailable("fake")
        self.sender.side_effect = None
        self.assertEqual(self.invoke(3000)["sent"], 0)
        self.assertEqual(self.invoke(3060)["sent"], 0)
        self.reader.side_effect = None
        self.assertEqual(self.invoke(3300)["sent"], 1)
        self.assertIn("Analytics restabelecida", self.sender.call_args.args[2])

    def test_growth_requires_minimum_and_all_thresholds(self):
        limits = dict(DEFAULTS)
        self.assertNotIn("growth", conditions(parse(response(9999, 0)), [], limits))
        self.assertIn("growth", conditions(parse(response(10000, 0)), [], limits))
        sample = parse(response(60000, 10000, cpu=2_000_000_000))
        sample["current"].update(r2_requests=500000, usd_hour=1)
        self.assertEqual(conditions(sample, [], limits), {"requests", "cpu_ms", "r2_requests", "usd_hour", "growth"})

    def test_quiet_worker_active_collector_is_healthy_without_alert(self):
        payload = response()
        account = payload["data"]["viewer"]["accounts"][0]
        for label in ("current", "previous"):
            account[label + "Workers"] = []
        self.reader.return_value = parse(payload)
        for now in (1800, 2100, 2400):
            self.assertTrue(self.invoke(now)["ok"])
        self.assertEqual(self.sender.call_count, 0)

    def test_current_high_baseline_missing_still_alerts_absolute_limits(self):
        sample = parse(response(60000, 30000))
        sample["previous"] = None
        self.reader.return_value = sample
        result = self.invoke(1800)
        self.assertTrue(result["ok"])
        self.assertTrue(result["analytics_valid"])
        self.assertFalse(result["growth_valid"])
        self.assertEqual(result["sent"], 1)
        self.assertIn("crescimento indeterminado", self.sender.call_args.args[2])
        self.assertEqual(json.loads(self.path.read_text())["active"], ["requests"])

    def test_missing_baseline_preserves_growth_until_valid_comparison(self):
        self.reader.return_value = parse(response(20000, 1000))
        self.assertEqual(self.invoke(1800)["sent"], 1)
        sample = parse(response(100, 100))
        sample["previous"] = None
        self.reader.return_value = sample
        self.assertTrue(self.invoke(2100)["ok"])
        self.assertEqual(self.sender.call_count, 1)
        self.assertEqual(json.loads(self.path.read_text())["active"], ["growth"])
        self.reader.return_value = parse(response())
        result = self.invoke(2400)
        self.assertTrue(result["growth_valid"])
        self.assertEqual(result["sent"], 1)
        self.assertIn("normalização", self.sender.call_args.args[2])

    def test_pending_growth_recovery_waits_for_valid_comparison(self):
        self.reader.return_value = parse(response(20000, 1000))
        self.invoke(1800)
        self.reader.return_value = parse(response())
        self.sender.side_effect = OSError("private-token")
        self.invoke(2100)
        sample = parse(response())
        sample["previous"] = None
        self.reader.return_value = sample
        self.sender.side_effect = None
        self.assertEqual(self.invoke(2400)["sent"], 0)
        self.assertEqual(self.invoke(2460)["sent"], 0)
        self.assertEqual(self.sender.call_count, 2)
        self.assertFalse(json.loads(self.path.read_text())["pending"]["growth"]["active"])
        self.reader.return_value = parse(response())
        self.assertEqual(self.invoke(2700)["sent"], 1)
        self.assertIn("normalização", self.sender.call_args.args[2])

    def test_missing_baseline_can_recover_absolute_limit_and_analytics(self):
        self.reader.return_value = parse(response(60000, 30000))
        self.invoke(1800)
        self.reader.side_effect = AnalyticsUnavailable("private-token")
        for now in (2100, 2400, 2700):
            self.invoke(now)
        sample = parse(response())
        sample["previous"] = None
        self.reader.return_value = sample
        self.reader.side_effect = None
        result = self.invoke(3000)
        self.assertTrue(result["analytics_valid"])
        self.assertFalse(result["growth_valid"])
        self.assertEqual(result["sent"], 2)
        self.assertEqual(json.loads(self.path.read_text())["active"], [])

    def test_analytics_reason_persists_without_secrets_and_clears_on_valid_data(self):
        self.reader.side_effect = AnalyticsUnavailable("private-token", reason="empty_current_window")
        result = self.invoke(1800)
        self.assertEqual(result["analytics_reason"], "empty_current_window")
        self.assertFalse(result["ok"])
        self.assertEqual(self.invoke(1860)["analytics_reason"], "empty_current_window")
        self.assertEqual(self.reader.call_count, 1)
        self.assertNotIn("private-token", self.path.read_text())
        self.reader.side_effect = None
        self.assertIsNone(self.invoke(2100)["analytics_reason"])
        self.assertNotIn("analytics_reason", json.loads(self.path.read_text()))

    def test_unexpected_reader_failure_does_not_export_its_message(self):
        self.reader.side_effect = ValueError("private-token")
        result = self.invoke(1800)
        self.assertEqual(result["analytics_reason"], "unexpected_error")
        self.assertNotIn("private-token", json.dumps(result))

    def test_both_empty_series_never_confirm_recovery(self):
        self.reader.return_value = parse(response(60000, previous=30000))
        self.invoke(1800)
        payload = response()
        account = payload["data"]["viewer"]["accounts"][0]
        account["currentWorkers"], account["currentR2"] = [], []
        self.reader.side_effect = lambda *unused: parse(payload)
        for now in (2100, 2400, 2700):
            self.assertFalse(self.invoke(now)["ok"])
        self.assertEqual(json.loads(self.path.read_text())["active"], ["analytics", "requests"])
        self.assertEqual(self.sender.call_count, 2)
        self.assertNotIn("normalização", self.sender.call_args.args[2])

    def test_clock_rollback_and_destination_change_force_fresh_sample(self):
        self.invoke(1800)
        self.assertTrue(self.invoke(1700)["queried"])
        result = run(self.path, "fake", "fake", "fake", "another-account", now=1710,
                     reader=self.reader, transport=self.sender)
        self.assertTrue(result["queried"])


class ConsumptionDestinationTests(unittest.TestCase):
    def test_changed_recipient_gets_current_alert_without_private_state(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "usage.json"
            reader = Mock(return_value=parse(response(60000, previous=30000)))
            sender = Mock()
            for chat, now in (("recipient-private-one", 1800), ("recipient-private-two", 1810)):
                result = run(path, "fake", chat, "fake", "account", now=now, reader=reader, transport=sender)
                self.assertTrue(result["queried"])
                self.assertEqual(result["sent"], 1)
            self.assertNotIn("recipient-private", path.read_text())
