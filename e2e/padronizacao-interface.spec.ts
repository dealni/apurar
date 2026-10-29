import { openMapActions, openMapFilters } from "./map-actions";
import { expect, test, type Locator, type Page } from "@playwright/test";
import { supplementalFixture } from "../packages/contracts/supplemental-fixture";
import { mockLivePanel } from "./bundle-fixture";

async function mockOfficialViews(page: Page) {
  await page.clock.setFixedTime(new Date("2026-10-25T21:00:00Z"));
  const payload = supplementalFixture();
  const city = payload.exterior.cities[0]!;
  city.candidates = [
    { ...city.candidates[0]!, name: "Pessoa no exterior", votes: 87 },
  ];
  city.totals.valid = 87;
  payload.exterior.countries[0]!.candidates = city.candidates;
  payload.exterior.countries[0]!.totals = city.totals;
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

async function expectWithinWidth(page: Page, locator: Locator) {
  await expect(locator).toBeVisible();
  const bounds = await locator.boundingBox();
  expect(bounds).not.toBeNull();
  expect(bounds!.width).toBeGreaterThan(0);
  expect(bounds!.x).toBeGreaterThanOrEqual(-1);
  expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(
    page.viewportSize()!.width + 1,
  );
}

async function openMobileSection(page: Page, isMobile: boolean, name: string) {
  if (!isMobile) return;
  const button = page
    .getByRole("navigation", { name: "Seções", exact: true })
    .getByRole("button", { name, exact: true });
  if (!(await button.isVisible())) return;
  await button.click();
  await expect(button).toHaveAttribute("aria-current", "page");
}

for (const view of [
  {
    name: "primeiro turno",
    path: "/1turno/",
  },
  {
    name: "Presidente",
    path: "/apurar/",
  },
  {
    name: "governadores",
    path: "/apurar/#governadores-df",
  },
  {
    name: "exterior",
    path: "/apurar/#presidente-zz-pt",
  },
]) {
  test(`${view.name} mantém menu, busca e tela cheia acessíveis na mesma navegação`, async ({
    page,
  }) => {
    await mockLivePanel(page);
    await mockOfficialViews(page);
    await page.goto(view.path);
    await expect(page.locator("canvas.map").first()).toBeVisible();
    const menuTrigger = page.getByRole("button", {
      name: "Abrir navegação",
      exact: true,
    });
    await expectWithinWidth(page, menuTrigger);
    await menuTrigger.click();
    const menu = page.getByRole("dialog", { name: "Explore o Apurar" });
    await expect(menu).toBeVisible();
    await expect(menu.getByRole("link", { name: /^Apuração/ })).toHaveAttribute(
      "href",
      "/",
    );
    await expect(
      menu.getByRole("link", { name: /^Primeiro turno/ }),
    ).toHaveAttribute("href", /\/1turno\//);
    await page.keyboard.press("Escape");
    await expect(menu).toBeHidden();
    await expect(menuTrigger).toBeFocused();

    const searchTrigger = page.getByRole("button", {
      name: /^Buscar /,
    });
    await expectWithinWidth(page, searchTrigger);
    await searchTrigger.click();
    const search = page.getByRole("dialog", { name: "Buscar", exact: true });
    await expect(search).toBeVisible();
    await expect(search.getByRole("combobox")).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(search).toHaveCount(0);
    await expect(searchTrigger).toBeFocused();

    await openMapActions(page);
    await page.getByRole("button", { name: "Tela cheia", exact: true }).click();
    await expect(
      page.getByRole("button", { name: "Sair da tela cheia", exact: true }),
    ).toBeVisible();
    await expect(page.locator("canvas.map").first()).toBeVisible();
    if (view.name === "governadores" || view.name === "exterior")
      await expect(
        page.getByRole("region", {
          name:
            view.name === "governadores"
              ? "Mapa principal de governadores"
              : "Mapa principal do exterior",
          exact: true,
        }),
      ).toBeVisible();
    await page
      .getByRole("button", { name: "Sair da tela cheia", exact: true })
      .click();
    await expect(menuTrigger).toBeVisible();
  });
}

test("governadores preservam seleção e fonte próprias ao alternar cargo", async ({
  page,
  isMobile,
}) => {
  await mockLivePanel(page);
  await mockOfficialViews(page);
  await page.goto("/apurar/#governadores-df");
  const panel = page.getByRole("region", {
    name: "Mapa principal de governadores",
  });
  const result = panel.locator('[data-result-id="DF:aggregate"]');
  await expect(result).toContainText("731 votos");
  await expect(result).toContainText("Pessoa estadual");
  await expect(result).not.toContainText("Candidatura A");
  await expect(result).not.toContainText("Pessoa no exterior");
  await openMobileSection(page, isMobile, "Explorar");
  await openMapFilters(page);
  const state = panel.getByRole("combobox", {
    name: "Estado no mapa de governadores",
  });
  await openMapFilters(page);
  const municipality = panel.getByRole("combobox", {
    name: "Município no mapa de governadores",
  });
  await expectWithinWidth(page, state);
  await openMapFilters(page);
  await municipality.selectOption("5300108");
  await expect(page).toHaveURL(/#governadores-df-5300108$/);
  const local = panel.locator('[data-result-id="DF:97012"]');
  await expect(local).toContainText("319 votos");
  await expect(local).toContainText("Fonte: 25/10/2026, 17:01:00 · Brasília");
  await openMobileSection(page, isMobile, "Resultados");
  await local.scrollIntoViewIfNeeded();
  await expectWithinWidth(page, local);
  const map = panel.locator("canvas.map").first();
  if (
    isMobile &&
    (await panel.getByRole("navigation", { name: "Seções" }).isVisible())
  )
    await expect(map).toBeHidden();
  await openMobileSection(page, isMobile, "Mapa");
  await map.scrollIntoViewIfNeeded();
  await expectWithinWidth(page, map);
  if (
    isMobile &&
    (await panel.getByRole("navigation", { name: "Seções" }).isVisible())
  )
    await expect(local).toBeHidden();
  await openMobileSection(page, isMobile, "Resultados");
  await panel
    .getByRole("button", { name: "Voltar ao estado", exact: true })
    .click();
  await expect(page).toHaveURL(/#governadores-df$/);
  await expect(result).toContainText("731 votos");
  await panel.getByRole("button", { name: "Presidente", exact: true }).click();
  await expect(page).toHaveURL(/#presidente-df$/);
  await expect(panel).toHaveCount(0);
  await expect(page.getByText("Pessoa estadual", { exact: true })).toHaveCount(
    0,
  );
});

test("exterior mantém controles e resultado utilizáveis sem o feed presidencial nacional", async ({
  page,
  isMobile,
}) => {
  await page.route("**/api/**", (route) =>
    route.fulfill({ status: 503, json: { error: "national_unavailable" } }),
  );
  await mockOfficialViews(page);
  await page.goto("/apurar/#presidente-zz-pt");
  const panel = page.getByRole("region", {
    name: "Mapa principal do exterior",
  });
  await openMobileSection(page, isMobile, "Explorar");
  const country = panel.getByRole("combobox", {
    name: "País no mapa do exterior",
  });
  const city = panel.getByRole("combobox", {
    name: "Cidade no mapa do exterior",
  });
  await expect(country).toHaveValue("PT");
  await expectWithinWidth(page, country);
  await city.selectOption({ label: "Lisboa" });
  await expect(page).toHaveURL(/#presidente-zz-29955$/);
  await openMobileSection(page, isMobile, "Resultados");
  const result = panel.locator('[data-result-id="ZZ:29955"]');
  await expect(result).toContainText("Pessoa no exterior");
  await expect(result).toContainText("87 votos");
  await expect(result).toContainText("Fonte: 25/10/2026, 17:05:00 · Brasília");
  await expect(
    result.getByRole("progressbar", { name: "Seções totalizadas" }),
  ).toHaveAttribute("aria-valuenow", "20");
  await expect(result).not.toContainText("Pessoa estadual");
  await expect(result).not.toContainText("Candidatura A");
  await openMobileSection(page, isMobile, "Resultados");
  await result.scrollIntoViewIfNeeded();
  await expectWithinWidth(page, result);
  const map = panel.locator("canvas.map").first();
  if (
    isMobile &&
    (await panel.getByRole("navigation", { name: "Seções" }).isVisible())
  )
    await expect(map).toBeHidden();
  await openMobileSection(page, isMobile, "Mapa");
  await map.scrollIntoViewIfNeeded();
  await expectWithinWidth(page, map);
  if (
    isMobile &&
    (await panel.getByRole("navigation", { name: "Seções" }).isVisible())
  )
    await expect(result).toBeHidden();
  await panel
    .getByRole("navigation", { name: "Recorte do mapa" })
    .getByRole("button", { name: "Portugal", exact: true })
    .click();
  await expect(page).toHaveURL(/#presidente-zz-pt$/);
  await expect(panel.locator('[data-result-id="PT"]')).toContainText(
    "Pessoa no exterior",
  );
});
