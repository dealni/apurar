"""Conciliação não pode atribuir votos de outro território ou eleição ao prior."""

import unittest

from apurar_collector.demo import fixture
from apurar_collector.model import forecast


class ModelIdentityTests(unittest.TestCase):
    def test_local_identity_mismatch_suspends_projection(self):
        for field, value in (
            ("scope", "ba00001"),
            ("election", "6257"),
            ("round", 1),
        ):
            with self.subTest(field=field):
                collection, prior = fixture("2026-10-25T18:00:00-03:00")
                # O mesmo sufixo municipal e os mesmos votos não comprovam identidade.
                collection["units"][0]["result"][field] = value
                prediction, _, _, notes = forecast(collection, prior)
                self.assertIsNone(prediction)
                self.assertIn("identidade", notes[0])
                self.assertEqual(collection["national"]["votes"], {"13": 320, "22": 280})

    def test_registry_uf_must_match_scope(self):
        collection, prior = fixture("2026-10-25T18:00:00-03:00")
        collection["units"][0]["scope"] = "ba00001"
        collection["units"][0]["result"]["scope"] = "ba00001"
        self.assertIsNone(forecast(collection, prior)[0])

    def test_final_result_is_independent_of_local_identity(self):
        collection, prior = fixture("2026-10-25T18:00:00-03:00")
        collection["national"]["official_final"] = True
        collection["units"][0]["result"]["scope"] = "ba00001"
        prediction, model, _, _ = forecast(collection, prior)
        self.assertEqual(prediction, collection["national"]["votes"])
        self.assertEqual(model, "official_final")
