"""Agregação de bairro exige identidade, pleito e atribuição territorial válidos."""
import unittest
from apurar_collector.neighborhoods import aggregate_neighborhoods

SOURCE = "https://cdn.tse.jus.br/estatistica/sead/odsele/exemplo.zip"


def catalog(section="1", name="CENTRO", principal="0"):
    return {"AA_ELEICAO": "2026", "NR_TURNO": "2", "DT_ELEICAO": "25/10/2026",
        "SG_UF": "AC", "CD_MUNICIPIO": "1120", "NR_ZONA": "1", "NR_SECAO": section,
        "NM_MUNICIPIO": "CIDADE TESTE", "NM_BAIRRO": name, "NR_SECAO_PRINCIPAL": principal}


def votes(section="1", count="10"):
    return {**catalog(section), "ANO_ELEICAO": "2026", "CD_ELEICAO": "6258", "CD_CARGO": "1",
        "NR_VOTAVEL": "13", "QT_VOTOS": count, "DT_GERACAO": "26/10/2026", "HH_GERACAO": "00:01:00"}


def aggregate(catalog_rows, vote_rows):
    return aggregate_neighborhoods(catalog_rows, vote_rows, catalog_source=SOURCE, votes_source=SOURCE)


class NeighborhoodTests(unittest.TestCase):
    def test_official_csv_join_preserves_zero_and_deduplicates(self):
        result = aggregate([catalog()], [votes(count="0"), votes(count="0")])
        self.assertFalse(result["live_supported"])
        self.assertEqual(result["mode"], "archive")
        self.assertEqual(result["items"][0]["votes"], {"13": 0})
        self.assertEqual(result["items"][0]["sections"], 1)

    def test_missing_and_ambiguous_neighborhood_are_not_fabricated(self):
        result = aggregate([catalog(), catalog("2", "OUTRO", "1")], [votes(), votes("3")])
        self.assertEqual(result["items"], [])
        self.assertTrue(result["coverage"]["partial"])
        self.assertEqual(result["coverage"]["ambiguous_principal_sections"], 1)
        self.assertEqual(result["coverage"]["sections_without_neighborhood"], 1)

    def test_aggregation_and_duplicate_conflicts(self):
        with self.assertRaises(ValueError):
            aggregate([catalog()], [votes(), votes(count="20")])
        with self.assertRaises(ValueError):
            aggregate([catalog(), catalog("2", principal="1")], [votes("2")])

    def test_wrong_turn_and_pleito(self):
        result = aggregate([catalog()], [{**votes(), "NR_TURNO": "1"}])
        self.assertEqual(result["items"], [])
        with self.assertRaises(ValueError):
            aggregate([catalog()], [{**votes(), "CD_ELEICAO": "6257"}])
        with self.assertRaises(ValueError):
            aggregate_neighborhoods([], [], catalog_source="https://exemplo.com/a", votes_source=SOURCE)
