/*
 * Feed preservado: events.
 * Dependências explícitas; a fábrica mantém apenas o estado desta responsabilidade.
 */
export function createEvents() {
  const listeners = {
    snap: new Set(),
    status: new Set(),
    detail: new Set(),
    history: new Set(),
  };
  const lastEvents = {};
  const notifySafely = (p, L) => {
    try {
      p(L);
    } catch (Q) {
      console.error('[feed]', Q);
    }
  };
  const emit = (p, L) => {
    ((p === 'snap' || p === 'history') && (lastEvents[p] = L),
      listeners[p].forEach((Q) => notifySafely(Q, L)));
  };
  const subscribe = (p, L) => {
    if ((listeners[p].add(L), p in lastEvents)) {
      const Q = lastEvents[p];
      queueMicrotask(() => {
        listeners[p].has(L) && notifySafely(L, Q);
      });
    }
    return () => listeners[p].delete(L);
  };
  return {
    emit,
    subscribe,
  };
}
