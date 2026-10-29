import { expect, test, type Page } from "@playwright/test";
import { mockLivePanel } from "./bundle-fixture";

async function hoverCity(page: Page) {
  await page.goto("/apurar/#presidente-ac");
  await expect(page.locator("canvas.map").first()).toBeVisible();
  // Percorre apenas a área livre do mapa, acionando o hover real do canvas.
  for (let y = 320; y <= 650; y += 45) {
    for (let x = 450; x <= 990; x += 45) {
      await page.mouse.move(x, y);
      if (await page.locator(".tip.on .tip-first-round").count()) return;
    }
  }
  throw new Error("Tooltip municipal não encontrado no mapa do Acre.");
}
for (const unavailable of [false, true]) {
  test(`hover municipal mostra primeiro turno separado da apuração atual: indisponível=${unavailable}`, async ({
    page,
    isMobile,
  }) => {
    test.skip(isMobile, "Tooltip de mouse; viewport desktop controlada.");
    await page.setViewportSize({ width: 1440, height: 900 });
    await mockLivePanel(page);
    await page.route("**/api/municipalities/*", (route) =>
      route.fulfill({
        json: {
          schema_version: 1,
          election: "6258",
          snapshot_id: "browser-live-fixture",
          items: [
            {
              available: true,
              scope: "municipality",
              unit_id: "AC:01120",
              uf: "AC",
              name: "Acrelândia",
              as_of: "2026-10-25T21:00:00Z",
              sections: { counted: 0, total: 45 },
              candidates: [
                { id: "01", votes: 0 },
                { id: "02", votes: 0 },
              ],
            },
          ],
        },
      }),
    );
    if (unavailable)
      await page.route("**/1turno/feed/uf/*.json", (route) =>
        route.fulfill({ status: 503 }),
      );
    await hoverCity(page);
    const tooltip = page.locator(".tip.on");
    const history = tooltip.locator(".tip-first-round");
    await expect(history).toContainText("1º turno · 2026");
    if (unavailable) {
      await expect(history).toContainText(
        "Resultado do primeiro turno indisponível",
      );
      await expect(history.locator(".tip-first-round-row")).toHaveCount(0);
    } else {
      await expect(history.locator(".tip-first-round-row")).toHaveCount(2);
      await expect(history).toContainText("Lula");
      await expect(history).toContainText("Flávio Bolsonaro");
      await expect(history).toContainText(
        "Percentuais sobre todos os votos válidos.",
      );
      await expect(history.locator("small").first()).toHaveText(/[\d.]+ votos/);
    }
    await expect(tooltip).toHaveCSS("opacity", "1");
    const bounds = await tooltip.boundingBox();
    expect(bounds!.y).toBeGreaterThanOrEqual(0);
    expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(900);
    await page.screenshot({ path: test.info().outputPath("tooltip.png") });
  });
}
