import {
  openImageShareMenu,
  openMapActions,
  openMapFilters,
} from "./map-actions";
import { expect, test, type Page } from "@playwright/test";
import { supplementalFixture } from "../packages/contracts/supplemental-fixture";
import { mockLivePanel } from "./bundle-fixture";

async function dadosControlados(page: Page, scenario = "normal") {
  await page.route("**/api/**", (route) =>
    route.fulfill({ status: 503, json: {} }),
  );
  await mockLivePanel(page);
  const payload = supplementalFixture();
  const base = payload.exterior.cities[0]!;
  const estadual = {
    ...base,
    id: "DF:aggregate",
    name: "Distrito Federal",
    scope: "state" as const,
    office: "governor" as const,
    election: "6260",
    uf: "DF",
    as_of: "2026-10-25T20:20:00Z" as string | null,
    candidates: [
      { ...base.candidates[0]!, id: "11", name: "Estadual Alfa", votes: 650 },
      { ...base.candidates[0]!, id: "22", name: "Estadual Beta", votes: 350 },
    ],
    sections: { counted: 7, total: 10 },
    totals: { ...base.totals, valid: 1000 },
    source_url: null,
  };
  if (scenario === "empate" || scenario === "zero") {
    estadual.candidates = estadual.candidates.map((candidate) => ({
      ...candidate,
      votes: scenario === "zero" ? 0 : 50,
    }));
    estadual.totals.valid = scenario === "zero" ? 0 : 100;
  }
  if (scenario === "precontagem") {
    estadual.as_of = null;
    estadual.generated_at = "2026-10-25T20:20:00Z";
    estadual.sections = { counted: 0, total: 100 };
    estadual.candidates = estadual.candidates.map((candidate) => ({
      ...candidate,
      votes: 0,
    }));
    estadual.totals = {
      valid: 0,
      blank: 0,
      null: 0,
      turnout: 0,
      electorate: 15000,
      abstention: null,
    };
  }
  if (scenario === "stale") estadual.stale = true;
  if (scenario === "withheld") estadual.status = "withheld";
  payload.governors = [estadual, payload.governors[0]!];
  payload.governor_municipalities = [
    {
      ...estadual,
      id: "DF:97012",
      name: "Brasília",
      scope: "municipality",
      ibge_code: "5300108",
      tse_code: "97012",
      as_of: "2026-10-25T20:01:00Z",
      sections: { counted: 2, total: 10 },
      candidates: estadual.candidates.map((candidate, index) => ({
        ...candidate,
        votes: index === 0 ? 65 : 35,
      })),
      totals: { ...base.totals, valid: 100 },
    },
  ];
  await page.route("**/api/supplemental", (route) =>
    route.fulfill({ json: payload }),
  );
}

function painel(page: Page) {
  return page.getByRole("region", { name: "Mapa principal de governadores" });
}

async function secao(page: Page, name: string) {
  const navigation = painel(page).getByRole("navigation", { name: "Seções" });
  if (await navigation.isVisible())
    await navigation.getByRole("button", { name, exact: true }).click();
}

