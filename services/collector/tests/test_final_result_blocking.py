"""Bloqueios operacionais suspendem estimativas, preservando o final elegível."""

import unittest

from apurar_collector.demo import fixture
from apurar_collector.snapshot import build


STAMP = "2026-10-25T18:00:00-03:00"
BLOCK_REASON = "Coleta municipal parcial; aguardando conciliação."


class FinalResultBlockingTests(unittest.TestCase):
    def snapshot(self, collection, prior, **options):
        return build(
            collection, prior, mode="live", collected_at=STAMP,
            published_at=STAMP, **options,
        )

    def test_eligible_final_survives_operational_blocks(self):
        for partial in (False, True):
            for enabled in (False, True):
                with self.subTest(partial=partial, enabled=enabled):
                    collection, prior = fixture(STAMP)
                    national = collection["national"]
                    national.update(official_final=True, sections_counted=30)
                    if partial:
                        collection["units"][0]["result"] = None
                        collection["projection_block_reason"] = BLOCK_REASON
                    result = self.snapshot(
                        collection, prior, projection_enabled=enabled,
                        projection_reason="Estimativa desativada pela operação.",
                    )
                    projection = result["projection"]
                    self.assertTrue(projection["available"])
                    self.assertEqual(projection["model"], "official_final")
                    self.assertFalse(projection["experimental"])
                    self.assertEqual(projection["votes"], national["votes"])
                    self.assertEqual(result["coverage"]["units_received"], 2 if partial else 3)
                    self.assertIn("Resultado final oficial", projection["reason"])

    def test_unfinished_result_remains_blocked(self):
        for enabled in (False, True):
            with self.subTest(enabled=enabled):
                collection, prior = fixture(STAMP)
                collection["units"][0]["result"] = None
                collection["projection_block_reason"] = BLOCK_REASON
                result = self.snapshot(collection, prior, projection_enabled=enabled)
                self.assertFalse(result["projection"]["available"])
                self.assertIsNone(result["projection"]["votes"])
                expected = BLOCK_REASON if enabled else "Projeção desativada temporariamente"
                self.assertIn(expected, result["projection"]["reason"])
                self.assertEqual(result["candidates"][0]["votes"], 320)

    def test_blocked_final_still_requires_eligible_national_votes(self):
        for invalid in ("judicial", "incompatible"):
            for enabled in (False, True):
                with self.subTest(invalid=invalid, enabled=enabled):
                    collection, prior = fixture(STAMP)
                    national = collection["national"]
                    national.update(official_final=True, sections_counted=30)
                    collection["projection_block_reason"] = BLOCK_REASON
                    collection["units"][0]["result"] = None
                    if invalid == "judicial":
                        national["sub_judice_votes"] = 320
                        national["candidates"][0]["validity"] = "Anulado sub judice"
                    else:
                        national["valid_votes"] = 599
                    result = self.snapshot(collection, prior, projection_enabled=enabled)
                    self.assertFalse(result["projection"]["available"])
                    self.assertIsNone(result["projection"]["votes"])
                    self.assertIn("oficiais permanecem", result["projection"]["reason"])
                    self.assertEqual(result["candidates"][0]["votes"], 320)


if __name__ == "__main__":
    unittest.main()
