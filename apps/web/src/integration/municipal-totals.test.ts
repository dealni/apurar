import { expect, it } from "vitest";
import { municipalDetails, participationBase } from "./municipal-totals";
import { resultRow, adaptSnapshot } from "./adapter";
import { demo } from "../demo";
import municipalityIds from "./municipality-ids.json";
import type {
  Municipality,
  MunicipalTotals,
} from "../../../../packages/contracts/municipality";
const totals: MunicipalTotals = {
  electorate: 10208,
  electorate_totalized: 6000,
  electorate_installed: 5000,
  turnout: 4000,
  abstention: 1000,
  valid: 3600,
  computed: 3600,
  blank: 200,
  null: 200,
  annulled: 0,
  sub_judice: 0,
  total: 4000,
};
const row: Municipality & { available: true } = {
  scope: "municipality",
  uf: "AC",
  name: "Acrelândia",
  unit_id: "AC:01120",
  available: true,
  sections: { counted: 10, total: 20 },
  as_of: "2026-10-24T10:00:00Z",
  candidates: [
    { id: "13", votes: 2000, validity: "Válido" },
    { id: "22", votes: 1600, validity: "Anulado sub judice" },
  ],
  totals,
};
it("transporta totais oficiais e participa somente sobre seções instaladas", () => {
  const result = municipalDetails(row, [2000, 1600], ["13", "22"]);
  expect(result).toMatchObject({
    as_of: row.as_of,
    eleitorado: 10208,
    eleitoradoTotalizado: 6000,
    apurado: 5000,
    comparecimento: 4000,
    abstencao: 1000,
    validos: 3600,
    computados: 3600,
    base: 3600,
    brancos: 200,
    nulos: 200,
  });
  expect(result.comparecimento! / result.apurado!).toBe(0.8);
  expect(result.destinacoes).toEqual(["Válido", "Anulado sub judice"]);
  expect(participationBase({ turnout: 4, abstention: 1 })).toBe(5);
  expect(
    participationBase({ electorate: 10208, electorate_totalized: 6000 }),
  ).toBeNull();
});
it("mantém computados, válidos zero e destinos municipais distintos", () => {
  const result = municipalDetails(
    {
      ...row,
      totals: {
        ...totals,
        valid: 0,
        computed: 3600,
        annulled: 2000,
        sub_judice: 1600,
      },
    },
    [2000, 1600],
    ["22", "13"],
  );
  expect(result.validos).toBe(0);
  expect(result.computados).toBe(3600);
  expect(result.base).toBe(3600);
  expect(result.voteDestinationWarning).toBe(true);
  expect(result.destinacoes).toEqual(["Anulado sub judice", "Válido"]);
});
it("feed legado preserva ausências sem usar soma de candidatos como votos válidos", () => {
  const { totals: _totals, ...legacy } = row;
  const result = municipalDetails(legacy, [2000, 1600], ["13", "22"]);
  expect(result).toMatchObject({
    eleitorado: null,
    apurado: null,
    comparecimento: null,
    validos: null,
    computados: null,
    base: 3600,
    voteDestinationWarning: true,
  });
  expect(
    resultRow({ counted: 1, total: 2 }, [20, 30], "AC", "AC"),
  ).toMatchObject({
    valid: null,
    base: 50,
    computed: 50,
    voteDestinationWarning: true,
  });
});
it("agregação incompleta de UF não apresenta totais municipais como oficiais da UF", () => {
  const snapshot = adaptSnapshot(
    {
      ...demo,
      candidates: demo.candidates.map((candidate, index) => ({
        ...candidate,
        id: index === 0 ? "13" : "22",
      })),
    },
    [row],
    [{ id: "1200013", uf: "AC", name: "Acrelândia" }],
    ["AC"],
  );
  expect(snapshot.uf.AC).toMatchObject({
    el: null,
    valid: null,
    votes: null,
    coverageComplete: false,
    base: 3600,
  });
});

it("UF soma somente campos presentes em todas as cidades de cobertura íntegra", () => {
  const ids = Object.entries(municipalityIds).filter(([, id]) =>
    id.startsWith("AC:"),
  );
  const places = ids.map(([id], index) => ({
    id,
    uf: "AC",
    name: `Cidade ${index}`,
  }));
  const rows = ids.map(([, unit_id], index) => ({
    ...row,
    unit_id,
    name: places[index]!.name,
    totals: { ...totals, blank: index === 0 ? null : 200 },
  }));
  const snapshot = adaptSnapshot(
    {
      ...demo,
      candidates: demo.candidates.map((candidate, index) => ({
        ...candidate,
        id: index === 0 ? "13" : "22",
      })),
    },
    rows,
    places,
    ["AC"],
  );
  expect(snapshot.uf.AC).toMatchObject({
    coverageComplete: true,
    el: 10208 * rows.length,
    valid: 3600 * rows.length,
    votes: 4000 * rows.length,
    elDone: 5000 * rows.length,
    blank: null,
  });
});
