import { expect, it } from "vitest";
import { governorMunicipalities, governorColor } from "./governor-map";
import { supplementalFixture } from "../../../../packages/contracts/supplemental-fixture";
it("une município pelo IBGE e UF sem aproximar nomes ou códigos TSE", () => {
  const payload = supplementalFixture();
  const item = {
    ...payload.governors[0]!,
    id: "AC:01392",
    name: "Nome diferente do mapa",
    ibge_code: "1200401",
    tse_code: "01392",
    as_of: "2026-10-25T20:01:00Z",
  };
  payload.governor_municipalities = [item];
  const rows = governorMunicipalities(payload, [
    { id: 1200401, uf: "AC", name: "Rio Branco" },
    { id: "01392", uf: "AC", name: "Nome diferente do mapa" },
    { id: 1200401, uf: "SP", name: "Rio Branco" },
  ]);
  expect(rows[0]?.result).toBe(item);
  expect(rows[0]?.result?.as_of).toBe("2026-10-25T20:01:00Z");
  expect(rows[1]?.result).toBeNull();
  expect(rows[2]?.result).toBeNull();
});
it("ausência, empate, votos ocultos e dados vencidos são neutros", () => {
  const item = supplementalFixture().exterior.cities[0]!;
  expect(governorColor(null, null)).toBe("#aeb8bd");
  expect(governorColor({ ...item, stale: true }, item)).toBe("#aeb8bd");
  expect(governorColor({ ...item, status: "withheld" }, item)).toBe("#aeb8bd");
  expect(
    governorColor(
      {
        ...item,
        candidates: [...item.candidates, { ...item.candidates[0]!, id: "22" }],
      },
      item,
    ),
  ).toBe("#aeb8bd");
  expect(governorColor(item, item)).not.toBe("#aeb8bd");
});

it("não atribui liderança quando uma candidatura tem votos indisponíveis", () => {
  const item = supplementalFixture().exterior.cities[0]!;
  item.candidates.push({ ...item.candidates[0]!, id: "22", votes: null });
  expect(governorColor(item, item)).toBe("#aeb8bd");
});

it("paleta usa município com estadual pendente e neutraliza líder fora da lista estadual", () => {
  const payload = supplementalFixture();
  const item = payload.exterior.cities[0]!;
  item.candidates.push({ ...item.candidates[0]!, id: "22", votes: 200 });
  const statewide = payload.governors[0]!;
  expect(governorColor(item, statewide)).toBe("#ce7843");
  statewide.candidates = [item.candidates[0]!];
  expect(governorColor(item, statewide)).toBe("#aeb8bd");
});
