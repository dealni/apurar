import { expect, it } from "vitest";
import { supplementalFixture } from "../../../../packages/contracts/supplemental-fixture";
import {
  applyGovernorMainModel,
  createGovernorMainModel,
} from "./governor-main-model";
import type { SupplementalResult } from "./supplemental-data";
const places = [
  { id: 1200401, uf: "AC", name: "Rio Branco" },
  { id: 3550308, uf: "SP", name: "São Paulo" },
];
function fixture() {
  const payload = supplementalFixture();
  const row: SupplementalResult = {
    ...payload.governors[0]!,
    scope: "ac",
    status: "available",
    as_of: "2026-10-25T20:01:00Z",
    sections: { counted: 3, total: 12 },
    totals: { ...payload.governors[0]!.totals, valid: 100 },
    candidates: [
      {
        id: "22",
        name: "Nome oficial B",
        party: "PL",
        votes: 80,
        status: "",
        validity: "válidos",
      },
      {
        id: "11",
        name: "Nome oficial A",
        party: "PP",
        votes: 20,
        status: "",
        validity: "válidos",
      },
    ],
  };
  payload.governors = [row];
  payload.governor_municipalities = [
    {
      ...row,
      candidates: structuredClone(row.candidates),
      id: "AC:01392",
      scope: "ac01392",
      ibge_code: 1200401,
      name: "Rio Branco",
      as_of: "2026-10-25T20:02:00Z",
      sections: { counted: 1, total: 4 },
    },
  ];
  return payload;
}
it("adiciona governadores sem substituir placar, projeção e malha presidenciais", () => {
  const base = {
    nat: { cand: [999, 888] },
    uf: { AC: { secDone: 99 } },
    muni: new Float32Array([1, 0, 0.1, 200]),
    proj: { experimental: true },
    source: { as_of: "presidencial" },
  };
  const next = applyGovernorMainModel(base, fixture(), places, ["AC", "SP"]);
  expect(next).not.toBe(base);
  for (const key of ["nat", "uf", "muni", "proj", "source"] as const)
    expect(next[key]).toBe(base[key]);
  const state = next.governor.states.AC!;
  expect(state.row?.secDone).toBe(3);
  expect(state.asOf).toBe("2026-10-25T20:01:00Z");
  expect(
    state.candidates.map((candidate) => [candidate.n, candidate.votes]),
  ).toEqual([
    [11, 20],
    [22, 80],
  ]);
  expect(state.row?.cand).toEqual([20, 80]);
  expect(next.governor.municipalities[0]?.asOf).toBe("2026-10-25T20:02:00Z");
});
it("alinha cores por identidade apesar de ordem municipal e estadual inversas", () => {
  const payload = fixture();
  payload.governor_municipalities![0]!.candidates.reverse();
  const model = createGovernorMainModel(payload, places, ["AC", "SP"]);
  expect(model.states.AC!.color).toBe("#ce7843");
  expect(model.municipalities[0]!.color).toBe(model.states.AC!.color);
  expect(
    model.municipalities[0]!.candidates.map((candidate) => candidate.color),
  ).toEqual(["#297da8", "#ce7843"]);
  expect(model.states.SP!.inRace).toBe(false);
  expect(model.states.SP!.color).toBe("#aeb8bd");
});
it("ausência, catálogo incompleto, stale, dados ocultos e candidaturas incompletas são neutros", () => {
  for (const mutate of [
    (row: SupplementalResult) => {
      row.stale = true;
    },
    (row: SupplementalResult) => {
      row.status = "withheld";
    },
    (row: SupplementalResult) => {
      row.candidates[0]!.votes = null;
    },
    (row: SupplementalResult) => {
      row.sections.counted = null;
    },
    (row: SupplementalResult) => {
      row.candidates.pop();
    },
  ]) {
    const payload = fixture();
    mutate(payload.governor_municipalities![0]!);
    const item = createGovernorMainModel(payload, places, ["AC", "SP"])
      .municipalities[0]!;
    expect(item.color).toBe("#aeb8bd");
    expect(item.available).toBe(false);
    expect(item.row).toBeNull();
    expect(item.candidates.every((candidate) => candidate.votes === null)).toBe(
      true,
    );
  }
  const payload = fixture();
  payload.coverage.catalog_error = "Falha no catálogo";
  expect(
    createGovernorMainModel(payload, places, ["AC"]).states.AC!.available,
  ).toBe(false);
  const empty = createGovernorMainModel(null, places, ["AC"]);
  expect(empty.states.AC!.row).toBeNull();
  expect(empty.municipalities[0]!.result).toBeNull();
});
it("não inventa liderança em empate nem antes de votos; mantém zero oficial distinto de ausência", () => {
  for (const votes of [0, 50]) {
    const payload = fixture();
    payload.governors[0]!.candidates.forEach((candidate) => {
      candidate.votes = votes;
    });
    const state = createGovernorMainModel(payload, places, ["AC"]).states.AC!;
    expect(state.color).toBe("#aeb8bd");
    expect(state.available).toBe(true);
    expect(state.candidates[0]!.votes).toBe(votes);
  }
});
it("exige município IBGE e UF sem fallback por nome nem resultado presidencial ou duplicado", () => {
  const payload = fixture();
  payload.governor_municipalities![0]!.office = "president";
  expect(
    createGovernorMainModel(payload, places, ["AC"]).municipalities[0]!.result,
  ).toBeNull();
  payload.governor_municipalities = [
    { ...fixture().governor_municipalities![0]!, uf: "SP" },
  ];
  expect(
    createGovernorMainModel(payload, places, ["AC"]).municipalities[0]!.result,
  ).toBeNull();
  payload.governor_municipalities = [
    ...fixture().governor_municipalities!,
    ...fixture().governor_municipalities!,
  ];
  expect(
    createGovernorMainModel(payload, places, ["AC"]).municipalities[0]!.result,
  ).toBeNull();
});
