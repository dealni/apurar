import { test, expect, type Page } from "@playwright/test";
import { supplementalFixture } from "../packages/contracts/supplemental-fixture";

async function governadores(page: Page, available: boolean) {
  await page.clock.setFixedTime(new Date("2026-10-25T21:00:00Z"));
  const payload = supplementalFixture();
  const base = payload.exterior.cities[0]!;
  const state = {
    ...base,
    id: "DF:aggregate",
    name: "Distrito Federal",
    scope: "state" as const,
    uf: "DF",
    office: "governor" as const,
    election: "6260",
    as_of: "2026-10-25T20:20:00Z",
    candidates: [
      {
        ...base.candidates[0]!,
        id: "11",
        name: "Candidata estadual A",
        votes: 65,
      },
      {
        ...base.candidates[0]!,
        id: "22",
        name: "Candidato estadual B",
        votes: 35,
      },
    ],
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
    },
  ];
  await page.route("**/api/supplemental", (route) =>
    available
      ? route.fulfill({ json: payload })
      : route.fulfill({ status: 503, json: { error: "Indisponível" } }),
  );
}

for (const width of [320, 390, 430]) {
  for (const available of [false, true]) {
    test(`governadores mapa primeiro em ${width}px ${available ? "com fonte" : "sem fonte"}`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 844 });
      await governadores(page, available);
      await page.goto(
        available ? "/apurar/#governadores-df" : "/apurar/#governadores",
      );
      const panel = page.getByRole("region", {
        name: "Mapa principal de governadores",
      });
      const map = panel.locator("canvas.map").first();
      await expect(map).toBeVisible();
      // A faixa da fonte redimensiona o frame; aguarde o canvas acompanhar.
      await expect
        .poll(() =>
          map.evaluate((canvas) => {
            const stage = canvas.closest(".gov-stage")!;
            const bounds = stage.getBoundingClientRect();
            const padding = parseFloat(getComputedStyle(stage).paddingBottom);
            const mapBounds = canvas.getBoundingClientRect();
            return Math.abs(mapBounds.height - (bounds.height - padding)) < 1;
          }),
        )
        .toBe(true);
      const bounds = await map.boundingBox();
      const result = await panel.locator(".gov-detail").boundingBox();
      expect(bounds!.y).toBeLessThan(350);
      expect(bounds!.y + bounds!.height).toBeLessThan(780);
      expect(result!.y).toBeGreaterThan(bounds!.y + bounds!.height);
      await expect(panel.locator(".gov-location")).not.toHaveAttribute("open");
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
      await panel.locator(".gov-map-help > summary").click();
      await expect(panel.locator(".gov-map-help")).toContainText(
        "sem dados disponíveis",
      );
      if (available) {
        await panel
          .getByRole("link", { name: "Ver resultado oficial" })
          .click();
        await expect(panel.locator(".gov-detail")).toBeFocused();
        await expect(panel.locator(".gov-detail")).toContainText(
          "Candidata estadual A",
        );
      } else {
        await expect(panel.locator(".gov-map-source")).toContainText(
          "indisponíveis",
        );
      }
    });
  }
}

test("governadores filtros preservam UF, município, fonte própria e retorno Brasil", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await governadores(page, true);
  await page.goto("/apurar/#governadores");
  const panel = page.getByRole("region", {
    name: "Mapa principal de governadores",
  });
  await panel.locator(".gov-location > summary").click();
  await panel.getByLabel("Estado no mapa de governadores").selectOption("DF");
  await expect(page).toHaveURL(/#governadores-df$/);
  await panel.locator(".gov-location > summary").click();
  await panel
    .getByLabel("Município no mapa de governadores")
    .selectOption("5300108");
  await expect(page).toHaveURL(/#governadores-df-5300108$/);
  await expect(panel.locator(".gov-map-source")).toContainText("17:01:00");
  const plus = panel.getByRole("button", { name: "Aproximar o mapa" });
  await plus.click();
  const stage = await panel
    .locator(".gov-stage canvas.map")
    .first()
    .boundingBox();
  const zoom = await panel.locator(".zoomctl").boundingBox();
  expect(zoom!.y).toBeGreaterThanOrEqual(stage!.y + stage!.height);
  await page.mouse.move(190, 790);
  await page.mouse.wheel(0, 500);
  await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(0);
  await panel.locator(".gov-location > summary").click();
  await panel.getByLabel("Estado no mapa de governadores").selectOption("");
  await expect(page).toHaveURL(/#governadores$/);
  await expect(panel.locator("canvas.map").first()).toBeVisible();
});

test("tablet de governadores mantém mapa antes dos resultados sem overflow", async ({
  page,
}) => {
  await page.setViewportSize({ width: 834, height: 1194 });
  await governadores(page, true);
  await page.goto("/apurar/#governadores-df");
  const panel = page.getByRole("region", {
    name: "Mapa principal de governadores",
  });
  const map = panel.locator("canvas.map").first();
  await expect(map).toBeVisible();
  const bounds = await map.boundingBox();
  const result = await panel.locator(".gov-detail").boundingBox();
  expect(bounds!.y).toBeLessThan(350);
  expect(bounds!.width).toBeGreaterThan(750);
  const zoom = await panel.locator(".zoomctl").boundingBox();
  expect(zoom!.y).toBeGreaterThanOrEqual(bounds!.y + bounds!.height);
  await expect(map).toHaveCSS("touch-action", "pan-y");
  expect(result!.y).toBeGreaterThan(bounds!.y + bounds!.height);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});

for (const viewport of [
  { width: 768, height: 1024 },
  { width: 844, height: 390 },
]) {
  test(`governadores ${viewport.width}px mantém gestos próprios ao entrar e sair de TV`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    await governadores(page, true);
    await page.goto("/apurar/#governadores-df");
    const panel = page.getByRole("region", {
      name: "Mapa principal de governadores",
    });
    const map = panel.locator("canvas.map").first();
    await expect(map).toHaveCSS("touch-action", "pan-y");
    const actions = panel.locator(".map-actions > summary");
    if (await actions.isVisible()) await actions.click();
    await panel
      .getByRole("button", { name: "Tela cheia", exact: true })
      .click();
    await expect(map).toHaveCSS("touch-action", "none");
    await panel
      .getByRole("button", { name: "Sair da tela cheia", exact: true })
      .click();
    await expect(map).toHaveCSS("touch-action", "pan-y");
  });
}
