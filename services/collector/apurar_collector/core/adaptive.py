"""Ajusta trabalho por passagem sem alterar limites ou pausas da fonte."""

from .config import COLLECTOR_BATCH_ADMISSION_SECONDS, COLLECTOR_MAX_BATCH_SIZE


def next_batch_size(current, completed, elapsed, errors, unfinished, interrupted):
    """Só cresce com amostra útil; tempo inclui rate limit e respostas lentas.

    O prazo é de admissão: respostas já em voo terminam sob timeout da fonte.
    Uma interrupção/backoff nunca é interpretada como fonte rápida.
    """
    if interrupted:
        return current
    if errors or unfinished:
        return max(1, min(current, max(32, completed // 2)))
    if completed < 32 or elapsed < 0.25:
        return current
    capacity = completed / elapsed * COLLECTOR_BATCH_ADMISSION_SECONDS * 0.95
    if capacity < current:
        return max(32, int(capacity))
    # Crescimento limitado a 50% por passagem; lote curto (fila quase vazia)
    # não representa capacidade suficiente para aumentar o trabalho.
    if completed < current or capacity < current * 1.25:
        return current
    return min(COLLECTOR_MAX_BATCH_SIZE, int(current * 1.5), int(capacity))
