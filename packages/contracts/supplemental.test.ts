import { expect, it } from "vitest";
import { parseSupplemental, type SupplementalResult } from "./supplemental";
import {
  legacySupplementalFixture,
  supplementalFixture,
} from "./supplemental-fixture";

it("recusa resultado disponível sem geração, seções ou votos confirmados", () => {
  const changes = [
    (row: SupplementalResult) => (row.generated_at = null),
    (row: SupplementalResult) => (row.sections.counted = null),
    (row: SupplementalResult) => (row.sections.total = null),
    (row: SupplementalResult) => (row.candidates[0]!.votes = null),
  ];
  for (const change of changes) {
    const payload = structuredClone(supplementalFixture());
    change(payload.exterior.cities[0]!);
    expect(() => parseSupplemental(payload)).toThrow(
      "Resultados suplementares inválidos",
    );
  }
});

it("preserva início zerado, países com horário parcial e zonas arquivadas", () => {
  const payload = legacySupplementalFixture();
  const city = payload.exterior.cities[0]!;
  city.as_of = null;
  city.sections.counted = 0;
  city.candidates[0]!.votes = 0;
  city.totals.valid = 0;
  // País pode reunir cidades com votos e cidades zeradas ainda sem as_of.
  payload.exterior.countries[0]!.as_of = null;
  expect(parseSupplemental(payload)).toBe(payload);
});

it("preserva ausência, dados suspensos e último resultado após falha", () => {
  const payload = structuredClone(supplementalFixture());
  const city = payload.exterior.cities[0]!;
  city.status = "withheld";
  city.sections = { ...city.sections, counted: null };
  city.candidates = city.candidates.map((candidate) => ({
    ...candidate,
    votes: null,
  }));
  expect(parseSupplemental(payload)).toBe(payload);
  city.status = "error";
  city.stale = true;
  expect(parseSupplemental(payload)).toBe(payload);
  expect(payload.governors[0]!.generated_at).toBeNull();
});

it("recusa candidatura repetida para não apresentar ou agregar votos duplicados", () => {
  const payload = structuredClone(supplementalFixture());
  const city = payload.exterior.cities[0]!;
  city.candidates.push({ ...city.candidates[0]! });
  expect(() => parseSupplemental(payload)).toThrow(
    "Resultados suplementares inválidos",
  );
});
