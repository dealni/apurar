import { expect, it } from "vitest";
import { supplementalFixture } from "../../../../packages/contracts/supplemental-fixture";
import { createExteriorMainModel } from "./exterior-main-model";
const places = [
  { cd: 29955, iso: "PT", name: "Lisboa" },
  { cd: 1, iso: "US", name: "Ausente" },
];
it("vincula cidades ao código TSE e país e preserva cobertura e horário próprios", () => {
  const payload = supplementalFixture();
  payload.exterior.countries[0]!.coverage = { available: 1, total: 3 };
  const result = createExteriorMainModel(payload, places, ["11", "22"]);
  expect(result.cities[0]).toBe(payload.exterior.cities[0]);
  expect(result.cities[1]).toBeNull();
  expect(result.countries.PT?.coverage).toEqual({ available: 1, total: 3 });
  expect(result.countries.PT?.as_of).toBe("2026-10-25T20:05:00Z");
  expect([...result.zz]).toEqual(new Array(8).fill(0));
});
it("recusa duplicatas, país incompatível e cargos alheios sem inventar zero oficial", () => {
  const payload = supplementalFixture();
  payload.exterior.cities.push({ ...payload.exterior.cities[0]! });
  payload.exterior.countries.push({ ...payload.exterior.countries[0]! });
  const duplicate = createExteriorMainModel(payload, places, ["11", "22"]);
  expect(duplicate.cities[0]).toBeNull();
  expect(duplicate.countries.PT).toBeUndefined();
  payload.exterior.cities = [
    { ...payload.exterior.cities[0]!, country_code: "US" },
  ];
  expect(
    createExteriorMainModel(payload, places, ["11", "22"]).cities[0],
  ).toBeNull();
  payload.exterior.cities[0]!.office = "governor";
  expect(
    createExteriorMainModel(payload, places, ["11", "22"]).cities[0],
  ).toBeNull();
  expect(createExteriorMainModel(null, places, ["11", "22"]).cities).toEqual([
    null,
    null,
  ]);
});
it("cores usam finalistas do mapa e ficam neutras quando a fonte está preservada", () => {
  const payload = supplementalFixture();
  const city = payload.exterior.cities[0]!;
  city.candidates.push({ ...city.candidates[0]!, id: "22", votes: 20 });
  const model = createExteriorMainModel(payload, places, ["22", "11"]);
  expect([...model.zz].slice(0, 4)).toEqual([
    expect.closeTo(0.2),
    1,
    expect.closeTo(2 / 3),
    120,
  ]);
  city.stale = true;
  const preserved = createExteriorMainModel(payload, places, ["22", "11"]);
  expect(preserved.cities[0]?.candidates[0]?.votes).toBe(100);
  expect([...preserved.zz]).toEqual(new Array(8).fill(0));
});
it("deriva a legenda apenas da fonte exterior, sem candidaturas nacionais inventadas", () => {
  const payload = supplementalFixture();
  payload.exterior.cities[0]!.candidates.push({
    ...payload.exterior.cities[0]!.candidates[0]!,
    id: "22",
    name: "Outra candidatura oficial",
    votes: 20,
  });
  const model = createExteriorMainModel(payload, places);
  expect(model.candidateIds).toEqual(["11", "22"]);
  expect(model.candidates.map((candidate) => candidate.name)).toEqual([
    "Candidatura oficial de teste",
    "Outra candidatura oficial",
  ]);
  expect(model.candidates.map((candidate) => candidate.color)).toEqual([
    "#e7ad78",
    "#8db9d9",
  ]);
  expect(createExteriorMainModel(null, places).candidates).toEqual([]);
});
