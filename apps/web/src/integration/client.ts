import { SupplementalFeed } from "./supplemental-client";
import { officialExterior, type ExteriorPlace } from "./exterior-view";
import {
  collectionStatus,
  type CollectorHealth,
} from "../../../../packages/contracts/health";
import { timing, milliseconds } from "../../../../packages/contracts/timing";
import { createPolling } from "./polling";
import { type Snapshot } from "../../../../packages/contracts/snapshot";
import {
  parseMunicipalities,
  parseHistory,
  type Municipality,
  type HistoryPoint,
} from "../feeds";
import { requestBundle } from "./bundle";
import { municipalDetails } from "./municipal-totals";
import { historyAtMinute } from "./history-selection";
import {
  adaptSnapshot,
  adaptHistory,
  candidateMetadata,
  minuteOf,
  municipalIndex,
  resultRow,
  type Candidate,
  type Place,
} from "./adapter";
type Options = {
  places: Place[];
  states: string[];
  candidates: Candidate[];
  exteriorCount?: number;
  exteriorPlaces?: ExteriorPlace[];
};
type Callback = (value: unknown) => void;
export function createApurarFeed(options: Options) {
  let original: Snapshot | null = null;
  let snapshot: ReturnType<typeof adaptSnapshot> | null = null;
  let townRows: (Municipality | undefined)[] = [];
  let rows: Municipality[] = [],
    history: HistoryPoint[] = [];
  let loading = false;
  let controller: AbortController | null = null;
  let cached: Awaited<ReturnType<typeof requestBundle>> | null = null;
  let offSupplemental: (() => void) | undefined;
  const callbacks = new Map<string, Set<Callback>>(),
    last = new Map<string, unknown>();
  const status = {
    estado: "conectando",
    ultimo: 0,
    mudou: 0,
    t: null as number | null,
    falhas: 0,
    motivo: "",
    health: null as CollectorHealth | null,
    aviso: "",
  };
  const emit = (event: string, value: unknown) => {
    last.set(event, value);
    callbacks.get(event)?.forEach((callback) => {
      try {
        callback(value);
      } catch (error) {
        console.error("[Apurar]", error);
      }
    });
  };
  const notify = () => emit("status", { ...status });
  async function request(path: string, signal: AbortSignal) {
    const response = await fetch(path, {
      cache: "no-cache",
      signal: AbortSignal.any([
        signal,
        AbortSignal.timeout(milliseconds(timing.requestTimeoutSeconds)),
      ]),
    });
    if (!response.ok)
      throw new Error(`Dados indisponíveis (${response.status}).`);
    return response.json();
  }
  function apply(value: Snapshot) {
    original = value;
    townRows = municipalIndex(rows, options.places);
    options.candidates.splice(
      0,
      options.candidates.length,
      ...candidateMetadata(value),
    );
    snapshot = adaptSnapshot(
      value,
      rows,
      options.places,
      options.states,
      options.exteriorCount,
    );
    snapshot = officialExterior(
      snapshot,
      SupplementalFeed.get().payload,
      options.exteriorPlaces ?? [],
      value.candidates.map((candidate) => candidate.id),
    );
    status.mudou = Date.parse(value.source.as_of);
    status.ultimo = Date.now();
    status.t = snapshot.t;
    status.estado = collectionStatus(value, status.health).warning
      ? "parado"
      : "ao-vivo";
    status.falhas = 0;
    status.motivo = "";
    emit("snap", snapshot);
    notify();
  }
  async function refresh() {
    if (loading) return;
    loading = true;
    const pending = new AbortController();
    controller = pending;
    try {
      const bundle = await requestBundle(
        (path) => request(path, pending.signal),
        original,
        cached,
      );
      if (pending.signal.aborted) return;
      const value = bundle.snapshot;
      status.health = bundle.health;
      if (bundle && value === original) {
        cached = bundle;
        status.ultimo = Date.now();
        status.falhas = 0;
        status.motivo = "";
        status.estado = collectionStatus(value, status.health).warning
          ? "parado"
          : "ao-vivo";
        notify();
        return;
      }
      // Trocar o lote somente após validar todos os detalhes: falhas preservam a geração anterior.
      const nextRows = parseMunicipalities(bundle.municipalities, value);
      const nextHistory = parseHistory(bundle.history, value);
      rows = nextRows;
      history = nextHistory;
      cached = bundle;
      apply(value);
      emit("history", adaptHistory(history, value));
      emit("detail", null);
    } catch (error) {
      if (pending.signal.aborted) return;
      status.falhas++;
      status.estado =
        typeof navigator !== "undefined" && navigator.onLine === false
          ? "sem-conexao"
          : original
            ? "reconectando"
            : "conectando";
      status.motivo =
        error instanceof Error ? error.message : "Falha ao atualizar dados.";
      notify();
    } finally {
      loading = false;
    }
  }
  const polling = createPolling(refresh);
  function empty() {
    return {
      t: 1020,
      at: 1020,
      seq: "aguardando",
      gerado: 0,
      nat: resultRow(
        { counted: 0, total: 0 },
        [0, 0],
        "BR",
        "Brasil",
        {},
        false,
      ),
      uf: Object.fromEntries(
        options.states.map((uf) => [
          uf,
          resultRow({ counted: 0, total: 0 }, [0, 0], uf, uf, {}, false),
        ]),
      ),
      muni: new Float32Array(options.places.length * 4),
      zz: new Float32Array((options.exteriorCount ?? 0) * 4),
      live: true,
      empty: true,
      towns: false,
      proj: null,
    };
  }
  function town(index: number) {
    const row = townRows[index];
    if (!row?.available || !original) return null;
    const votes = original.candidates.map(
      (c) => row.candidates.find((v) => v.id === c.id)?.votes ?? 0,
    );
    return municipalDetails(
      row,
      votes,
      original.candidates.map((c) => c.id),
    );
  }
  let loadedReplay: HistoryPoint | null = null;
  return {
    LIVE: true,
    STRIDE: 4,
    CFG:
      typeof window !== "undefined"
        ? (window as Window & { APURACAO?: Record<string, unknown> }).APURACAO
        : {},
    minuteOf,
    on(event: string, callback: Callback) {
      if (!callbacks.has(event)) callbacks.set(event, new Set());
      callbacks.get(event)!.add(callback);
      if (last.has(event))
        queueMicrotask(
          () =>
            callbacks.get(event)?.has(callback) && callback(last.get(event)),
        );
      return () => callbacks.get(event)?.delete(callback);
    },
    start() {
      if (!offSupplemental)
        offSupplemental = SupplementalFeed.subscribe(() => {
          if (!original || !snapshot) return;
          snapshot = officialExterior(
            snapshot,
            SupplementalFeed.get().payload,
            options.exteriorPlaces ?? [],
            original.candidates.map((candidate) => candidate.id),
          );
          emit("snap", snapshot);
          emit("detail", null);
        });
      polling.start();
    },
    stop() {
      polling.stop();
      controller?.abort();
      offSupplemental?.();
      offSupplemental = undefined;
    },
    refresh,
    empty,
    sourceSnapshot: () => original,
    exportContext(_viewTime?: number, replay = false) {
      // O recorte exibido permanece congelado mesmo se chegar revisão do mesmo minuto.
      const point = replay ? loadedReplay : null;
      return {
        mode: original?.mode ?? "live",
        as_of: replay
          ? (point?.as_of ?? null)
          : (original?.source.as_of ?? null),
        replay,
        available: !!original && (!replay || !!point),
      };
    },
    status: () => ({ ...status }),
    peek: () => snapshot,
    every: (value: number) => value,
    over: () =>
      !!original &&
      original.sections.total > 0 &&
      original.sections.counted === original.sections.total,
    // A navegação visual tem precisão de minuto; revisões no minuto usam a última versão.
    minutes: async () =>
      [
        ...new Set(
          history.map((point) => Math.floor(minuteOf(Date.parse(point.as_of)))),
        ),
      ].sort((a, b) => a - b),
    load: async (minute: number) => {
      if (!original) return null;
      const point = historyAtMinute(history, minute);
      loadedReplay = point;
      if (!point) return null;
      return adaptSnapshot(
        {
          schema_version: original.schema_version,
          election: original.election,
          mode: original.mode,
          published_at: original.published_at,
          snapshot_id: point.snapshot_id,
          source: { ...original.source, as_of: point.as_of },
          sections: point.sections,
          candidates: original.candidates.map(
            ({ validity: _currentValidity, ...identity }) => {
              const observed = point.candidates.find(
                (candidate) => candidate.id === identity.id,
              );
              return {
                ...identity,
                votes: observed?.votes ?? 0,
                ...(observed?.validity !== undefined
                  ? { validity: observed.validity }
                  : {}),
              };
            },
          ),
          projection: point.projection ?? {
            available: false,
            model: "none",
            reason: "Sem projeção histórica.",
            shares: null,
          },
        },
        [],
        options.places,
        options.states,
        options.exteriorCount,
      );
    },
    town,
    city: () => null,
    cand: () => null,
    candOff: () => true,
    comp: () => null,
    compOff: () => true,
    zones: () => false,
    json: async () => {
      throw new Error("Detalhe não disponibilizado pela fonte Apurar.");
    },
    diag: () => ({
      source: "/api/manifest",
      snapshot: original?.snapshot_id,
      mode: original?.mode,
    }),
  };
}
