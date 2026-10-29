import { afterEach, describe, expect, it, vi } from "vitest";
import { demo } from "../demo";
import { adaptSnapshot, minuteOf } from "./adapter";
import { createApurarFeed } from "./client";

describe("motivo da projeção no contexto exibido", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("preserva suspensão e modelo sem fabricar uma projeção", () => {
    const projection = {
      available: false,
      model: "experimental",
      reason: "Cobertura municipal incompleta.",
      shares: null,
    };
    const value = adaptSnapshot({ ...demo, projection }, [], [], []);
    expect(value.proj).toBeNull();
    expect(value.projection).toEqual(projection);
    expect(value.source.as_of).toBe(demo.source.as_of);
  });

  it("identifica a totalização final sem rotulá-la como estimativa experimental", () => {
    const value = adaptSnapshot(
      { ...demo, projection: { ...demo.projection, model: "official_final" } },
      [],
      [],
      [],
    );
    expect(value.proj?.experimental).toBe(false);
    expect(value.proj?.by).toEqual({ 1: 0.512, 2: 0.488 });
  });

  it("mantém a razão histórica separada da suspensão da publicação atual", async () => {
    const projection = (reason: string) => ({
      available: false,
      model: "experimental",
      reason,
      shares: null,
    });
    const live = {
      ...demo,
      mode: "live",
      source: {
        ...demo.source,
        as_of: "2026-10-20T10:00:00Z",
        collected_at: "2026-10-20T10:00:01Z",
      },
      published_at: "2026-10-20T10:00:02Z",
      projection: projection("Coleta atual suspensa."),
    };
    const point = {
      snapshot_id: "anterior",
      as_of: "2026-10-20T09:00:00Z",
      sections: demo.sections,
      candidates: demo.candidates,
      projection: projection("Cobertura histórica incompleta."),
    };
    vi.stubGlobal(
      "fetch",
      vi.fn(async (path: string) => {
        const auxiliary = {
          schema_version: 1,
          election: "6258",
          snapshot_id: live.snapshot_id,
          items: [],
          points: [point],
        };
        const manifest = {
          schema_version: 1,
          snapshot_id: live.snapshot_id,
          snapshots: `/api/snapshots/${"1".repeat(64)}`,
          municipalities: `/api/municipalities/${"2".repeat(64)}`,
          history: `/api/history/${"3".repeat(64)}`,
        };
        return new Response(
          JSON.stringify(
            path === "/api/manifest"
              ? manifest
              : path.includes("/snapshots/")
                ? live
                : auxiliary,
          ),
        );
      }),
    );
    const feed = createApurarFeed({ places: [], states: [], candidates: [] });
    await feed.refresh();
    const replay = await feed.load(minuteOf(Date.parse(point.as_of)));
    expect(feed.peek()?.projection.reason).toBe("Coleta atual suspensa.");
    expect(replay?.projection.reason).toBe("Cobertura histórica incompleta.");
    expect(replay?.proj).toBeNull();
  });
});
