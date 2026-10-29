"""Contratos e parâmetros comuns; valores fixados antes da avaliação histórica."""

import json
from pathlib import Path
from types import MappingProxyType

TIMING = MappingProxyType(json.loads(
    (Path(__file__).resolve().parents[2] / "resources" / "timing.json").read_text()
))

FIRST_ELECTION = "6257"
RUNOFF_ELECTION = "6258"
DEFAULT_ELECTION = RUNOFF_ELECTION
ELECTION_ROUNDS = MappingProxyType({FIRST_ELECTION: 1, RUNOFF_ELECTION: 2})
TSE_ORIGIN = "https://resultados.tse.jus.br"
TSE_YEAR = 2026
DOCUMENTATION_URL = "https://www.tse.jus.br/eleicoes/informacoes-tecnicas-sobre-a-divulgacao-de-resultados"

MODEL_LOCAL_SECTIONS = 20
MODEL_NATIONAL_SECTIONS = 1000
MODEL_STATE_SECTIONS = 500
MODEL_PSEUDOCOUNT = 0.5
RUNOFF_SCHEMA = "runoff-prior-v1"
RUNOFF_MANIFEST_SCHEMA = 1
RUNOFF_LOCAL_REGULARIZATION_VOTES = 5000
RUNOFF_STATE_REGULARIZATION_VOTES = 50000
RUNOFF_MAX_HISTORICAL_DELTA = 0.03
RUNOFF_HISTORICAL_WEIGHT = 0.5

TSE_OFFICIAL_REQUESTS_PER_SECOND = 100
TSE_REQUESTS_PER_SECOND = 70
TSE_BACKOFF_SECONDS = TIMING["blockSeconds"]
TSE_MISSING_SECONDS = TIMING["missingSeconds"]
TRACKING_SWEEP_SECONDS = TIMING["trackingSweepSeconds"]
COLLECTOR_WORKERS = 8
COLLECTOR_BATCH_SIZE = 256
COLLECTOR_MAX_BATCH_SIZE = 512
COLLECTOR_BATCH_ADMISSION_SECONDS = 8
POLL_COLLECTING_SECONDS = TIMING["collectingSeconds"]
POLL_LIVE_SECONDS = TIMING["liveSeconds"]
POLL_FINISHED_SECONDS = TIMING["finishedSeconds"]
DETAIL_CACHE_SECONDS = 300
DETAIL_WORKERS = 4


def election_round(election):
    election = str(election)
    if election not in ELECTION_ROUNDS:
        raise ValueError("Eleição presidencial 2026 não permitida")
    return ELECTION_ROUNDS[election]
