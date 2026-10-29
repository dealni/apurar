/** Transporte JSON público: timeout, limite de tamanho e Retry-After. */
export function createJsonTransport({ readBase }) {
  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  const fetchJson = async (
    path,
    { ms: timeout = 10_000, cache = 'no-cache' } = {},
  ) => {
    const controller =
      typeof AbortController === 'function' ? new AbortController() : null;
    const timer = setTimeout(() => controller?.abort(), timeout);
    try {
      const response = await fetch(readBase() + path, {
        cache,
        credentials: 'omit',
        mode: 'cors',
        signal: controller?.signal,
        headers: {
          Accept: 'application/json',
        },
      });
      if (response.status === 429 || response.status === 503) {
        const seconds = parseFloat(response.headers.get('Retry-After'));
        const error = new Error('ocupado ' + response.status);
        error.retry = isFinite(seconds)
          ? clamp(seconds * 1000, 1000, 300_000)
          : 0;
        throw error;
      }
      if (!response.ok) throw new Error('HTTP ' + response.status);
      const text = await response.text();
      if (text.length > 6_000_000) throw new Error('arquivo grande demais');
      return JSON.parse(text);
    } catch (error) {
      throw error?.name === 'AbortError' ? new Error('tempo esgotado') : error;
    } finally {
      clearTimeout(timer);
    }
  };
  return {
    fetchJson,
  };
}
