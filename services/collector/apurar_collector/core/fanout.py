"""Janela de consultas limitada, sem esperar o item mais lento de cada lote."""

from concurrent.futures import FIRST_COMPLETED, ThreadPoolExecutor, wait


def fetch_window(items, fetch, stopped, workers):
    """Entrega concluídos e só repõe vagas após o consumidor tratar respostas.

    Nenhum item fica aguardando na fila interna do executor. Ao interromper,
    consultas já iniciadas terminam e são entregues, sem iniciar outras.
    """
    remaining = iter(items)
    with ThreadPoolExecutor(max_workers=workers) as executor:
        running = set()
        exhausted = False
        while running or not exhausted:
            while len(running) < workers and not exhausted and not stopped():
                try:
                    item = next(remaining)
                except StopIteration:
                    exhausted = True
                    break
                running.add(executor.submit(fetch, item))
            if not running:
                return
            completed, running = wait(running, return_when=FIRST_COMPLETED)
            # Consome todos os concluídos antes de repor: bloqueio vale de imediato.
            for future in completed:
                yield future.result()
