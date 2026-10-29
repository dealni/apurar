import { describe, expect, it } from "vitest";
import {
  adaptSnapshot,
  adaptHistory,
  electionStart,
  minuteOf,
} from "../../apps/web/src/integration/adapter";
import municipalityIds from "../../apps/web/src/integration/municipality-ids.json";
import { demo } from "../../apps/web/src/demo";
import type { Municipality } from "../../apps/web/src/feeds";

const ids = Object.entries(municipalityIds).filter(([, id]) =>
  id.startsWith("AC:"),
);
const places = ids.map(([id], index) => ({
  id,
  uf: "AC",
  name: `Município ${index}`,
}));
const rows: Municipality[] = ids.map(([, unit_id], index) => ({
  unit_id,
  uf: "AC",
  name: `Município ${index}`,
  scope: "municipality",
  available: true,
  sections: { counted: 100, total: 100 },
  as_of: demo.source.as_of,
  candidates: demo.candidates.map(({ id }) => ({ id, votes: 50 })),
}));
const state = (items: Municipality[]) =>
  adaptSnapshot(demo, items, places, ["AC"]).uf.AC!;

describe("cobertura municipal e relógio civil", () => {
  it("não certifica 100% de UF com município indisponível sem total", () => {
    const unavailable: Municipality = {
      ...rows[0]!,
      available: false,
      sections: { counted: null, total: null },
      as_of: null,
      candidates: [],
    };
    const result = state([unavailable, ...rows.slice(1)]);
    expect(result.pst).toBeNull();
    expect(result.sections).toBeNull();
    expect(result.available).toBe(true);
    expect(result.coverageComplete).toBe(false);
    expect(result.coverage).toEqual({
      available: rows.length - 1,
      expected: rows.length,
    });
    expect(result.aggregation).toBe("municipal");
  });
  it("não certifica cobertura completa quando município inteiro foi omitido", () => {
    expect(state(rows.slice(1)).pst).toBeNull();
    expect(state([]).available).toBe(false);
    expect(state([]).pst).toBeNull();
  });
  it("não completa a UF com identidades duplicadas em lugar dos municípios faltantes", () => {
    const result = state([...rows.slice(1), rows[1]!]);
    expect(result.coverageComplete).toBe(false);
    expect(result.pst).toBeNull();
    expect(result.coverage.available).toBe(rows.length - 2);
  });
  it("informa 100% somente com todos os municípios conhecidos totalizados", () => {
    const result = state(rows);
    expect(result.pst).toBe(1);
    expect(result.coverageComplete).toBe(true);
    expect(result.coverage).toEqual({
      available: rows.length,
      expected: rows.length,
    });
    expect(result.secDone).toBe(rows.length * 100);
  });
  it("preserva progresso real quando cobertura está completa mas contagem é parcial", () => {
    const partial = { ...rows[0]!, sections: { counted: 50, total: 100 } };
    expect(state([partial, ...rows.slice(1)]).pst).toBe(
      (rows.length * 100 - 50) / (rows.length * 100),
    );
  });
  it("preserva vv oficial e usa votos computados para percentuais das candidaturas", () => {
    const snapshot = {
      ...demo,
      totals: {
        valid: 4000000,
        blank: 10,
        null: 20,
        turnout: 4500030,
        electorate: 9000000,
        computed: 4500000,
        annulled: 500000,
        sub_judice: 0,
        total: 4500030,
      },
    };
    const result = adaptSnapshot(snapshot, [], [], []).nat;
    expect(result.valid).toBe(4000000);
    expect(result.base).toBe(4500000);
    expect(result.computed).toBe(4500000);
    expect(result.annulled).toBe(500000);
    expect(result.voteDestinationWarning).toBe(true);
    expect(result.cand).toEqual([2400000, 2100000]);
  });
  it("o relógio antes da eleição conserva minutos negativos e o dia correto", () => {
    expect(minuteOf(electionStart - 60000)).toBe(-1);
    expect(minuteOf(Date.parse("2026-10-24T19:19:00-03:00"))).toBe(-281);
    const earlier = "2026-10-24T19:19:00-03:00";
    const snapshot = { ...demo, source: { ...demo.source, as_of: earlier } };
    const result = adaptSnapshot(snapshot, [], [], []);
    expect(result.t).toBe(-281);
    expect(result.gerado).toBe(Date.parse(earlier));
    expect(
      adaptHistory(
        [
          {
            snapshot_id: "antes",
            as_of: earlier,
            sections: demo.sections,
            candidates: demo.candidates,
          },
        ],
        demo,
      )[0]!.t,
    ).toBe(-281);
  });
});
