import { openMapActions, openMapFilters } from "./map-actions";
import { expect, test, type Page, type TestInfo } from "@playwright/test";
import { supplementalFixture } from "../packages/contracts/supplemental-fixture";
import { mockLivePanel } from "./bundle-fixture";

async function preparar(page: Page) {
  await page.route("**/api/**", (route) =>
    route.fulfill({ status: 503, json: {} }),
  );
  await mockLivePanel(page);
  const payload = supplementalFixture();
  const city = payload.exterior.cities[0]!;
  city.candidates = [
    { ...city.candidates[0]!, name: "Pessoa exterior", votes: 87 },
  ];
  city.totals.valid = 87;
  payload.exterior.countries[0] = {
    ...city,
    id: "PT",
    name: "Portugal",
    scope: "country",
    coverage: { available: 1, total: 3 },
  };
  const state = {
    ...city,
    id: "DF:aggregate",
    name: "Distrito Federal",
    scope: "state" as const,
    office: "governor" as const,
    election: "6260",
    uf: "DF",
    as_of: "2026-10-25T20:20:00Z",
    candidates: [
      { ...city.candidates[0]!, name: "Pessoa estadual", votes: 731 },
    ],
    totals: { ...city.totals, valid: 731 },
    source_url: null,
  };
  payload.governors = [state];
  payload.governor_municipalities = [
    {
      ...state,
      id: "DF:97012",
      name: "Brasília",
      scope: "municipality",
      ibge_code: "5300108",
      tse_code: "97012",
      as_of: "2026-10-25T20:01:00Z",
      candidates: [{ ...state.candidates[0]!, votes: 319 }],
      totals: { ...state.totals, valid: 319 },
    },
  ];
  await page.route("**/api/supplemental", (route) =>
    route.fulfill({ json: payload }),
  );
}

async function secao(page: Page, name: string) {
  const nav = page.getByRole("navigation", { name: "Seções", exact: true });
  if (await nav.isVisible()) {
    const button = nav.getByRole("button", { name, exact: true });
    await button.click();
    await expect(button).toHaveAttribute("aria-current", "page");
  }
}

async function captura(page: Page, info: TestInfo, name: string) {
  const path = info.outputPath(`${name}.png`);
  await page.screenshot({ path, fullPage: true, animations: "disabled" });
  await info.attach(name, { path, contentType: "image/png" });
}

