import { describe, expect, it } from "vitest";
import { demo } from "../../apps/web/src/demo";
import { isStale, parseSnapshot } from "./snapshot";

describe("contrato eleitoral", () => {
  it("aceita fixture explicitamente sintética", () =>
    expect(parseSnapshot(demo).mode).toBe("demo"));
  it.each([
    { election: { ...demo.election, id: "6257" } },
    { sections: { counted: 11, total: 10 } },
    { source: { ...demo.source, as_of: "sem horário" } },
    { candidates: [{ ...demo.candidates[0], votes: -1 }, demo.candidates[1]] },
    {
      projection: {
        ...demo.projection,
        available: true,
        shares: { "01": 70, "02": 70 },
      },
    },
    {
      projection: {
        ...demo.projection,
        available: false,
        shares: { "01": 50, "02": 50 },
      },
    },
  ])("recusa contexto ou números inválidos: %j", (patch) =>
    expect(() => parseSnapshot({ ...demo, ...patch })).toThrow(),
  );
  it("rejeita ordem temporal impossível e horário live futuro", () => {
    expect(() =>
      parseSnapshot({
        ...demo,
        source: { ...demo.source, collected_at: "2026-10-25T17:00:00-03:00" },
      }),
    ).toThrow();
    expect(() =>
      parseSnapshot(
        { ...demo, mode: "live" },
        Date.parse("2026-10-24T18:00:00-03:00"),
      ),
    ).toThrow();
  });
  it("rejeita votos sem seções totalizadas", () => {
    expect(() =>
      parseSnapshot({ ...demo, sections: { counted: 0, total: 50000 } }),
    ).toThrow();
  });
  it("mede atraso pelo horário da fonte, sem atualizar o dado antigo", () => {
    expect(isStale(demo, Date.parse(demo.source.as_of) + 120001)).toBe(true);
    expect(isStale(demo, Date.parse(demo.source.as_of) + 10000)).toBe(false);
  });
});

describe("destinação EA20", () => {
  const totals = {
    valid: 280,
    blank: 8,
    null: 12,
    turnout: 620,
    electorate: 4500,
    computed: 600,
    annulled: 0,
    sub_judice: 320,
    total: 620,
  };
  const official = {
    ...demo,
    totals,
    projection: {
      ...demo.projection,
      available: false,
      shares: null,
      reason: "Projeção suspensa por destinação incompatível.",
    },
  };
  it("aceita votos computados distintos dos válidos quando modelo está suspenso", () => {
    const value = parseSnapshot(official);
    expect(value.totals?.valid).toBe(280);
    expect(value.totals?.sub_judice).toBe(320);
    expect(value.candidates).toEqual(demo.candidates);
  });
  it("recusa estimativa habilitada com destinação incompatível", () => {
    expect(() =>
      parseSnapshot({ ...official, projection: demo.projection }),
    ).toThrow();
  });
  it("continua recusando contagens oficiais negativas", () => {
    expect(() =>
      parseSnapshot({ ...official, totals: { ...totals, annulled: -1 } }),
    ).toThrow();
  });
});

describe("abrangência oficial do eleitorado", () => {
  const snapshot = {
    ...demo,
    totals: {
      valid: 4500000,
      blank: 0,
      null: 0,
      turnout: 4500000,
      electorate: 10000000,
      electorate_totalized: 6000000,
      electorate_installed: 5000000,
      abstention: 500000,
    },
  };
  it("preserva abrangências distintas sem derivar dados ausentes", () => {
    expect(parseSnapshot(snapshot).totals).toEqual(snapshot.totals);
    expect(parseSnapshot(demo).totals).toBeUndefined();
  });
  it("valida todas as novas contagens opcionais nacionais", () => {
    for (const field of [
      "electorate_totalized",
      "electorate_installed",
      "abstention",
    ])
      for (const invalid of [-1, NaN, null, 0.5])
        expect(() =>
          parseSnapshot({
            ...snapshot,
            totals: { ...snapshot.totals, [field]: invalid },
          }),
        ).toThrow();
  });
});
