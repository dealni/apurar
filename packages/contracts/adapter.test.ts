import { describe, it, expect, vi, afterEach } from "vitest";
import {
  adaptSnapshot,
  adaptHistory,
  municipalIndex,
  minuteOf,
} from "../../apps/web/src/integration/adapter";
import { demo } from "../../apps/web/src/demo";
import { createApurarFeed } from "../../apps/web/src/integration/client";
import type { Municipality } from "../../apps/web/src/feeds";
const place = { id: 3550308, name: "São Paulo", uf: "SP" };
const row: Municipality = {
  scope: "sp71072",
  uf: "SP",
  name: "SÃO PAULO",
  unit_id: "SP:71072",
  available: true,
  sections: { counted: 1, total: 2 },
  candidates: [
    { id: "01", votes: 30 },
    { id: "02", votes: 70 },
  ],
  as_of: demo.source.as_of,
};
describe("integração com a interface preservada", () => {
  afterEach(() => vi.unstubAllGlobals());
  it("liga IDs IBGE ao código TSE oficial mesmo com grafia diferente", () => {
    expect(municipalIndex([row], [place])[0]).toBe(row);
    expect(
      municipalIndex(
        [row],
        [{ ...place, name: "Outro nome da mesma identidade" }],
      )[0],
    ).toBe(row);
    expect(municipalIndex([row], [{ ...place, uf: "RJ" }])[0]).toBeUndefined();
    expect(
      municipalIndex([row], [{ ...place, id: 9999999 }])[0],
    ).toBeUndefined();
  });
  it("recusa identidades ambíguas e admite fallback estrito apenas em fixtures", () => {
    expect(municipalIndex([row, { ...row }], [place])[0]).toBeUndefined();
    expect(municipalIndex([row], [place, { ...place }])[0]).toBeUndefined();
    const fixture = { ...place, id: "ficticio" };
    expect(municipalIndex([row], [fixture])[0]).toBe(row);
    expect(
      municipalIndex([row], [fixture, { ...fixture, id: "ficticio2" }])[0],
    ).toBeUndefined();
  });
  it("usa somente a projeção recebida e não produz faixa ou vencedor", () => {
    const value = adaptSnapshot(demo, [row], [place], ["SP", "ZZ"]);
    expect(value.proj?.by[1]).toBe(0.512);
    expect(value.proj?.band).toBeNull();
    expect(value.proj?.call).toBeNull();
    expect(Array.from(value.muni).slice(0, 2)).toEqual([0.5, 1]);
    expect(value.gerado).toBe(Date.parse(demo.source.as_of));
    expect(value.nat.blank).toBeNull();
  });
  it("não troca apuração oficial por soma parcial municipal", () => {
    const value = adaptSnapshot(demo, [row], [place], ["SP"]);
    expect(value.nat.cand).toEqual([2400000, 2100000]);
    expect(value.uf.SP?.cand).toEqual([30, 70]);
    expect(value.nat.status).toBe("apurando");
  });
  it("mantém projeção ausente sem fallback ou cálculos", () => {
    const value = adaptSnapshot(
      {
        ...demo,
        projection: {
          available: false,
          model: "none",
          reason: "indisponível",
          shares: null,
        },
      },
      [],
      [place],
      ["SP"],
    );
    expect(value.proj).toBeNull();
    expect(value.towns).toBe(false);
  });
  it("histórico preserva correções oficiais que diminuem votos", () => {
    const points = [100, 90].map((votes, index) => ({
      snapshot_id: String(index),
      as_of: new Date(
        Date.parse(demo.source.as_of) + index * 60000,
      ).toISOString(),
      sections: { counted: 1, total: 2 },
      candidates: [
        { id: "01", votes },
        { id: "02", votes: 50 },
      ],
    }));
    const history = adaptHistory(points, demo);
    expect(history[1]!.sh[0]).toBeLessThan(history[0]!.sh[0]!);
  });
  it("estado inicial não usa população, turnout ou votos da simulação", () => {
    const feed = createApurarFeed({
      places: [place],
      states: ["SP"],
      candidates: [],
    });
    expect(feed.empty().nat.el).toBeNull();
    expect(feed.empty().nat.cand).toEqual([0, 0]);
    expect(feed.sourceSnapshot()).toBeNull();
    expect(feed.peek()).toBeNull();
  });
  it("recusa demonstração na rota ao vivo sem fazer fallback", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async (path: string) =>
          new Response(
            JSON.stringify(
              path === "/api/manifest" ? manifest(demo.snapshot_id) : demo,
            ),
          ),
      ),
    );
    const feed = createApurarFeed({
      places: [place],
      states: ["SP"],
      candidates: [],
    });
    await feed.refresh();
    expect(feed.sourceSnapshot()).toBeNull();
    expect(feed.status().motivo).toContain("recusou");
  });
  it("mantém horário da fonte atrasado e recusa complemento de outra versão", async () => {
    const live = {
      ...demo,
      mode: "live",
      source: {
        ...demo.source,
        as_of: "2026-10-20T10:00:00Z",
        collected_at: "2026-10-20T10:00:01Z",
      },
      published_at: "2026-10-20T10:00:02Z",
    };
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async (path: string) =>
          new Response(
            JSON.stringify(
              path === "/api/manifest"
                ? manifest(live.snapshot_id)
                : path.includes("/snapshots/")
                  ? live
                  : {
                      schema_version: 1,
                      election: "6258",
                      snapshot_id: "outra-versao",
                      items: [row],
                      points: [],
                    },
            ),
          ),
      ),
    );
    const feed = createApurarFeed({
      places: [place],
      states: ["SP"],
      candidates: [],
    });
    await feed.refresh();
    expect(feed.sourceSnapshot()).toBeNull();
    expect(feed.peek()).toBeNull();
    expect(feed.status().motivo).toContain("sincronização");
  });
  it("não reutiliza totais atuais ao abrir uma apuração histórica", async () => {
    const live = {
      ...demo,
      mode: "live",
      source: {
        ...demo.source,
        as_of: "2026-10-20T10:00:00Z",
        collected_at: "2026-10-20T10:00:01Z",
      },
      published_at: "2026-10-20T10:00:02Z",
      totals: {
        valid: 4500000,
        blank: 999,
        null: 1,
        turnout: 4501000,
        electorate: 5000000,
      },
    };
    const point = {
      snapshot_id: "old",
      as_of: "2026-10-20T09:00:00Z",
      sections: { counted: 1, total: 10 },
      candidates: demo.candidates,
      projection: demo.projection,
    };
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async (path: string) =>
          new Response(
            JSON.stringify(
              path === "/api/manifest"
                ? manifest(live.snapshot_id)
                : path.includes("/snapshots/")
                  ? live
                  : {
                      schema_version: 1,
                      election: "6258",
                      snapshot_id: live.snapshot_id,
                      items: [],
                      points: [point],
                    },
            ),
          ),
      ),
    );
    const feed = createApurarFeed({
      places: [place],
      states: ["SP"],
      candidates: [],
    });
    await feed.refresh();
    const minutes = await feed.minutes();
    const replay = await feed.load(minutes[0]!);
    expect(feed.peek()?.nat.blank).toBe(999);
    expect(replay?.nat.blank).toBeNull();
    expect(replay?.proj?.source_as_of).toBe(point.as_of);
  });
  it("mantém tempo contínuo na madrugada após a eleição", () => {
    expect(minuteOf(Date.parse("2026-10-25T23:59:00-03:00"))).toBe(1439);
    expect(minuteOf(Date.parse("2026-10-26T00:01:00-03:00"))).toBe(1441);
  });
  it("seleciona a última revisão de cada minuto no histórico", async () => {
    const live = {
      ...demo,
      mode: "live",
      source: {
        ...demo.source,
        as_of: "2026-10-20T10:00:45-03:00",
        collected_at: "2026-10-20T10:00:46-03:00",
      },
      published_at: "2026-10-20T10:00:47-03:00",
    };
    const points = [10, 30].map((second, index) => ({
      snapshot_id: `revisao${index}`,
      as_of: `2026-10-20T10:00:${second}-03:00`,
      sections: { counted: 1, total: 2 },
      candidates: demo.candidates,
      projection: demo.projection,
    }));
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async (path: string) =>
          new Response(
            JSON.stringify(
              path === "/api/manifest"
                ? manifest(live.snapshot_id)
                : path.includes("/snapshots/")
                  ? live
                  : {
                      schema_version: 1,
                      election: "6258",
                      snapshot_id: live.snapshot_id,
                      items: [],
                      points,
                    },
            ),
          ),
      ),
    );
    const feed = createApurarFeed({
      places: [place],
      states: ["SP"],
      candidates: [],
    });
    await feed.refresh();
    const minute = Math.floor(minuteOf(Date.parse(points[0]!.as_of)));
    expect(await feed.minutes()).toEqual([minute]);
    expect((await feed.load(minute))?.seq).toBe("revisao1");
  });
});

function manifest(snapshot_id: string) {
  return {
    schema_version: 1,
    snapshot_id,
    snapshots: `/api/snapshots/${"1".repeat(64)}`,
    municipalities: `/api/municipalities/${"2".repeat(64)}`,
    history: `/api/history/${"3".repeat(64)}`,
  };
}
