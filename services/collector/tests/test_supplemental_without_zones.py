"""Migração local remove fila zonal sem apagar publicações históricas."""
import json
from pathlib import Path
import tempfile
import unittest

from apurar_collector.core.tse import FetchResult
from apurar_collector.supplemental import SupplementalCollector, catalog_targets
from apurar_collector.supplemental_tse import pending_item, supplemental_url
from tests.test_supplemental import RESULT_NOW, raw_result


def retained_catalogs():
    states = []
    for index, uf in enumerate(('ac', 'am', 'df', 'es', 'rn', 'to')):
        count = 79 if index == 0 else 78
        states.append({'cd': uf, 'ds': uf.upper(), 'mu': [
            {'cd': str(10000 + n), 'nm': 'LOCAL SINTETICO', 'z': ['0001', '0002']}
            for n in range(count)]})
    governor = {'f': 'o', 'abr': states}
    exterior = {'f': 'o', 'abr': [{'cd': 'zz', 'ds': 'EXTERIOR', 'mu': [
        {'cd': str(29000 + n), 'nm': 'LOCAL SINTETICO', 'z': ['0001']}
        for n in range(186)]}]}
    return catalog_targets(governor, '6260', {}) + catalog_targets(exterior, '6258', {})


class SupplementalWithoutZonesTests(unittest.TestCase):
    def test_catalog_discards_zones_and_keeps_661_official_targets(self):
        targets = retained_catalogs()
        self.assertEqual(len(targets), 661)
        self.assertEqual(sum(t['kind'] == 'governor' for t in targets), 6)
        self.assertEqual(sum(t['kind'] == 'governor_municipality' for t in targets), 469)
        self.assertEqual(sum(t['kind'] == 'city' for t in targets), 186)
        self.assertTrue(all('-z' not in target['source_url'] for target in targets))

    def test_legacy_6805_zones_are_never_queried_or_republished(self):
        targets = retained_catalogs()
        by_url = {t['source_url']: t for t in targets}
        class Client:
            def __init__(self):
                self.calls = []
            def fetch(self, url):
                if '-z' in url:
                    raise AssertionError('Zona legada não pode ser consultada')
                self.calls.append(url)
                target = by_url[url]
                code = target['scope'][2:] if len(target['scope']) == 7 else target['scope']
                raw = raw_result(target['election'], '3' if target['office'] == 'governor' else '1',
                                 code, 'mu' if len(target['scope']) == 7 else 'uf')
                return FetchResult('ok', raw, url=url)
        with tempfile.TemporaryDirectory() as directory:
            collector = SupplementalCollector(None, directory, clock=lambda: RESULT_NOW)
            for target in targets:
                key = target['election'] + ':' + target['id']
                collector.targets[key] = target
                collector.items[key] = pending_item(target)
            collector.catalog_checked_at = RESULT_NOW
            collector._save()
            state = json.loads(collector.path.read_text())
            base = next(t for t in targets if t['kind'] == 'city')
            pending = []
            for number in range(6805):
                zone = str(number).zfill(4)
                target = {**base, 'kind': 'zone', 'zone': zone,
                    'id': base['id'] + ':' + zone, 'municipality_id': base['id'],
                    'source_url': supplemental_url(base['scope'], zone=zone)}
                key = target['election'] + ':' + target['id']
                state['targets'][key] = target
                state['items'][key] = {**pending_item(target), 'fetch_status': 'backoff'}
                state['detail_retry'][key] = 1600
                pending.append([key, 1600])
            state.update(zone_scheduler={'pending': pending, 'parents': {}, 'priority': []},
                         next_group='zone', cursors={'detail': 0, 'zone': 6805})
            collector.path.write_text(json.dumps(state))
            historical = Path(directory) / 'immutable-publication.json'
            historical.write_text('{"zones":[{"official":"historical"}]}')
            previous_bytes = historical.read_bytes()
            client = Client()
            restored = SupplementalCollector(client, directory, clock=lambda: RESULT_NOW)
            self.assertEqual(len(restored.targets), 661)
            self.assertEqual(len(restored.items), 661)
            self.assertEqual(restored.detail_retry, {})
            self.assertEqual(restored.cursors, {'detail': 0})
            payload = restored.step(budget=1000)
            self.assertEqual(len(client.calls), 661)
            self.assertEqual(len(set(client.calls)), 661)
            self.assertEqual(payload['coverage']['available'], 661)
            self.assertEqual(payload['coverage']['errors'], 0)
            self.assertFalse(payload['capabilities']['zones'])
            self.assertEqual(payload['zones'], [])
            self.assertEqual(payload['coverage']['zones'], {'total': 0, 'available': 0, 'pending': 0})
            migrated = json.loads(restored.path.read_text())
            self.assertNotIn('zone_scheduler', migrated)
            self.assertNotIn('next_group', migrated)
            self.assertEqual(historical.read_bytes(), previous_bytes)
