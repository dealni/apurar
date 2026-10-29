import { expect, it } from "vitest";
import { validateCollection } from "./collections";

const as_of = "2026-10-24T10:00:00Z";
const candidates = [
  { id: "01", votes: 10 },
  { id: "02", votes: 20 },
];
const sections = { counted: 1, total: 10 };
const projection = {
  available: false,
  model: "none",
  reason: "Aguardando",
  shares: null,
};
const municipality = {
  scope: "municipality",
  uf: "SP",
  name: "Município",
  unit_id: "SP:00001",
  sections,
  candidates,
  available: true,
  as_of,
};
const envelope = {
  schema_version: 1,
  election: "6258",
  snapshot_id: "publication-001",
};
it("valida municípios e disponibilidade sem inventar votos", () => {
  expect(() =>
    validateCollection(
      { ...envelope, items: [municipality] },
      "municipalities",
    ),
  ).not.toThrow();
  expect(() =>
    validateCollection(
      {
        ...envelope,
        items: [{ ...municipality, available: false, candidates: [] }],
      },
      "municipalities",
    ),
  ).not.toThrow();
  expect(() =>
    validateCollection(
      { ...envelope, items: [{ ...municipality, available: false }] },
      "municipalities",
    ),
  ).toThrow();
});
it("recusa contagens, identidades e municípios duplicados inválidos", () => {
  for (const item of [
    { ...municipality, sections: { counted: 11, total: 10 } },
    { ...municipality, candidates: [{ id: "01", votes: -1 }, candidates[1]] },
    { ...municipality, candidates: [candidates[0], candidates[0]] },
    { ...municipality, uf: "<script>" },
  ]) {
    expect(() =>
      validateCollection({ ...envelope, items: [item] }, "municipalities"),
    ).toThrow();
  }
  expect(() =>
    validateCollection(
      { ...envelope, items: [municipality, municipality] },
      "municipalities",
    ),
  ).toThrow();
});
it("exige geração do envelope para o consumidor verificar consistência", () => {
  expect(() =>
    validateCollection(
      { schema_version: 1, election: "6258", items: [] },
      "municipalities",
    ),
  ).toThrow();
});
it("valida histórico em ordem e recusa projeção incompatível", () => {
  const point = { snapshot_id: "p1", as_of, sections, candidates, projection };
  expect(() =>
    validateCollection({ ...envelope, points: [point] }, "history"),
  ).not.toThrow();
  expect(() =>
    validateCollection(
      {
        ...envelope,
        points: [
          point,
          { ...point, snapshot_id: "p2", as_of: "2026-10-24T09:00:00Z" },
        ],
      },
      "history",
    ),
  ).toThrow();
  expect(() =>
    validateCollection(
      {
        ...envelope,
        points: [
          {
            ...point,
            projection: {
              ...projection,
              available: true,
              shares: { "01": 80, "02": 80 },
            },
          },
        ],
      },
      "history",
    ),
  ).toThrow();
});

it("preserva ausência de dados como null sem convertê-la em zero", () => {
  expect(() =>
    validateCollection(
      {
        ...envelope,
        items: [
          {
            ...municipality,
            available: false,
            candidates: [],
            sections: { counted: null, total: null },
            as_of: null,
          },
        ],
      },
      "municipalities",
    ),
  ).not.toThrow();
  expect(() =>
    validateCollection(
      {
        ...envelope,
        items: [
          {
            ...municipality,
            available: false,
            candidates: [],
            sections: { counted: null, total: -1 },
            as_of: null,
          },
        ],
      },
      "municipalities",
    ),
  ).toThrow();
});

it("valida os totais oficiais históricos antes de aceitar uma projeção", () => {
  const point = {
    snapshot_id: "p1",
    as_of,
    sections,
    candidates,
    totals: { valid: 30, blank: 1, null: 1, turnout: 32, electorate: 40 },
    projection: {
      available: true,
      model: "experimental",
      reason: "Estimativa",
      shares: { "01": 40, "02": 60 },
    },
  };
  expect(() =>
    validateCollection({ ...envelope, points: [point] }, "history"),
  ).not.toThrow();
  for (const totals of [
    { ...point.totals, valid: -1 },
    { ...point.totals, valid: 31 },
    { ...point.totals, sub_judice: 1 },
  ]) {
    expect(() =>
      validateCollection(
        { ...envelope, points: [{ ...point, totals }] },
        "history",
      ),
    ).toThrow();
  }
  expect(() =>
    validateCollection(
      {
        ...envelope,
        points: [
          { ...point, totals: { ...point.totals, valid: 31 }, projection },
        ],
      },
      "history",
    ),
  ).not.toThrow();
});
