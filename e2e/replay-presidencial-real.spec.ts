import { expectOfficialTime } from "./official-source";
import { openImageShareMenu } from "./map-actions";
import { expect, test, type Page } from "@playwright/test";
import { mockRealPresidentialReplay } from "./replay-real-fixture";

async function prepare(page: Page) {
  const external: string[] = [];
  await page.route(/^https?:\/\/(?!127\.0\.0\.1:)/, (route) => {
    external.push(route.request().url());
    return route.abort("blockedbyclient");
  });
  const fixture = await mockRealPresidentialReplay(page);
  await page.goto("/apurar/");
  await expectOfficialTime(page, "24/10/2026, 19:19:13");
  return { ...fixture, external };
}

for (const width of [320, 390, 1440]) {
  test(`acervo presidencial real preserva fonte e limite pré-apuração em ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    const fixture = await prepare(page);
    expect(fixture.history.points).toHaveLength(4);
    expect(
      new Set(fixture.history.points.map((point) => point.as_of)).size,
    ).toBe(1);
    await expect(
      page.getByRole("slider", { name: "Hora da apuração" }),
    ).toHaveCount(0);
    await page.keyboard.press("Space");
    await expect(page.locator(".live.replay")).toHaveCount(0);
    await expectOfficialTime(page, "24/10/2026, 19:19:13");
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth + 1,
      ),
    ).toBe(true);
    await page.screenshot({
      path: test.info().outputPath(`painel-real-${width}.png`),
    });
    const regions = page.locator(".regc:not(.rdet)");
    await expect(regions.locator(".reg")).toHaveCount(6);
    await regions.scrollIntoViewIfNeeded();
    const labels = await regions.locator(".reg").evaluateAll((rows) =>
      rows.map((row) => {
        const label = row.querySelector(".p")!;
        const bounds = label.getBoundingClientRect();
        const bar = row.querySelector(".bar")!.getBoundingClientRect();
        const range = document.createRange();
        range.selectNodeContents(label);
        const lines = Array.from(range.getClientRects());
        return {
          withinColumn: lines.every(
            (line) =>
              line.left >= bounds.left - 1 && line.right <= bounds.right + 1,
          ),
          overlapsBar: lines.some(
            (line) =>
              line.right > bar.left &&
              line.left < bar.right &&
              line.bottom > bar.top &&
              line.top < bar.bottom,
          ),
        };
      }),
    );
    expect(
      labels.every((label) => label.withinColumn),
      JSON.stringify(labels),
    ).toBe(true);
    expect(
      labels.some((label) => label.overlapsBar),
      JSON.stringify(labels),
    ).toBe(false);
    await regions.screenshot({
      path: test.info().outputPath(`regioes-reais-${width}.png`),
    });
    expect(fixture.external).toEqual([]);
  });
}

test("PNG com dados reais preserva pré-apuração, zero e horário original da fonte", async ({
  page,
}) => {
  const fixture = await prepare(page);
  await page.evaluate(() => {
    Object.defineProperty(navigator, "share", {
      configurable: true,
      value: undefined,
    });
    const texts: string[] = [];
    Object.assign(window, { realReplayExportTexts: texts });
    const original = CanvasRenderingContext2D.prototype.fillText;
    CanvasRenderingContext2D.prototype.fillText = function (text, x, y, width) {
      texts.push(text);
      if (width === undefined) original.call(this, text, x, y);
      else original.call(this, text, x, y, width);
    };
  });
  const downloaded = page.waitForEvent("download");
  await openImageShareMenu(page);
  await page
    .getByRole("button", { name: "Compartilhar imagem", exact: true })
    .click();
  const download = await downloaded;
  expect(download.suggestedFilename()).toBe("apuracao-2026.png");
  await download.saveAs(test.info().outputPath("pre-apuracao-real.png"));
  const text = await page.evaluate(() =>
    (
      window as unknown as { realReplayExportTexts: string[] }
    ).realReplayExportTexts.join(" "),
  );
  expect(text).toContain("24/10/2026, 19:19:13 (Brasília)");
  expect(text).toContain("Aguardando o início da apuração.");
  expect(text).toContain("0% das seções totalizadas");
  expect(text).not.toContain("HISTÓRICO · PUBLICAÇÃO PRESERVADA");
  expect(text).not.toContain("51,2%");
  expect(text).not.toContain("48,8%");
  expect(fixture.external).toEqual([]);
});

test("navegação regional com o acervo real não transforma o resultado mais recente em replay", async ({
  page,
}) => {
  const fixture = await prepare(page);
  await page
    .locator(".regc:not(.rdet) .reg")
    .filter({ has: page.locator(".nm", { hasText: /^Norte$/ }) })
    .click();
  const detail = page.locator(".regc.rdet");
  await expect(
    detail.getByRole("heading", { name: "Norte", exact: true }),
  ).toBeVisible();
  await detail.getByRole("button", { name: /^Acre:/ }).click();
  await expect(page).toHaveURL(/#presidente-ac$/);
  await expectOfficialTime(page, "24/10/2026, 19:19:13");
  await expect(page.locator(".live.replay")).toHaveCount(0);
  await page.goBack();
  await expect(page).not.toHaveURL(/#presidente-ac$/);
  await expect(
    page.getByRole("slider", { name: "Hora da apuração" }),
  ).toHaveCount(0);
  expect(fixture.external).toEqual([]);
});
