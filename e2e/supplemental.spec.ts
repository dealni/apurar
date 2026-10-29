import { openMapFilters } from "./map-actions";
import { test, expect } from "@playwright/test";
import { supplementalFixture } from "../packages/contracts/supplemental-fixture";

test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(new Date("2026-10-25T21:00:00Z"));
});

async function openMobileSection(
  page: import("@playwright/test").Page,
  isMobile: boolean,
  name: string,
) {
  if (!isMobile) return;
  const button = page
    .getByRole("navigation", { name: "Seções", exact: true })
    .getByRole("button", { name, exact: true });
  if (await button.isVisible()) await button.click();
}

test("governadores e exterior exibem ausência, fonte própria e votos oficiais", async ({
  page,
  isMobile,
}) => {
  await page.route("**/api/supplemental", (route) =>
    route.fulfill({ json: supplementalFixture() }),
  );
  await page.goto("/apurar/?painel=governadores");
  const map = page.getByRole("region", {
    name: "Mapa principal de governadores",
  });
  await openMobileSection(page, isMobile, "Explorar");
  await openMapFilters(page);
  await map.getByLabel("Estado no mapa de governadores").selectOption("AC");
  await openMobileSection(page, isMobile, "Resultados");
  await expect(
    map
      .getByRole("complementary", {
        name: "Resultado de governadores selecionado",
      })
      .getByText("Fonte: Horário da fonte indisponível", { exact: true }),
  ).toBeVisible();
  await expect(
    map.getByText("Contagem de seções indisponível nesta atualização."),
  ).toBeVisible();
  await page.goto("/apurar/#presidente-zz-29955");
  await openMobileSection(page, isMobile, "Resultados");
  const result = page.locator('[data-result-id="ZZ:29955"]');
  await expect(result).toBeVisible();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(
    result.getByText("Candidatura oficial de teste", { exact: true }),
  ).toBeVisible();
  const candidate = result.locator(".leader").filter({
    hasText: "Candidatura oficial de teste",
  });
  await expect(candidate.locator(".votes .sr")).toHaveText("100");
  await expect(candidate.locator('.votes [aria-hidden="true"]')).toHaveText(
    "100",
  );
  await expect(
    candidate.getByText("Percentual indisponível", { exact: true }),
  ).toBeVisible();
  await expect(candidate.locator(".fig")).toHaveCount(0);
  await expect(candidate).not.toContainText("100%");
  await expect(result).toContainText("17:05:00 · Brasília");
  await expect(
    result.getByRole("link", { name: "Ver resultado no TSE" }),
  ).toHaveAttribute("href", /resultados\.tse\.jus\.br/);
  await expect(
    page.getByRole("button", { name: "Zonas eleitorais", exact: true }),
  ).toHaveCount(0);
});
test("seleção geográfica exterior usa o código TSE e navega país e cidade", async ({
  page,
  isMobile,
}) => {
  await page.route("**/api/supplemental", (route) =>
    route.fulfill({
      contentType: "application/json",
      body: JSON.stringify(supplementalFixture()),
    }),
  );
  await page.goto("/apurar/#presidente-zz-29955");
  await openMobileSection(page, isMobile, "Resultados");
  await expect(
    page.getByRole("heading", { name: "Lisboa", exact: true }).first(),
  ).toBeVisible();
  await expect(
    page.locator('[data-result-id="ZZ:29955"]').first(),
  ).toBeVisible();
  await expect(
    page
      .locator('[data-result-id="ZZ:29955"]')
      .first()
      .getByText("Candidatura oficial de teste", { exact: true }),
  ).toBeVisible();
  await page.goto("/apurar/#presidente-zz-pt");
  await openMobileSection(page, isMobile, "Resultados");
  await expect(page.locator('[data-result-id="PT"]').first()).toBeVisible();
  await openMobileSection(page, isMobile, "Explorar");
  await page
    .getByLabel("Cidade no mapa do exterior")
    .selectOption({ label: "Lisboa" });
  await openMobileSection(page, isMobile, "Resultados");
  await expect(
    page.locator('[data-result-id="ZZ:29955"]').first(),
  ).toBeVisible();
});
test("mapa de governador preserva horário municipal e neutralidade fora do segundo turno", async ({
  page,
  isMobile,
}) => {
  const payload = supplementalFixture();
  payload.governors = [
    {
      ...payload.exterior.cities[0]!,
      id: "DF:aggregate",
      name: "Distrito Federal",
      election: "6260",
      office: "governor",
      uf: "DF",
      as_of: "2026-10-25T20:20:00Z",
    },
  ];
  payload.governor_municipalities = [
    {
      ...payload.governors[0]!,
      id: "DF:97012",
      name: "Brasília",
      tse_code: "97012",
      ibge_code: "5300108",
      as_of: "2026-10-25T20:01:00Z",
    },
  ];
  await page.route("**/api/supplemental", (route) =>
    route.fulfill({
      contentType: "application/json",
      body: JSON.stringify(payload),
    }),
  );
  await page.goto("/apurar/?painel=governadores");
  const map = page.getByRole("region", {
    name: "Mapa principal de governadores",
  });
  await openMobileSection(page, isMobile, "Explorar");
  await openMapFilters(page);
  await map
    .getByRole("combobox", { name: "Estado no mapa de governadores" })
    .selectOption("DF");
  await expect(map.locator(".marks")).not.toHaveClass(/moving/);
  await openMapFilters(page);
  await map
    .getByRole("combobox", { name: "Município no mapa de governadores" })
    .selectOption("5300108");
  await openMobileSection(page, isMobile, "Resultados");
  await expect(
    map.getByRole("heading", { name: "Brasília", exact: true }),
  ).toBeVisible();
  await expect(
    map.getByText("Município · IBGE 5300108", { exact: true }),
  ).toBeVisible();
  await expect(
    map
      .getByRole("complementary", {
        name: "Resultado de governadores selecionado",
      })
      .getByText("Fonte: 25/10/2026, 17:01:00 · Brasília", { exact: true }),
  ).toBeVisible();
  await expect(
    map.getByText("Fonte: 25/10/2026, 17:20:00 · Brasília"),
  ).toHaveCount(0);
  await openMobileSection(page, isMobile, "Explorar");
  await openMapFilters(page);
  await map
    .getByRole("combobox", { name: "Município no mapa de governadores" })
    .selectOption("");
  await openMobileSection(page, isMobile, "Mapa");
  await expect(map.locator(".marks")).not.toHaveClass(/moving/);
  const canvas = map.getByRole("img", { name: "Mapa eleitoral do Brasil" });
  const bounds = await canvas.boundingBox();
  await canvas.click({
    position: { x: bounds!.width / 2, y: bounds!.height / 2 },
  });
  await openMobileSection(page, isMobile, "Explorar");
  await openMapFilters(page);
  await expect(
    map.getByRole("combobox", { name: "Município no mapa de governadores" }),
  ).toHaveValue("5300108");
  await openMapFilters(page);
  await map
    .getByRole("combobox", { name: "Estado no mapa de governadores" })
    .selectOption("SP");
  await openMobileSection(page, isMobile, "Resultados");
  await expect(
    map
      .getByRole("status")
      .filter({ hasText: "Sem disputa de governador neste segundo turno" }),
  ).toBeVisible();
  await expect(map.locator(".official-result")).toHaveCount(0);
});
for (const query of [""])
  test(`município e links legados não acessam zonas no segundo turno ${query || "ao vivo"}`, async ({
    page,
  }) => {
    const zonalRequests: string[] = [];
    page.on("request", (request) => {
      if (
        /^\/api\/.*(?:zonas|zones|locais)/.test(new URL(request.url()).pathname)
      )
        zonalRequests.push(request.url());
    });
    await page.goto(`/apurar/${query}#presidente-sp-3550308-z1`);
    await expect(
      page.getByRole("heading", { name: "São Paulo", exact: true }).first(),
    ).toBeVisible();
    await expect(page).toHaveURL(/#presidente-sp-3550308$/);
    await expect(
      page.getByRole("button", { name: "Ver zonas oficiais", exact: true }),
    ).toHaveCount(0);
    await expect(
      page.getByText("Zonas eleitorais", { exact: true }),
    ).toHaveCount(0);
    await page.evaluate(() =>
      window.dispatchEvent(
        new CustomEvent("apurar:official-detail", {
          detail: { tab: "zones", uf: "SP", ibgeCode: "3550308" },
        }),
      ),
    );
    await expect(
      page.getByRole("dialog", {
        name: "Detalhamento oficial do segundo turno",
      }),
    ).toHaveCount(0);
    expect(zonalRequests).toEqual([]);
  });
