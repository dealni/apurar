import { afterEach, expect, it, vi } from "vitest";
import type { HistoryPoint } from "../feeds";
import { createApurarFeed } from "./client";
import { minuteOf } from "./adapter";
import { historyAtMinute } from "./history-selection";
import {
  loadRealPresidentialReplay,
  loadRealPresidentialPublications,
} from "../../../../e2e/replay-real-fixture";

function captured() {
  return loadRealPresidentialReplay();
}

// Cada prefixo recorta observações capturadas, sem reconstruir lotes publicados.
async function replay(points: HistoryPoint[]) {
  const fixture = captured();
  const documents: Record<string, unknown> = {
    "/api/manifest": fixture.manifest,
    [fixture.manifest.snapshots]: fixture.snapshot,
    [fixture.manifest.history]: { ...fixture.history, points },
    [fixture.manifest.municipalities]: fixture.municipalities,
  };
  const request = vi.fn(async (path: string) => Response.json(documents[path]));
  vi.stubGlobal("fetch", request);
  const feed = createApurarFeed({
    places: [{ id: "1200013", name: "Acrelândia", uf: "AC" }],
    states: ["AC", "ZZ"],
    candidates: [],
    exteriorCount: 1,
  });
  await feed.refresh();
  return { feed, fixture, request };
}

afterEach(() => vi.unstubAllGlobals());

it("histórico real mantém as quatro revisões e seleciona a última no mesmo minuto", () => {
  const { history } = captured();
  expect(history.points).toHaveLength(4);
  expect(
    new Set(history.points.map((p: HistoryPoint) => p.snapshot_id)).size,
  ).toBe(4);
  expect(new Set(history.points.map((p: HistoryPoint) => p.as_of)).size).toBe(
    1,
  );
  const last = history.points.at(-1)!;
  const minute = minuteOf(Date.parse(last.as_of));
  expect(minute).toBeLessThan(0);
  expect(historyAtMinute(history.points, minute)).toBe(last);
  expect(historyAtMinute(history.points, Math.floor(minute) - 1)).toBeNull();
});

it("recortes reais preservam votos, seções, validade e suspensão/retomada da projeção", async () => {
  const { history } = captured();
  for (let length = 1; length <= history.points.length; length++) {
    const points = history.points.slice(0, length);
    const point = points.at(-1)!;
    const { feed, fixture } = await replay(points);
    const selected = await feed.load(minuteOf(Date.parse(point.as_of)));
    expect(selected?.seq).toBe(point.snapshot_id);
    expect(selected?.source.as_of).toBe(point.as_of);
    expect(selected?.gerado).toBe(Date.parse(point.as_of));
    expect(selected?.nat.cand).toEqual(point.candidates.map((c) => c.votes));
    expect(selected?.nat.secDone).toBe(point.sections.counted);
    expect(selected?.nat.sections).toBe(point.sections.total);
    expect(selected?.nat.valid).toBeNull();
    expect(selected?.projection).toEqual(point.projection);
    expect(selected?.proj !== null).toBe(point.projection?.available);
    expect(selected?.pres.map((c) => c.name)).toEqual(
      fixture.snapshot.candidates.map((c) => c.name),
    );
    for (let index = 0; index < point.candidates.length; index++) {
      const validity = point.candidates[index]!.validity;
      if (validity) expect(selected?.pres[index]?.validity).toBe(validity);
      else expect(selected?.pres[index]).not.toHaveProperty("validity");
    }
    expect(feed.exportContext(selected!.t, true)).toMatchObject({
      available: true,
      replay: true,
      as_of: point.as_of,
    });
  }
});

it("replay real mantém municípios/UF/exterior ausentes e permanece congelado no polling", async () => {
  const { history } = captured();
  const { feed, request } = await replay(history.points);
  const selected = await feed.load(
    minuteOf(Date.parse(history.points[0]!.as_of)),
  );
  const before = structuredClone(selected);
  expect(selected?.towns).toBe(false);
  expect(selected?.municipalityAvailable).toEqual([false]);
  expect(selected?.uf.AC).toMatchObject({ available: false, sections: null });
  expect(selected?.uf.ZZ).toMatchObject({ available: false, sections: null });
  expect([...selected!.muni]).toEqual([0, 0, 0, 0]);
  expect([...selected!.zz]).toEqual([0, 0, 0, 0]);
  request.mockClear();
  await feed.refresh();
  expect(request.mock.calls.map(([path]) => path)).toEqual(["/api/manifest"]);
  expect(selected).toEqual(before);
  expect(feed.exportContext(selected!.t, true).as_of).toBe(
    selected?.source.as_of,
  );
});

it("ausência anterior não usa snapshot atual como replay e preserva retorno mais recente real", async () => {
  const { history } = captured();
  const { feed, fixture } = await replay(history.points);
  const firstMinute = minuteOf(Date.parse(history.points[0]!.as_of));
  expect(await feed.minutes()).toEqual([Math.floor(firstMinute)]);
  expect(await feed.load(Math.floor(firstMinute) - 1)).toBeNull();
  expect(feed.exportContext(firstMinute, true)).toMatchObject({
    available: false,
    replay: true,
    as_of: null,
  });
  expect(feed.peek()?.seq).toBe(fixture.snapshot.snapshot_id);
  expect(feed.exportContext()).toMatchObject({
    available: true,
    replay: false,
    as_of: fixture.snapshot.source.as_of,
  });
});

it("publicações reais com suspensão e retomada não alteram o replay já carregado", async () => {
  const publications = loadRealPresidentialPublications();
  const suspended = publications.find(
    (item) => !item.snapshot.projection.available,
  )!;
  const resumed = publications.find(
    (item) =>
      item.snapshot.projection.available &&
      Date.parse(item.snapshot.published_at) >
        Date.parse(suspended.snapshot.published_at),
  )!;
  expect(suspended).toBeDefined();
  expect(resumed).toBeDefined();
  let current = suspended;
  vi.stubGlobal("fetch", async (path: string) => {
    if (path === "/api/manifest") return Response.json(current.manifest);
    for (const name of ["snapshots", "history", "municipalities"] as const)
      if (path === current.manifest[name])
        return new Response(current.bodies[name], {
          headers: { "content-type": "application/json" },
        });
    return new Response(null, { status: 404 });
  });
  const feed = createApurarFeed({ places: [], states: ["AC"], candidates: [] });
  await feed.refresh();
  const minute = minuteOf(Date.parse(suspended.snapshot.source.as_of));
  const selected = await feed.load(minute);
  const frozen = structuredClone(selected);
  expect(selected?.projection.available).toBe(false);
  current = resumed;
  await feed.refresh();
  expect(feed.sourceSnapshot()?.snapshot_id).toBe(resumed.snapshot.snapshot_id);
  expect(feed.peek()?.projection.available).toBe(true);
  expect(selected).toEqual(frozen);
  expect(selected?.projection.available).toBe(false);
  expect(feed.exportContext(selected!.t, true).as_of).toBe(
    suspended.snapshot.source.as_of,
  );
  // O mesmo horário da fonte tem uma revisão nova; somente nova seleção a aplica.
  const reloaded = await feed.load(minute);
  expect(reloaded?.seq).toBe(resumed.history.points.at(-1)?.snapshot_id);
  expect(reloaded?.projection.available).toBe(true);
  expect(reloaded?.source.as_of).toBe(selected?.source.as_of);
  expect(reloaded?.seq).not.toBe(selected?.seq);
});