async function controles(page: Page) {
  const search = page.getByRole("button", { name: /^Buscar / });
  await search.click();
  const dialog = page.getByRole("dialog", { name: "Buscar", exact: true });
  await expect(dialog.getByRole("combobox")).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  await expect(search).toBeFocused();
  const menu = page.getByRole("button", {
    name: "Abrir navegação",
    exact: true,
  });
  await menu.click();
  await expect(
    page.getByRole("dialog", { name: "Explore o Apurar" }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(menu).toBeFocused();
  await openMapActions(page);
  await page.getByRole("button", { name: "Tela cheia", exact: true }).click();
  const tvMap = page.locator("canvas.map").first();
  await expect(tvMap).toBeVisible();
  await expect(tvMap).toHaveCSS("touch-action", "none");
  const viewport = page.viewportSize()!;
  const exteriorLegend = page.locator(".exterior-map-key");
  if (
    viewport.width < 600 &&
    viewport.height > viewport.width &&
    (await exteriorLegend.count())
  ) {
    const mapBox = await tvMap.boundingBox();
    const legendBox = await exteriorLegend.boundingBox();
    expect(legendBox!.y).toBeGreaterThanOrEqual(mapBox!.y + mapBox!.height - 1);
  }
  await page
    .getByRole("button", { name: "Sair da tela cheia", exact: true })
    .click();
  await expect(search).toBeVisible();
}

const views = [
  { name: "presidente", path: "/apurar/", result: null },
  {
    name: "governadores",
    path: "/apurar/#governadores-df",
    result: "DF:aggregate",
  },
  { name: "exterior", path: "/apurar/#presidente-zz-pt", result: "PT" },
  { name: "primeiro-turno", path: "/1turno/", result: null },
];
for (const viewport of [
  { width: 320, height: 740 },
  { width: 390, height: 844 },
  { width: 768, height: 1024 },
  { width: 844, height: 390 },
  { width: 1440, height: 900 },
]) {
  test(`quatro vistas preservam navegação e leitura em ${viewport.width}x${viewport.height}`, async ({
    page,
  }, info) => {
    await page.setViewportSize(viewport);
    await preparar(page);
    let typography: { font: string; size: string } | undefined;
    for (const view of views) {
      await test.step(`Vista ${view.name}`, async () => {
        await page.goto(view.path);
        await secao(page, "Mapa");
        const map = page.locator("canvas.map").first();
        await expect(map).toBeVisible();
        const bounds = await map.boundingBox();
        expect(bounds!.width).toBeGreaterThan(200);
        expect(bounds!.height).toBeGreaterThan(90);
        const search = page.getByRole("button", { name: /^Buscar / });
        const current = await search.evaluate((node) => ({
          font: getComputedStyle(node).fontFamily,
          size: getComputedStyle(node).fontSize,
        }));
        if (typography) expect(current).toEqual(typography);
        typography = current;
        expect(
          await page.evaluate(() => document.documentElement.scrollWidth),
        ).toBe(viewport.width);
        await captura(page, info, `${view.name}-mapa`);
        await controles(page);
        await secao(page, "Resultados");
        if (view.result) {
          const result = page.locator(`[data-result-id="${view.result}"]`);
          await expect(result).toBeVisible();
          await expect(result).toContainText(
            view.name === "exterior" ? "87 votos" : "731 votos",
          );
          await expect(result).toContainText(
            view.name === "exterior" ? "17:05:00" : "17:20:00",
          );
          await expect(result).not.toContainText("Candidatura A");
          const box = await result.boundingBox();
          expect(box!.x).toBeGreaterThanOrEqual(0);
          expect(box!.x + box!.width).toBeLessThanOrEqual(viewport.width + 1);
          await expect(
            page.getByRole("button", { name: /Histórico|Agora/ }),
          ).toHaveCount(0);
        }
        await captura(page, info, `${view.name}-resultados`);
      });
    }
  });
}

test("seletores e busca preservam a fonte e o recorte ao trocar cargo e país", async ({
  page,
}) => {
  await preparar(page);
  await page.goto("/apurar/#governadores");
  await secao(page, "Explorar");
  await openMapFilters(page);
  await page.getByLabel("Estado no mapa de governadores").selectOption("DF");
  await secao(page, "Explorar");
  await openMapFilters(page);
  await page
    .getByLabel("Município no mapa de governadores")
    .selectOption("5300108");
  await expect(page).toHaveURL(/#governadores-df-5300108$/);
  await secao(page, "Resultados");
  await expect(page.locator('[data-result-id="DF:97012"]')).toContainText(
    "319 votos",
  );
  await page.getByRole("button", { name: "Presidente", exact: true }).click();
  await expect(page).toHaveURL(/#presidente-df-5300108$/);
  await page.getByRole("button", { name: "Governadores", exact: true }).click();
  await expect(page).toHaveURL(/#governadores-df-5300108$/);
  await secao(page, "Resultados");
  await expect(page.locator('[data-result-id="DF:97012"]')).toContainText(
    "17:01:00",
  );
  await page.goto("/apurar/#presidente-zz-pt");
  await secao(page, "Resultados");
  await expect(page.locator('[data-result-id="PT"]')).toContainText("parcial");
  await secao(page, "Explorar");
  await page
    .getByLabel("Cidade no mapa do exterior")
    .selectOption({ label: "Lisboa" });
  await expect(page).toHaveURL(/#presidente-zz-29955$/);
  await secao(page, "Resultados");
  const city = page.locator('[data-result-id="ZZ:29955"]');
  await expect(city).toContainText("87 votos");
  await expect(city).toContainText("17:05:00");
  await expect(city).not.toContainText("731 votos");
  const search = page.getByRole("button", { name: /^Buscar / });
  await search.click();
  const input = page
    .getByRole("dialog", { name: "Buscar", exact: true })
    .getByRole("combobox");
  await input.fill("Portugal");
  await expect(
    page
      .getByRole("dialog", { name: "Buscar", exact: true })
      .getByRole("option")
      .first(),
  ).toContainText("Portugal");
  await input.press("Enter");
  await expect(page).toHaveURL(/#presidente-zz-pt$/);
});

for (const shell of [false, true]) {
  test(`gestos preservam rolagem e zoom nas três vistas em ${shell ? "abas" : "fluxo"}`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    if (shell)
      await page.addInitScript(() => {
        let config: Record<string, unknown>;
        Object.defineProperty(window, "APURACAO", {
          configurable: true,
          get: () => config,
          set: (value) => {
            config = { ...value, shell: true };
          },
        });
      });
    await preparar(page);
    for (const view of views.slice(0, 3)) {
      await test.step(`Gestos ${view.name}`, async () => {
        await page.goto(view.path);
        await secao(page, "Mapa");
        const map = page.locator("canvas.map").first();
        await expect(map).toBeVisible();
        await expect(map).toHaveCSS("touch-action", shell ? "none" : "pan-y");
        const zoom = page.getByRole("button", {
          name: "Aproximar o mapa",
          exact: true,
        });
        await expect(zoom).toBeEnabled();
        await zoom.click();
        const reset = page.getByRole("button", {
          name: "Voltar ao enquadramento",
          exact: true,
        });
        await expect(reset).toBeVisible();
        await expect(map).toHaveCSS("touch-action", "none");
        await reset.click();
        await expect(reset).toHaveCount(0);
        await expect(map).toHaveCSS("touch-action", shell ? "none" : "pan-y");
        await openMapActions(page);
        await page
          .getByRole("button", { name: "Tela cheia", exact: true })
          .click();
        await expect(map).toBeVisible();
        await expect(map).toHaveCSS("touch-action", "none");
        await page
          .getByRole("button", { name: "Sair da tela cheia", exact: true })
          .click();
        await secao(page, "Mapa");
        await expect(map).toHaveCSS("touch-action", shell ? "none" : "pan-y");
      });
    }
  });
}
