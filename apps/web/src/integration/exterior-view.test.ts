import { expect, it } from "vitest";
import { supplementalFixture } from "../../../../packages/contracts/supplemental-fixture";
import { officialExterior } from "./exterior-view";
it("mapa mundial usa código TSE e ambos finalistas, sem converter ausência em zero", () => {
  const payload = supplementalFixture();
  const city = payload.exterior.cities[0]!;
  city.candidates = [
    {
      id: "13",
      name: "Teste A",
      party: "TESTE",
      votes: 80,
      status: "",
      validity: "",
    },
    {
      id: "22",
      name: "Teste B",
      party: "TESTE",
      votes: 20,
      status: "",
      validity: "",
    },
  ];
  const view = { zz: new Float32Array(8) };
  const places = [{ cd: "29955" }, { cd: "00001" }];
  const mapped = officialExterior(view, payload, places, ["22", "13"]);
  expect([...mapped.zz]).toEqual([
    expect.closeTo(0.2),
    1,
    expect.closeTo(0.6),
    100,
    0,
    0,
    0,
    0,
  ]);
  expect([...view.zz]).toEqual(new Array(8).fill(0));
  city.candidates.pop();
  expect([...officialExterior(view, payload, places, ["22", "13"]).zz]).toEqual(
    new Array(8).fill(0),
  );
  city.status = "withheld";
  expect([...officialExterior(view, payload, places, ["13"]).zz]).toEqual(
    new Array(8).fill(0),
  );
});

it("mapa exterior limpa dados antigos e recusa dados vencidos ou lista inválida de finalistas", () => {
  const view = { zz: new Float32Array([1, 1, 1, 100]) };
  const places = [{ cd: "29955" }];
  expect([...officialExterior(view, null, places, ["11", "22"]).zz]).toEqual([
    0, 0, 0, 0,
  ]);
  const payload = supplementalFixture();
  const city = payload.exterior.cities[0]!;
  city.candidates.push({ ...city.candidates[0]!, id: "22", votes: 20 });
  for (const ids of [[], ["11"], ["11", "11"], ["11", "22", "33"]]) {
    expect([...officialExterior(view, payload, places, ids).zz]).toEqual([
      0, 0, 0, 0,
    ]);
  }
  city.stale = true;
  expect([...officialExterior(view, payload, places, ["11", "22"]).zz]).toEqual(
    [0, 0, 0, 0],
  );
});

it("recusa identidades duplicadas e resultados de outro cargo ou eleição no mapa", () => {
  const payload = supplementalFixture();
  const city = payload.exterior.cities[0]!;
  city.candidates.push({ ...city.candidates[0]!, id: "22", votes: 20 });
  const view = { zz: new Float32Array(4) };
  const places = [{ cd: "29955" }];
  const mapped = () => [
    ...officialExterior(view, payload, places, ["11", "22"]).zz,
  ];
  expect(mapped()[3]).toBe(120);
  payload.exterior.cities.push({ ...city, tse_code: "29955" });
  expect(mapped()).toEqual([0, 0, 0, 0]);
  payload.exterior.cities.push({ ...city });
  expect(mapped()).toEqual([0, 0, 0, 0]);
  payload.exterior.cities = [city];
  for (const invalid of [
    { office: "governor" as const },
    { election: "6260" },
    { uf: "AC" },
    { kind: "country" },
    { candidates: [...city.candidates, { ...city.candidates[0]! }] },
  ]) {
    payload.exterior.cities = [{ ...city, ...invalid }];
    expect(mapped()).toEqual([0, 0, 0, 0]);
  }
  // O coletor usa o código territorial no scope e city no kind.
  payload.exterior.cities = [{ ...city, scope: "zz29955", kind: "city" }];
  expect(mapped()[3]).toBe(120);
});
