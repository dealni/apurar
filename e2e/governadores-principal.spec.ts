import { openImageShareMenu, openMapFilters } from "./map-actions";
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
  if (!(await button.isVisible())) return;
  await button.click();
  await expect(button).toHaveAttribute("aria-current", "page");
}

async function officialGovernor(page: import("@playwright/test").Page) {
  const payload = supplementalFixture();
  const candidates = [
    {
      ...payload.exterior.cities[0]!.candidates[0]!,
      id: "11",
      name: "Candidata estadual A",
      votes: 65,
    },
    {
      ...payload.exterior.cities[0]!.candidates[0]!,
      id: "22",
      name: "Candidato estadual B",
      votes: 35,
    },
  ];
  const result = {
    ...payload.exterior.cities[0]!,
    id: "DF:aggregate",
    name: "Distrito Federal",
    scope: "state" as const,
    uf: "DF",
    office: "governor" as const,
    election: "6260",
    as_of: "2026-10-25T20:20:00Z",
    candidates,
  };
  payload.governors = [result];
  payload.governor_municipalities = [
    {
      ...result,
      id: "DF:97012",
      name: "Brasília",
      scope: "municipality",
      ibge_code: "5300108",
      tse_code: "97012",
      as_of: "2026-10-25T20:01:00Z",
    },
  ];
  await page.route("**/api/supplemental", (route) =>
    route.fulfill({ json: payload }),
  );
}

test("governadores usam mapa principal, seleção de cargo e fonte municipal própria", async ({
  page,
  isMobile,
}) => {
  await officialGovernor(page);
  await page.goto("/apurar/#governadores-df-5300108");
  const panel = page.getByRole("region", {
    name: "Mapa principal de governadores",
  });
  await expect(panel.locator("canvas.map").first()).toBeVisible();
  await expect(
    panel.getByRole("button", { name: "Governadores", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  if (isMobile) {
    const selected = panel.getByRole("button", {
      name: /Ver resultado oficial/,
    });
    if (await selected.isVisible()) await selected.click();
  }
  await expect(
    panel.getByText("Fonte: 25/10/2026, 17:01:00 · Brasília", { exact: true }),
  ).toBeVisible();
  await expect(
    panel.getByText("Fonte: 25/10/2026, 17:20:00 · Brasília", { exact: true }),
  ).toHaveCount(0);
  await expect(
    panel.getByText("Candidata estadual A", { exact: true }).first(),
  ).toBeVisible();
  await expect(panel.locator(".apurar-projection,.tlbar,.sh-tl")).toHaveCount(
    0,
  );
  await panel.getByRole("button", { name: "Presidente", exact: true }).click();
  await expect(page).toHaveURL(/#presidente-df-5300108/);
  await expect(panel).toHaveCount(0);
});

test("UF sem segundo turno mantém mapa neutro e não mostra resultado presidencial", async ({
  page,
  isMobile,
}) => {
  await officialGovernor(page);
  await page.goto("/apurar/#governadores-sp");
  const panel = page.getByRole("region", {
    name: "Mapa principal de governadores",
  });
  await openMobileSection(page, isMobile, "Resultados");
  await expect(panel.locator(".gov-detail")).toContainText("Sem disputa");
  await expect(panel.locator(".gov-detail")).toBeVisible();
  await expect(panel.locator(".official-result")).toHaveCount(0);
  await openMobileSection(page, isMobile, "Explorar");
  await openMapFilters(page);
  await expect(
    panel.getByRole("combobox", { name: "Estado no mapa de governadores" }),
  ).toHaveValue("SP");
  await openMobileSection(page, isMobile, "Mapa");
  await expect(panel.locator("canvas.map").first()).toBeVisible();
});

test("exportação do mapa de governadores gera arquivo próprio", async ({
  page,
  isMobile,
}) => {
  await officialGovernor(page);
  await page.goto("/apurar/#governadores-df");
  const panel = page.getByRole("region", {
    name: "Mapa principal de governadores",
  });
  await expect(panel.locator("canvas.map").first()).toBeVisible();
  await openMobileSection(page, isMobile, "Explorar");
  const download = page.waitForEvent("download");
  await openImageShareMenu(page);
  await page
    .getByRole("dialog", { name: "Compartilhar", exact: true })
    .getByRole("button", { name: "Compartilhar imagem", exact: true })
    .click();
  await expect((await download).suggestedFilename()).toBe(
    "apurar-governadores-df.png",
  );
});

test("clique real no mapa principal seleciona município sem bloqueio das camadas decorativas", async ({
  page,
  isMobile,
}) => {
  await officialGovernor(page);
  await page.goto("/apurar/#governadores-df");
  const panel = page.getByRole("region", {
    name: "Mapa principal de governadores",
  });
  const canvas = panel.getByRole("img", { name: "Mapa eleitoral do Brasil" });
  await expect(canvas).toBeVisible();
  const bounds = await canvas.boundingBox();
  expect(bounds).not.toBeNull();
  await canvas.click({
    position: { x: bounds!.width / 2, y: bounds!.height / 2 },
  });
  await expect(page).toHaveURL(/#governadores-df-5300108$/);
  await expect(canvas).toBeVisible();
  await openMobileSection(page, isMobile, "Explorar");
  await openMapFilters(page);
  await expect(
    panel.getByLabel("Município no mapa de governadores"),
  ).toHaveValue("5300108");
  await openMobileSection(page, isMobile, "Resultados");
  await expect(panel.locator(".official-result")).toBeVisible();
  await expect(panel.locator(".official-result")).toContainText(
    "Fonte: 25/10/2026, 17:01:00 · Brasília",
  );
});
