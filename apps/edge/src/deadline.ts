export const cacheReadTimeoutMs = 250;
export const cacheWriteTimeoutMs = 1_000;
export const feedLoadTimeoutMs = 8_000;
export const healthLoadTimeoutMs = 1_000;
export class LoadDeadlineExceeded extends Error {}

// Cada invocação possui seu timer e sinal; nunca compartilhe a promessa entre requests.
// O sinal impede efeitos tardios; bindings sem cancelamento podem concluir depois.
export async function withDeadline<T>(
  load: (signal: AbortSignal) => Promise<T>,
  timeoutMs: number,
): Promise<T> {
  const controller = new AbortController();
  let timer!: ReturnType<typeof setTimeout>;
  const deadline = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      const cause = new LoadDeadlineExceeded("Tempo de leitura excedido.");
      controller.abort(cause);
      reject(cause);
    }, timeoutMs);
  });
  try {
    return await Promise.race([
      Promise.resolve().then(() => load(controller.signal)),
      deadline,
    ]);
  } finally {
    clearTimeout(timer);
  }
}
