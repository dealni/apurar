import { afterEach, expect, it, vi } from "vitest";
import { createApurarFeed } from "./client";
import { requestBundle } from "./bundle";
import { demo } from "../demo";

function fixture(id = "live-one") {
  const time = "2026-10-24T10:00:00Z";
  const snapshot = {
    ...demo,
    snapshot_id: id,
    mode: "live",
    source: { ...demo.source, as_of: time, collected_at: time },
    published_at: time,
  };
  const urls = {
    snapshots: `/api/snapshots/${"1".repeat(64)}`,
    municipalities: `/api/municipalities/${"2".repeat(64)}`,
    history: `/api/history/${"3".repeat(64)}`,
  };
  const documents: Record<string, unknown> = {
    "/api/manifest": { schema_version: 1, snapshot_id: id, ...urls },
    [urls.snapshots]: snapshot,
    [urls.municipalities]: {
      schema_version: 1,
      snapshot_id: id,
      election: "6258",
      items: [],
    },
    [urls.history]: {
      schema_version: 1,
      snapshot_id: id,
      election: "6258",
      points: [],
    },
  };
  return { documents, urls, snapshot };
}
afterEach(() => vi.unstubAllGlobals());
it("carrega somente os três objetos imutáveis da geração selecionada", async () => {
  const { documents, snapshot } = fixture();
  const request = vi.fn(async (path: string) => documents[path]);
  const result = await requestBundle(request);
  expect(result.snapshot.snapshot_id).toBe(snapshot.snapshot_id);
  expect(request.mock.calls.map(([path]) => path)).toEqual(
    Object.keys(documents),
  );
});
it("recusa referências externas ou gerações incompatíveis sem relaxar snapshot_id", async () => {
  const { documents, urls } = fixture();
  const request = async (path: string) => documents[path];
  documents[urls.history] = { snapshot_id: "another" };
  await expect(requestBundle(request)).rejects.toThrow("sincronização");
  documents["/api/manifest"] = {
    schema_version: 1,
    snapshot_id: "live-one",
    ...urls,
    history: "https://example.com/private",
  };
  await expect(requestBundle(request)).rejects.toThrow("Referência imutável");
});
it("preserva integralmente o lote anterior se qualquer parte da nova geração falhar", async () => {
  let current = fixture();
  vi.stubGlobal(
    "fetch",
    vi.fn(async (path: string) => Response.json(current.documents[path])),
  );
  const feed = createApurarFeed({ places: [], states: [], candidates: [] });
  await feed.refresh();
  const previous = feed.peek();
  expect(feed.sourceSnapshot()?.snapshot_id).toBe("live-one");
  current = fixture("live-two");
  current.documents[current.urls.history] = { snapshot_id: "live-one" };
  await feed.refresh();
  expect(feed.sourceSnapshot()?.snapshot_id).toBe("live-one");
  expect(feed.peek()).toBe(previous);
  expect(feed.status().estado).toBe("reconectando");
  current = fixture("live-two");
  await feed.refresh();
  expect(feed.sourceSnapshot()?.snapshot_id).toBe("live-two");
});
it("exporta data real anterior à eleição e não inventa metadados de replay ausente", async () => {
  const { documents, snapshot } = fixture();
  vi.stubGlobal(
    "fetch",
    vi.fn(async (path: string) => Response.json(documents[path])),
  );
  const feed = createApurarFeed({ places: [], states: [], candidates: [] });
  await feed.refresh();
  expect(feed.exportContext()).toEqual({
    mode: "live",
    as_of: snapshot.source.as_of,
    replay: false,
    available: true,
  });
  expect(feed.exportContext(1020, true)).toMatchObject({
    as_of: null,
    replay: true,
    available: false,
  });
});
it("não esvazia detalhes enquanto a próxima geração ainda está carregando", async () => {
  let current = fixture();
  let release: (() => void) | undefined;
  let pending: Promise<void> | undefined;
  vi.stubGlobal(
    "fetch",
    vi.fn(async (path: string) => {
      if (pending && path === current.urls.municipalities) await pending;
      return Response.json(current.documents[path]);
    }),
  );
  const feed = createApurarFeed({ places: [], states: [], candidates: [] });
  await feed.refresh();
  const previous = feed.peek();
  current = fixture("next");
  pending = new Promise<void>((resolve) => {
    release = resolve;
  });
  const updating = feed.refresh();
  await vi.waitFor(() => expect(release).toBeTypeOf("function"));
  expect(feed.peek()).toBe(previous);
  expect(feed.sourceSnapshot()?.snapshot_id).toBe("live-one");
  release!();
  await updating;
  expect(feed.sourceSnapshot()?.snapshot_id).toBe("next");
});
it("recusa publicação antiga mas aceita correção com votos menores publicada depois", async () => {
  let current = fixture("newer");
  current.snapshot.published_at = "2026-10-24T10:10:00Z";
  vi.stubGlobal(
    "fetch",
    vi.fn(async (path: string) => Response.json(current.documents[path])),
  );
  const feed = createApurarFeed({ places: [], states: [], candidates: [] });
  await feed.refresh();
  const previous = feed.peek();
  current = fixture("older");
  await feed.refresh();
  expect(feed.sourceSnapshot()?.snapshot_id).toBe("newer");
  expect(feed.peek()).toBe(previous);
  expect(feed.status().motivo).toContain("Publicação anterior");
  current = fixture("correction");
  current.snapshot.published_at = "2026-10-24T10:11:00Z";
  current.snapshot.candidates = current.snapshot.candidates.map(
    (candidate) => ({ ...candidate, votes: candidate.votes - 100 }),
  );
  await feed.refresh();
  expect(feed.sourceSnapshot()?.snapshot_id).toBe("correction");
  expect(feed.sourceSnapshot()?.candidates[0]?.votes).toBe(
    demo.candidates[0]!.votes - 100,
  );
});
it("helper comum aos dois consumidores rejeita geração publicada antes da aceita", async () => {
  const current = fixture("previous");
  const previous = await requestBundle(async (path) => current.documents[path]);
  const older = fixture("cache-old");
  older.snapshot.published_at = "2026-10-24T09:59:59Z";
  older.snapshot.source = {
    ...older.snapshot.source,
    as_of: "2026-10-24T09:59:59Z",
    collected_at: "2026-10-24T09:59:59Z",
  };
  await expect(
    requestBundle(async (path) => older.documents[path], previous.snapshot),
  ).rejects.toThrow("Publicação anterior");
});
it("atualiza totais e destinos municipais após a troca de geração", async () => {
  let current = fixture();
  const municipality = (electorate: number, valid: number) => ({
    available: true,
    scope: "municipality",
    unit_id: "AC:01120",
    uf: "AC",
    name: "Acrelândia",
    as_of: current.snapshot.source.as_of,
    sections: { counted: 1, total: 10 },
    candidates: [
      { id: "01", votes: 20, validity: "Anulado sub judice" },
      { id: "02", votes: 10, validity: "Válido" },
    ],
    totals: {
      electorate,
      electorate_totalized: 50,
      electorate_installed: 40,
      turnout: 30,
      abstention: 10,
      valid,
      computed: 30,
      blank: 0,
      null: 0,
      annulled: 0,
      sub_judice: 20,
      total: 30,
    },
  });
  const update = (electorate: number, valid: number) => {
    current.documents[current.urls.municipalities] = {
      schema_version: 1,
      election: "6258",
      snapshot_id: current.snapshot.snapshot_id,
      items: [municipality(electorate, valid)],
    };
  };
  vi.stubGlobal(
    "fetch",
    vi.fn(async (path: string) => Response.json(current.documents[path])),
  );
  const feed = createApurarFeed({
    places: [{ id: "1200013", uf: "AC", name: "Acrelândia" }],
    states: ["AC"],
    candidates: [],
  });
  update(10208, 10);
  await feed.refresh();
  expect(feed.town(0)).toMatchObject({
    eleitorado: 10208,
    validos: 10,
    base: 30,
    computados: 30,
    apurado: 40,
    destinacoes: ["Anulado sub judice", "Válido"],
  });
  current = fixture("live-two");
  update(11000, 0);
  await feed.refresh();
  expect(feed.town(0)).toMatchObject({
    eleitorado: 11000,
    validos: 0,
    base: 30,
    computados: 30,
  });
});

