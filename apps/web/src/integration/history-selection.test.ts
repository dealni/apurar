import { expect, it, vi, afterEach } from "vitest";
import { historyAtMinute } from "./history-selection";
import { createApurarFeed } from "./client";
import { demo } from "../demo";
import { minuteOf } from "./adapter";
import type { HistoryPoint } from "../feeds";

const point = (as_of: string, id = as_of): HistoryPoint => ({
  as_of,
  snapshot_id: id,
  sections: { counted: 1, total: 100 },
  candidates: demo.candidates.map(({ id }, index) => ({
    id,
    votes: index + 10,
  })),
});
const first = point("2026-10-25T20:00:15Z");
const revised = point("2026-10-25T20:00:50Z", "revision");
const next = point("2026-10-25T20:04:00Z");
const minute = (iso: string) => minuteOf(Date.parse(iso));
afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

it("lacunas usam a última observação anterior e nunca a seguinte", () => {
  const history = [next, first, revised];
  expect(historyAtMinute(history, minute("2026-10-25T20:02:00Z"))).toBe(
    revised,
  );
  expect(historyAtMinute(history, minute("2026-10-25T19:59:00Z"))).toBeNull();
  expect(historyAtMinute(history, NaN)).toBeNull();
});
it("revisões no mesmo minuto mantêm última fonte e seleção estável em 500 amostras", () => {
  const history = Array.from({ length: 500 }, (_, index) =>
    point(new Date(Date.parse(first.as_of) + index * 4 * 60000).toISOString()),
  );
  for (let offset = 0; offset < 4; offset++) {
    expect(historyAtMinute(history, minute(history[200]!.as_of) + offset)).toBe(
      history[200],
    );
  }
  expect(historyAtMinute([first, revised, next], minute(first.as_of))).toBe(
    revised,
  );
});
it("load e PNG compartilham data efetiva e ausência não vira snapshot ao vivo", async () => {
  vi.spyOn(Date, "now").mockReturnValue(Date.parse("2026-10-25T23:00:00Z"));
  const snapshot = { ...demo, snapshot_id: "replay-live", mode: "live" };
  const urls = {
    snapshots: `/api/snapshots/${"1".repeat(64)}`,
    municipalities: `/api/municipalities/${"2".repeat(64)}`,
    history: `/api/history/${"3".repeat(64)}`,
  };
  const docs: Record<string, unknown> = {
    "/api/manifest": {
      schema_version: 1,
      snapshot_id: snapshot.snapshot_id,
      ...urls,
    },
    [urls.snapshots]: snapshot,
    [urls.municipalities]: {
      schema_version: 1,
      election: "6258",
      snapshot_id: snapshot.snapshot_id,
      items: [],
    },
    [urls.history]: {
      schema_version: 1,
      election: "6258",
      snapshot_id: snapshot.snapshot_id,
      points: [first, revised, next],
    },
  };
  vi.stubGlobal("fetch", async (path: string) => Response.json(docs[path]));
  const feed = createApurarFeed({ places: [], states: [], candidates: [] });
  await feed.refresh();
  const requested = minute("2026-10-25T20:02:00Z");
  const selected = await feed.load(requested);
  expect(selected?.source.as_of).toBe(revised.as_of);
  expect(selected?.t).toBe(minute(revised.as_of));
  expect(feed.exportContext(requested, true)).toMatchObject({
    as_of: revised.as_of,
    replay: true,
    available: true,
  });
  expect(feed.exportContext(selected!.t, true).as_of).toBe(revised.as_of);
  // O polling recebe outra revisão no mesmo minuto enquanto o replay está congelado.
  const newer = {
    ...revised,
    snapshot_id: "revision-after-poll",
    as_of: "2026-10-25T20:00:59Z",
    candidates: revised.candidates.map((candidate) => ({
      ...candidate,
      votes: candidate.votes + 100,
    })),
  };
  const refreshed = {
    ...snapshot,
    snapshot_id: "live-two",
    published_at: "2026-10-25T21:01:00Z",
  };
  docs["/api/manifest"] = {
    schema_version: 1,
    snapshot_id: refreshed.snapshot_id,
    ...urls,
  };
  docs[urls.snapshots] = refreshed;
  docs[urls.municipalities] = {
    schema_version: 1,
    election: "6258",
    snapshot_id: refreshed.snapshot_id,
    items: [],
  };
  docs[urls.history] = {
    schema_version: 1,
    election: "6258",
    snapshot_id: refreshed.snapshot_id,
    points: [first, revised, newer, next],
  };
  await feed.refresh();
  expect(feed.sourceSnapshot()?.snapshot_id).toBe("live-two");
  expect(selected?.seq).toBe(revised.snapshot_id);
  expect(selected?.source.as_of).toBe(revised.as_of);
  expect(selected?.nat).toMatchObject({ base: 21 });
  // Topo usa minuto pedido e PNG usa selected.t: ambos precisam apontar ao mesmo recorte.
  expect(feed.exportContext(requested, true).as_of).toBe(revised.as_of);
  expect(feed.exportContext(selected!.t, true).as_of).toBe(revised.as_of);
  const reloaded = await feed.load(requested);
  expect(reloaded?.source.as_of).toBe(newer.as_of);
  expect(reloaded?.nat).toMatchObject({ base: 221 });
  expect(feed.exportContext(requested, true).as_of).toBe(newer.as_of);
  expect(await feed.load(minute("2026-10-25T19:59:00Z"))).toBeNull();
  expect(feed.peek()?.seq).toBe("live-two");
});

it("replay usa destinação histórica sem herdar a atual e conserva identidade", async () => {
  vi.spyOn(Date, "now").mockReturnValue(Date.parse("2026-10-25T23:00:00Z"));
  const snapshot = {
    ...demo,
    snapshot_id: "validity-current",
    mode: "live",
    candidates: demo.candidates.map((candidate) => ({
      ...candidate,
      validity: "Anulado",
    })),
  };
  const past = {
    ...first,
    candidates: first.candidates.map((candidate) => ({
      ...candidate,
      validity: "Válido",
    })),
  };
  const urls = {
    snapshots: `/api/snapshots/${"1".repeat(64)}`,
    municipalities: `/api/municipalities/${"2".repeat(64)}`,
    history: `/api/history/${"3".repeat(64)}`,
  };
  const documents: Record<string, unknown> = {
    "/api/manifest": {
      schema_version: 1,
      snapshot_id: snapshot.snapshot_id,
      ...urls,
    },
    [urls.snapshots]: snapshot,
    [urls.municipalities]: {
      schema_version: 1,
      election: "6258",
      snapshot_id: snapshot.snapshot_id,
      items: [],
    },
    [urls.history]: {
      schema_version: 1,
      election: "6258",
      snapshot_id: snapshot.snapshot_id,
      points: [past, next],
    },
  };
  vi.stubGlobal("fetch", async (path: string) =>
    Response.json(documents[path]),
  );
  const feed = createApurarFeed({ places: [], states: [], candidates: [] });
  await feed.refresh();
  const recorded = await feed.load(minute(past.as_of));
  expect(recorded?.pres[0]).toMatchObject({
    name: snapshot.candidates[0]!.name,
    partido: snapshot.candidates[0]!.party,
    validity: "Válido",
  });
  const legacy = await feed.load(minute(next.as_of));
  expect(legacy?.pres[0]).not.toHaveProperty("validity");
  expect(recorded?.nat.valid).toBeNull();
  expect(feed.sourceSnapshot()?.candidates[0]?.validity).toBe("Anulado");
});