test("fluxo Brasil, UF e município preserva contexto entre cargos e permite retorno", async ({
  page,
}) => {
  await dadosControlados(page);
  await page.goto("/apurar/#governadores");
  await secao(page, "Explorar");
  await openMapFilters(page);
  await painel(page)
    .getByLabel("Estado no mapa de governadores")
    .selectOption("DF");
  await expect(page).toHaveURL(/#governadores-df$/);
  await openMapFilters(page);
  await painel(page)
    .getByLabel("Município no mapa de governadores")
    .selectOption("5300108");
  await expect(page).toHaveURL(/#governadores-df-5300108$/);
  await secao(page, "Resultados");
  const detail = painel(page).getByRole("complementary", {
    name: "Resultado de governadores selecionado",
  });
  await expect(
    detail.getByRole("heading", { name: "Brasília", exact: true }),
  ).toBeVisible();
  await expect(detail).toContainText("65 votos");
  await expect(detail).not.toContainText("650 votos");
  await expect(detail).toContainText("17:01:00 · Brasília");
  await expect(detail.locator(".apur")).not.toContainText(/faltam.*eleitores/);
  await expect(
    detail.getByRole("progressbar", { name: "Seções totalizadas" }),
  ).toHaveAttribute("aria-valuenow", "20");
  await painel(page)
    .getByRole("button", { name: "Presidente", exact: true })
    .click();
  await expect(page).toHaveURL(/#presidente-df-5300108$/);
  await page.getByRole("button", { name: "Governadores", exact: true }).click();
  await expect(page).toHaveURL(/#governadores-df-5300108$/);
  await secao(page, "Resultados");
  await painel(page)
    .getByRole("button", { name: "Voltar ao estado", exact: true })
    .click();
  await expect(page).toHaveURL(/#governadores-df$/);
  await expect(detail).toContainText("650 votos");
  await expect(detail).toContainText("17:20:00 · Brasília");
  await painel(page)
    .getByRole("button", { name: "Fechar o estado", exact: true })
    .click();
  await expect(page).toHaveURL(/#governadores$/);
  await expect(detail).toContainText("Selecione um estado");
});

test("busca de governador navega por teclado e devolve foco ao cancelar", async ({
  page,
}) => {
  await dadosControlados(page);
  await page.goto("/apurar/#governadores");
  const trigger = painel(page).getByRole("button", {
    name: "Buscar município ou estado",
    exact: true,
  });
  await trigger.click();
  const dialog = page.getByRole("dialog", { name: "Buscar", exact: true });
  const input = dialog.getByRole("combobox");
  await expect(input).toBeFocused();
  await input.fill("Brasília");
  await expect(dialog.getByRole("option").first()).toContainText("Brasília");
  await input.press("Enter");
  await expect(page).toHaveURL(/#governadores-df-5300108$/);
  await expect(dialog).toHaveCount(0);
  await trigger.click();
  await input.fill("zzzzzznenhumlugar");
  await expect(dialog).toContainText("Nada encontrado");
  await input.press("Escape");
  await expect(trigger).toBeFocused();
  await expect(page).toHaveURL(/#governadores-df-5300108$/);
});

for (const width of [320, 390, 768, 1440]) {
  test(`mapa, cargos e resultados permanecem utilizáveis em ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await dadosControlados(page);
    await page.goto("/apurar/#presidente-df-5300108");
    const president = page.getByRole("button", {
      name: "Presidente",
      exact: true,
    });
    const presidentMap = await page
      .getByRole("img", { name: "Mapa eleitoral do Brasil" })
      .boundingBox();
    const metrics = await president.evaluate((node) => ({
      font: getComputedStyle(node).fontFamily,
      size: getComputedStyle(node).fontSize,
      height: node.getBoundingClientRect().height,
    }));
    await page
      .getByRole("button", { name: "Governadores", exact: true })
      .click();
    const governor = painel(page).getByRole("button", {
      name: "Governadores",
      exact: true,
    });
    await expect(governor).toHaveAttribute("aria-pressed", "true");
    await expect(governor).toHaveCSS("font-family", metrics.font);
    await expect(governor).toHaveCSS("font-size", metrics.size);
    const bounds = await governor.boundingBox();
    expect(bounds!.height).toBeGreaterThanOrEqual(metrics.height - 1);
    await secao(page, "Mapa");
    const map = painel(page).getByRole("img", {
      name: "Mapa eleitoral do Brasil",
    });
    await expect(map).toBeVisible();
    // O canvas começa em 800px; a medida real chega pelo ResizeObserver.
    await expect
      .poll(() =>
        map.evaluate((canvas) => {
          const stage = canvas.closest(".gov-stage")!;
          return (
            Math.abs(
              canvas.getBoundingClientRect().width -
                stage.getBoundingClientRect().width,
            ) < 1
          );
        }),
      )
      .toBe(true);
    const mapBounds = await map.boundingBox();
    expect(mapBounds!.width).toBeGreaterThan(presidentMap!.width * 0.8);
    expect(mapBounds!.height).toBeGreaterThan(
      Math.min(240, presidentMap!.height * 0.8),
    );
    await secao(page, "Resultados");
    const detail = painel(page).getByRole("complementary", {
      name: "Resultado de governadores selecionado",
    });
    await expect(
      detail.getByRole("heading", { name: "Brasília", exact: true }),
    ).toBeVisible();
    await expect(
      detail.getByText("Estadual Alfa", { exact: true }).first(),
    ).toBeVisible();
    await expect(detail.locator(".votes").first()).toBeVisible();
    await expect(detail.locator(".votes").first()).toHaveText(/65\s*votos/);
    const detailBounds = await detail.boundingBox();
    expect(detailBounds!.x).toBeGreaterThanOrEqual(0);
    expect(detailBounds!.x + detailBounds!.width).toBeLessThanOrEqual(
      width + 1,
    );
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBe(width);
  });
}

test("ausência estadual e município sem publicação não viram resultado zero", async ({
  page,
}) => {
  await dadosControlados(page);
  await page.goto("/apurar/#governadores-ac-1200401");
  await secao(page, "Resultados");
  const detail = painel(page).getByRole("complementary", {
    name: "Resultado de governadores selecionado",
  });
  await expect(
    detail.getByRole("heading", { name: "Rio Branco", exact: true }),
  ).toBeVisible();
  await expect(detail).toContainText("indisponível");
  await expect(detail).not.toContainText("0 votos");
  await expect(detail).not.toContainText("Estadual Alfa");
  await secao(page, "Explorar");
  await openMapFilters(page);
  await painel(page)
    .getByLabel("Estado no mapa de governadores")
    .selectOption("SP");
  await secao(page, "Resultados");
  await expect(detail).toContainText("Sem disputa");
  await expect(detail.getByRole("progressbar")).toHaveCount(0);
  await expect(detail).not.toContainText("0 votos");
});

test("modo TV mostra o recorte e permite retornar antes de exportar PNG próprio", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await dadosControlados(page);
  await page.goto("/apurar/#governadores-df-5300108");
  await openMapActions(page);
  await painel(page)
    .getByRole("button", { name: "Tela cheia", exact: true })
    .click();
  await expect(
    painel(page).getByRole("button", {
      name: "Sair da tela cheia",
      exact: true,
    }),
  ).toBeVisible();
  await expect(painel(page).locator(".votes").first()).toBeVisible();
  await expect(painel(page).locator(".votes").first()).toHaveText(/65\s*votos/);
  await painel(page)
    .getByRole("button", { name: "Sair da tela cheia", exact: true })
    .click();
  await expect(page).toHaveURL(/#governadores-df-5300108$/);
  await openMapActions(page);
  await expect(
    painel(page).getByRole("button", { name: "Tela cheia", exact: true }),
  ).toBeVisible();
  const download = page.waitForEvent("download");
  await openImageShareMenu(page);
  await page
    .getByRole("dialog", { name: "Compartilhar", exact: true })
    .getByRole("button", { name: "Compartilhar imagem", exact: true })
    .click();
  expect((await download).suggestedFilename()).toBe(
    "apurar-governadores-df-municipio.png",
  );
});

test("layout alternativo com abas mantém navegação ao mapa depois da seleção", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
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
  await dadosControlados(page);
  await page.goto("/apurar/#governadores");
  const navigation = painel(page).getByRole("navigation", { name: "Seções" });
  await expect(navigation).toBeVisible();
  await navigation
    .getByRole("button", { name: "Explorar", exact: true })
    .click();
  await openMapFilters(page);
  await painel(page)
    .getByLabel("Estado no mapa de governadores")
    .selectOption("DF");
  await expect(
    navigation.getByRole("button", { name: "Mapa", exact: true }),
  ).toHaveAttribute("aria-current", "page");
  await expect(
    painel(page).getByRole("img", { name: "Mapa eleitoral do Brasil" }),
  ).toBeVisible();
  await navigation
    .getByRole("button", { name: "Resultados", exact: true })
    .click();
  await expect(painel(page).locator(".votes").first()).toBeVisible();
  await expect(painel(page).locator(".votes").first()).toHaveText(
    /650\s*votos/,
  );
});

for (const scenario of ["empate", "zero", "stale", "withheld"]) {
  test(`estado ${scenario} não anuncia liderança ou percentuais indevidos`, async ({
    page,
  }) => {
    await dadosControlados(page, scenario);
    await page.goto("/apurar/#governadores-df");
    await secao(page, "Resultados");
    const detail = painel(page).getByRole("complementary", {
      name: "Resultado de governadores selecionado",
    });
    await expect(detail).not.toContainText("lidera a apuração");
    if (scenario === "empate")
      await expect(detail).toContainText("Empate nos votos computados");
    if (scenario === "zero")
      await expect(detail).toContainText("Nenhum voto computado ainda");
    if (scenario === "stale") {
      await expect(detail).toContainText("Último resultado preservado");
      await expect(detail).toContainText("650 votos");
    }
    if (scenario === "withheld") {
      await expect(detail).not.toContainText("650 votos");
      await expect(detail).toContainText("Indisponível");
    }
    if (scenario === "stale" || scenario === "withheld") {
      await expect(
        detail.getByText("Percentual indisponível", { exact: true }),
      ).toHaveCount(2);
      await expect(
        detail.getByRole("img", { name: /50% dos votos/ }),
      ).toHaveCount(0);
    }
  });
}

test("pré-contagem sem horário da fonte preserva eleitorado e zeros oficiais", async ({
  page,
}) => {
  await dadosControlados(page, "precontagem");
  await page.goto("/apurar/#governadores-df");
  await secao(page, "Resultados");
  const detail = painel(page).getByRole("complementary", {
    name: "Resultado de governadores selecionado",
  });
  await expect(
    detail.getByText("Fonte: Horário da fonte indisponível", { exact: true }),
  ).toBeVisible();
  await expect(detail.locator(".votes")).toHaveCount(2);
  for (const votes of await detail.locator(".votes").all())
    await expect(votes).toHaveText(/0\s*votos/);
  const electorate = detail.locator(".kpi").filter({ hasText: "Eleitorado" });
  await expect(electorate).toContainText("15.000");
  for (const label of ["Votos válidos", "Brancos", "Nulos", "Comparecimento"]) {
    await expect(
      detail.locator(".kpi").filter({ hasText: label }).locator(".v .sr"),
    ).toHaveText("0");
  }
  await expect(detail).toContainText("Seções totalizadas");
  await expect(detail.locator(".kpi1")).toContainText("0 de 100");
  await expect(detail).not.toContainText("lidera a apuração");
  await expect(
    detail.getByText("Percentual indisponível", { exact: true }),
  ).toHaveCount(2);
  await expect(detail.getByRole("img", { name: /50% dos votos/ })).toHaveCount(
    0,
  );
});
