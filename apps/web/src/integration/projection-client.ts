import {
  collectionStatus,
  parseHealth,
  type CollectorHealth,
} from "../../../../packages/contracts/health";
import { timing, milliseconds } from "../../../../packages/contracts/timing";
import { createPolling } from "./polling";
import {
  parseSnapshot,
  type Snapshot,
} from "../../../../packages/contracts/snapshot";
import { validatePublication } from "./publication";

export interface ProjectionState {
  snapshot: Snapshot | null;
  loading: boolean;
  error: string;
  stale: boolean;
  health?: CollectorHealth | null;
}
interface ProjectionOptions {
  request?: typeof fetch;
  now?: () => number;
}

// Extensão independente: não interfere no Feed, no simulador ou nos controles originais.
export function createProjectionClient(options: ProjectionOptions = {}) {
  const request = options.request ?? globalThis.fetch.bind(globalThis);
  const now = options.now ?? Date.now;
  let state: ProjectionState = {
    snapshot: null,
    loading: true,
    error: "",
    stale: false,
  };
  const listeners = new Set<(value: ProjectionState) => void>();
  let busy = false;
  let controller: AbortController | null = null;
  function notify() {
    const value = { ...state };
    listeners.forEach((listener) => listener(value));
  }
  async function refresh() {
    if (busy) return;
    busy = true;
    const pending = new AbortController();
    controller = pending;
    try {
      const response = await request("/api/snapshot", {
        cache: "no-cache",
        signal: AbortSignal.any([
          pending.signal,
          AbortSignal.timeout(milliseconds(timing.requestTimeoutSeconds)),
        ]),
      });
      if (!response.ok)
        throw new Error(
          `Os resultados estão indisponíveis (${response.status}).`,
        );
      const snapshot = parseSnapshot(await response.json(), now());
      if (snapshot.mode !== "live")
        throw new Error("O painel recusou dados de demonstração.");
      if (pending.signal.aborted) return;
      validatePublication(snapshot, state.snapshot, now());
      let health: CollectorHealth | null = null;
      try {
        const healthResponse = await request("/api/manifest", {
          cache: "no-cache",
          signal: AbortSignal.any([
            pending.signal,
            AbortSignal.timeout(milliseconds(timing.requestTimeoutSeconds)),
          ]),
        });
        if (healthResponse.ok)
          health = parseHealth((await healthResponse.json()).health);
      } catch {
        /* Saúde não bloqueia o resultado. */
      }
      if (pending.signal.aborted) return;
      state = {
        health,
        snapshot,
        loading: false,
        error: "",
        stale: collectionStatus(snapshot, health, now()).warning,
      };
    } catch (error) {
      if (pending.signal.aborted) return;
      state = {
        ...state,
        loading: false,
        error:
          error instanceof Error
            ? error.message
            : "Falha ao consultar os resultados.",
        stale: state.snapshot
          ? collectionStatus(state.snapshot, state.health ?? null, now())
              .warning
          : false,
      };
    } finally {
      busy = false;
      if (!pending.signal.aborted) notify();
    }
  }
  const polling = createPolling(refresh);
  return {
    get: () => ({ ...state }),
    subscribe(listener: (value: ProjectionState) => void) {
      listeners.add(listener);
      listener({ ...state });
      return () => listeners.delete(listener);
    },
    refresh,
    start() {
      polling.start();
    },
    stop() {
      polling.stop();
      controller?.abort();
    },
  };
}
