import {
  parseSupplemental,
  type SupplementalPayload,
} from "./supplemental-data";
import { createPolling } from "./polling";
import { timing, milliseconds } from "../../../../packages/contracts/timing";
export interface SupplementalState {
  payload: SupplementalPayload | null;
  loading: boolean;
  error: string;
}
function futurePayload(payload: SupplementalPayload, now: number) {
  const rows = [
    ...payload.governors,
    ...(payload.governor_municipalities ?? []),
    ...payload.exterior.cities,
    ...payload.exterior.countries,
    ...payload.zones,
  ];
  return (
    Date.parse(payload.updated_at) > now + 60000 ||
    rows.some((row) =>
      [row.as_of, row.generated_at].some(
        (stamp) => stamp !== null && Date.parse(stamp) > now + 60000,
      ),
    )
  );
}
function olderPayload(
  previous: SupplementalPayload | null,
  incoming: SupplementalPayload,
  now: number,
) {
  return (
    previous &&
    !futurePayload(previous, now) &&
    Date.parse(incoming.updated_at) < Date.parse(previous.updated_at)
  );
}
function assertCurrentClock(payload: SupplementalPayload, now: number) {
  if (futurePayload(payload, now))
    throw new Error("Detalhamento oficial com horário futuro.");
}
function currentEtag(
  etag: string | null,
  payload: SupplementalPayload | null,
  now: number,
) {
  return payload && futurePayload(payload, now) ? null : etag;
}
export function createSupplementalClient(
  request: typeof fetch = globalThis.fetch.bind(globalThis),
  clock: () => number = Date.now,
) {
  let state: SupplementalState = { payload: null, loading: true, error: "" };
  let controller: AbortController | null = null;
  let busy = false;
  let etag: string | null = null;
  const listeners = new Set<(state: SupplementalState) => void>();
  const notify = () => listeners.forEach((listener) => listener({ ...state }));
  async function refresh() {
    if (busy) return;
    busy = true;
    const pending = new AbortController();
    controller = pending;
    try {
      etag = currentEtag(etag, state.payload, clock());
      const response = await request("/api/supplemental", {
        cache: "no-cache",
        ...(etag ? { headers: { "If-None-Match": etag } } : {}),
        signal: AbortSignal.any([
          pending.signal,
          AbortSignal.timeout(milliseconds(timing.requestTimeoutSeconds)),
        ]),
      });
      if (pending.signal.aborted) return;
      if (response.status === 304 && state.payload) {
        assertCurrentClock(state.payload, clock());
        state = { ...state, loading: false, error: "" };
        return;
      }
      if (!response.ok)
        throw new Error(
          `Detalhamento oficial indisponível (${response.status}).`,
        );
      const payload = parseSupplemental(await response.json());
      const now = clock();
      assertCurrentClock(payload, now);
      if (olderPayload(state.payload, payload, now))
        throw new Error(
          "Detalhamento anterior à última atualização válida; aguardando sincronização.",
        );
      if (pending.signal.aborted) return;
      etag = response.headers.get("ETag");
      state = {
        payload,
        loading: false,
        error: "",
      };
    } catch (error) {
      if (!pending.signal.aborted)
        state = {
          ...state,
          loading: false,
          error:
            error instanceof Error
              ? error.message
              : "Falha no detalhamento oficial.",
        };
    } finally {
      busy = false;
      if (!pending.signal.aborted) notify();
    }
  }
  const polling = createPolling(refresh);
  return {
    get: () => ({ ...state }),
    refresh,
    subscribe(listener: (value: SupplementalState) => void) {
      listeners.add(listener);
      listener({ ...state });
      return () => listeners.delete(listener);
    },
    start: polling.start,
    stop() {
      polling.stop();
      controller?.abort();
    },
  };
}
export const SupplementalFeed = createSupplementalClient();
