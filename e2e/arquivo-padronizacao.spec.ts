import { openMapActions } from "./map-actions";
import { expect, test } from "@playwright/test";

for (const viewport of [
  { width: 320, height: 740 },
  { width: 390, height: 844 },
  { width: 844, height: 390 },
  { width: 1440, height: 1000 },
]) {
  test(`arquivo identifica a captura sem cobrir os controles em ${viewport.width}px`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    await page.goto("/1turno/");
    await expect(page.locator("canvas.map").first()).toBeVisible();
    const source = page.getByRole("complementary", {
      name: "Contexto do arquivo",
    });
    await expect(source).toContainText("Arquivo · 1º turno de 2026");
    await expect(source).toContainText(
      "Captura de 24/10/2026 · sem atualização ao vivo",
    );
    await expect(page.locator(".captura-local")).toHaveCount(0);
    const sourceBounds = await source.boundingBox();
    const headerBounds = await page.locator(".hudtop").first().boundingBox();
    expect(headerBounds!.y).toBeGreaterThanOrEqual(sourceBounds!.height - 1);
    expect(await page.evaluate(() => document.body.scrollWidth)).toBe(
      viewport.width,
    );
    await openMapActions(page);
    await page.getByRole("button", { name: "Tela cheia", exact: true }).click();
    await expect(
      page.getByRole("button", { name: "Sair da tela cheia", exact: true }),
    ).toBeVisible();
    await expect(source).toBeVisible();
    const tvBounds = await page.locator(".hud").first().boundingBox();
    expect(tvBounds!.y).toBeGreaterThanOrEqual(sourceBounds!.height - 1);
    expect(tvBounds!.y + tvBounds!.height).toBeLessThanOrEqual(
      viewport.height + 1,
    );
    await page
      .getByRole("button", { name: "Sair da tela cheia", exact: true })
      .click();
    await expect(page.locator("canvas.map").first()).toBeVisible();
  });
}

test("entrada histórica identifica dados arquivados antes de carregar JavaScript", async ({
  browser,
}) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto("/1turno/");
  await expect(page.getByRole("status")).toContainText(
    "Arquivo do 1º turno de 2026",
  );
  await expect(page.getByRole("status")).toContainText(
    "Carregando os dados arquivados",
  );
  await expect(
    page.getByRole("link", { name: "Recarregar página" }),
  ).toBeVisible();
  await context.close();
});
