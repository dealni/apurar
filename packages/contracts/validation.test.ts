import { describe, expect, it } from "vitest";
import { timestamp } from "./validation";
import { parseHealth } from "./health";
import { parseSupplemental } from "./supplemental";
import { supplementalFixture } from "./supplemental-fixture";

describe("horários públicos com fuso explícito", () => {
  it.each([
    "2026-10-25T20:00:00Z",
    "2026-10-25T17:00:00-03:00",
    "2026-10-25T20:00:00.123456+00:00",
    "2028-02-29T20:00:00Z",
    "2000-02-29T20:00:00Z",
  ])("preserva horário ISO válido: %s", (value) => {
    expect(() => timestamp(value)).not.toThrow();
  });
  it.each([
    "2026-10-25",
    "2026-10-25T20:00:00",
    "2026-02-29T20:00:00Z",
    "2026-04-31T20:00:00Z",
    "1900-02-29T20:00:00Z",
    "2026-10-25T24:00:00Z",
    "2026-10-25T20:00:00+24:00",
    0,
    null,
  ])("recusa normalização ou fuso ausente: %s", (value) => {
    expect(() => timestamp(value)).toThrow("Horário inválido");
  });
  it("aplica a mesma regra a todos os horários de saúde", () => {
    const health = {
      schema_version: 1,
      election: "6258",
      checked_at: "2026-10-25T20:00:00.123456+00:00",
      last_success_at: null,
      status: "live",
      cycle_seconds: 15,
      pending_units: 0,
    };
    expect(parseHealth(health)).toEqual(health);
    for (const field of [
      "checked_at",
      "last_success_at",
      "last_tracking_success_at",
    ])
      expect(() =>
        parseHealth({ ...health, [field]: "2026-10-25T20:00:00" }),
      ).toThrow();
    expect(() =>
      parseHealth({
        ...health,
        supplemental: {
          status: "ok",
          pending: 0,
          errors: 0,
          zones_pending: 0,
          last_updated_at: 0,
        },
      }),
    ).toThrow();
  });
});

describe("integridade do detalhamento suplementar", () => {
  it("recusa horários locais e datas inexistentes", () => {
    const value = supplementalFixture();
    value.exterior.cities[0]!.as_of = "2026-02-30T20:00:00Z";
    expect(() => parseSupplemental(value)).toThrow();
    expect(() =>
      parseSupplemental({ ...supplementalFixture(), updated_at: "2026-10-25" }),
    ).toThrow();
  });
  it("recusa seções e cobertura acima do total sem preencher dados ausentes", () => {
    const value = supplementalFixture();
    expect(parseSupplemental(value).governors[0]!.sections.counted).toBeNull();
    value.exterior.cities[0]!.sections = { counted: 11, total: 10 };
    expect(() => parseSupplemental(value)).toThrow();
    const coverage = supplementalFixture();
    coverage.exterior.countries[0]!.coverage = { available: 2, total: 1 };
    expect(() => parseSupplemental(coverage)).toThrow();
    for (const invalid of [NaN, -1, 0.5, null])
      expect(() =>
        parseSupplemental({
          ...supplementalFixture(),
          coverage: { pending: 0, errors: 0, total: invalid },
        }),
      ).toThrow();
  });
});
