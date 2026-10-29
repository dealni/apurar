import { describe, expect, it } from "vitest";
import { demo } from "../../apps/web/src/demo";
import { adaptSnapshot } from "../../apps/web/src/integration/adapter";
import { municipalDetails } from "../../apps/web/src/integration/municipal-totals";
import { parseHistory, parseMunicipalities } from "../../apps/web/src/feeds";
import type { Municipality } from "./municipality";

const row: Municipality & { available: true } = {
  scope: "ac01120",
  uf: "AC",
  name: "Acrelândia",
  unit_id: "AC:01120",
  available: true,
  as_of: "2026-10-24T20:00:00Z",
  sections: { counted: 1, total: 45 },
  candidates: [
    { id: "01", votes: 45, validity: "Anulado sub judice" },
    { id: "02", votes: 15, validity: "Válido" },
  ],
  totals: {
    electorate: 10208,
    electorate_totalized: 120,
    electorate_installed: 100,
    turnout: 70,
    abstention: 30,
    valid: 40,
    computed: 60,
    blank: 6,
    null: 4,
    annulled: 10,
    sub_judice: 10,
    total: 70,
  },
};

function details(value: Municipality & { available: true }) {
  return municipalDetails(
    value,
    value.candidates.map((c) => c.votes),
    ["01", "02"],
  );
}

describe("totais municipais no contrato e no painel principal", () => {
  it("separa votos computados, válidos e destinação sem recalcular totais oficiais", () => {
    const output = details(row);
    expect(output).toMatchObject({
      votos: [45, 15],
      computados: 60,
      validos: 40,
      base: 60,
      destinacoes: ["Anulado sub judice", "Válido"],
      eleitorado: 10208,
      eleitoradoTotalizado: 120,
      apurado: 100,
      comparecimento: 70,
      abstencao: 30,
      voteDestinationWarning: true,
    });
  });

  it("conserva zero oficial e mantém totais legados desconhecidos", () => {
    expect(
      details({ ...row, totals: { ...row.totals!, valid: 0 } }).validos,
    ).toBe(0);
    const legacy = { ...row };
    delete legacy.totals;
    expect(details(legacy)).toMatchObject({
      validos: null,
      computados: null,
      base: 60,
      eleitorado: null,
    });
  });

  it("contrato municipal preserva totais e destinos locais sem herdar os nacionais", () => {
    const national = {
      ...demo,
      totals: { valid: 999, blank: 0, null: 0, turnout: 999, electorate: 9999 },
    };
    const parsed = parseMunicipalities(
      {
        schema_version: 1,
        election: "6258",
        snapshot_id: national.snapshot_id,
        items: [row],
      },
      national,
    );
    expect(parsed[0]).toEqual(row);
    expect(details(parsed[0] as typeof row).validos).toBe(40);
    expect(national.projection.available).toBe(true);
    const adapted = adaptSnapshot(
      national,
      parsed,
      [{ id: "1200013", name: "Acrelândia", uf: "AC" }],
      ["AC"],
    );
    expect(adapted.nat.valid).toBe(999);
    expect(adapted.uf.AC?.valid).toBeNull();
    expect(adapted.uf.AC?.coverageComplete).toBe(false);
  });

  it("histórico mantém destinações observadas sem preencher legados", () => {
    const point = {
      snapshot_id: "past-validity",
      as_of: demo.source.as_of,
      sections: demo.sections,
      candidates: demo.candidates.map((c) => ({
        id: c.id,
        votes: c.votes,
        validity: "Válido",
      })),
    };
    const parse = (value: unknown) =>
      parseHistory({ schema_version: 1, election: "6258", points: [value] })[0];
    expect(parse(point)?.candidates[0]?.validity).toBe("Válido");
    const legacy = { ...point, candidates: demo.candidates };
    expect(parse(legacy)?.candidates[0]?.validity).toBeUndefined();
  });

  it("histórico recusa destinação malformada", () => {
    expect(() =>
      parseHistory({
        schema_version: 1,
        election: "6258",
        points: [
          {
            snapshot_id: "bad-validity",
            as_of: demo.source.as_of,
            sections: demo.sections,
            candidates: demo.candidates.map((c) => ({ ...c, validity: {} })),
          },
        ],
      }),
    ).toThrow("Histórico inválido");
  });
});