it("reutiliza lote validado e atualiza saúde sem baixar detalhes ou renderizar novamente", async () => {
  const { documents } = fixture();
  const request = vi.fn(async (path: string) => Response.json(documents[path]));
  vi.stubGlobal("fetch", request);
  const feed = createApurarFeed({ places: [], states: [], candidates: [] });
  await feed.refresh();
  const previous = feed.peek();
  const snap = vi.fn();
  feed.on("snap", snap);
  await Promise.resolve();
  snap.mockClear();
  request.mockClear();
  (documents["/api/manifest"] as Record<string, unknown>).health = {
    schema_version: 1,
    election: "6258",
    checked_at: new Date().toISOString(),
    last_success_at: new Date().toISOString(),
    status: "live",
    cycle_seconds: 1,
    pending_units: 0,
  };
  await feed.refresh();
  expect(request.mock.calls.map(([path]) => path)).toEqual(["/api/manifest"]);
  expect(feed.peek()).toBe(previous);
  expect(snap).not.toHaveBeenCalled();
  expect(feed.status().health?.status).toBe("live");
});

it("cancela o lote pendente ao parar e retoma sem aplicar a resposta cancelada", async () => {
  let current = fixture();
  let release!: () => void;
  let delayed: Promise<void> | undefined;
  const signals: AbortSignal[] = [];
  vi.stubGlobal(
    "fetch",
    vi.fn(async (path: string, init: RequestInit) => {
      signals.push(init.signal as AbortSignal);
      const body = current.documents[path];
      if (delayed && path === current.urls.history) await delayed;
      return Response.json(body);
    }),
  );
  const feed = createApurarFeed({ places: [], states: [], candidates: [] });
  await feed.refresh();
  const previous = feed.peek();
  current = fixture("canceled");
  delayed = new Promise<void>((resolve) => {
    release = resolve;
  });
  const updating = feed.refresh();
  await vi.waitFor(() => expect(signals).toHaveLength(8));
  feed.stop();
  expect(signals.slice(4).every((signal) => signal.aborted)).toBe(true);
  release();
  await updating;
  expect(feed.peek()).toBe(previous);
  expect(feed.status().falhas).toBe(0);
  delayed = undefined;
  current = fixture("resumed");
  await feed.refresh();
  expect(feed.sourceSnapshot()?.snapshot_id).toBe("resumed");
});
