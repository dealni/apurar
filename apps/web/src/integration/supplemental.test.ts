import { expect, it, vi } from "vitest";
import { parseSupplemental, resultStatus } from "./supplemental-data";
import { createSupplementalClient } from "./supplemental-client";
import { supplementalFixture } from "../../../../packages/contracts/supplemental-fixture";
it("preserva ausência e horários próprios de governador e exterior", () => {
  const payload = parseSupplemental(supplementalFixture());
  expect(payload.governors[0]?.totals.valid).toBeNull();
  expect(payload.exterior.cities[0]?.tse_code).toBe("29955");
  expect(payload.exterior.cities[0]?.as_of).toBe("2026-10-25T20:05:00Z");
});
it("recusa demonstração, fonte externa e contagem inválida", () => {
  for (const change of [
    (value: ReturnType<typeof supplementalFixture>) => {
      value.mode = "demo" as "live";
    },
    (value: ReturnType<typeof supplementalFixture>) => {
      value.governors[0]!.source_url = "https://example.org/data";
    },
    (value: ReturnType<typeof supplementalFixture>) => {
      value.governors[0]!.sections.counted = -1;
    },
  ]) {
    const value = supplementalFixture();
    change(value);
    expect(() => parseSupplemental(value)).toThrow();
  }
});
it("mostra erro parcial sem transformar ausência em zero", () => {
  const value = supplementalFixture().governors[0]!;
  expect(resultStatus(value)).toContain("Aguardando");
  expect(resultStatus({ ...value, stale: true, status: "error" })).toContain(
    "preservado",
  );
});
it("preserva último detalhamento válido após indisponibilidade e recusa geração demo", async () => {
  let response = Response.json(supplementalFixture());
  const request = vi.fn(async () => response) as unknown as typeof fetch;
  const client = createSupplementalClient(request, () =>
    Date.parse("2026-10-25T20:20:00Z"),
  );
  await client.refresh();
  const previous = client.get().payload;
  response = new Response("indisponível", { status: 503 });
  await client.refresh();
  expect(client.get().payload).toBe(previous);
  expect(client.get().error).toContain("503");
  response = Response.json({ ...supplementalFixture(), mode: "demo" });
  await client.refresh();
  expect(client.get().payload).toBe(previous);
  expect(client.get().error).toContain("incompatíveis");
});
it("valida municípios de governador e preserva falha do catálogo", () => {
  const value = supplementalFixture();
  value.coverage.catalog_error = "Catálogo indisponível";
  expect(parseSupplemental(value).coverage.catalog_error).toContain("Catálogo");
  value.governor_municipalities = [
    { ...value.governors[0]!, sections: { counted: -1, total: null } },
  ];
  expect(() => parseSupplemental(value)).toThrow("inválidos");
});
it("navegação municipal exige eleição e identidade territorial próprias", async () => {
  const { matchesOfficialDetail } = await import("./supplemental-navigation");
  const municipality = {
    ...supplementalFixture().governors[0]!,
    ibge_code: "3550308",
    election: "6260",
    uf: "SP",
  };
  const request = {
    tab: "governorCities" as const,
    election: "6260",
    uf: "SP",
    ibgeCode: "3550308",
  };
  expect(matchesOfficialDetail(municipality, request)).toBe(true);
  expect(
    matchesOfficialDetail(
      { ...municipality, election: "6258", office: "president" },
      request,
    ),
  ).toBe(false);
  expect(
    matchesOfficialDetail({ ...municipality, ibge_code: "3550309" }, request),
  ).toBe(false);
});
