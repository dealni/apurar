import { expect, test } from "@playwright/test";
import { mockLivePanel } from "./bundle-fixture";

for (const width of [320, 390, 1440]) {
  const views = [
    { path: "/apurar/", replay: false },
    { path: "/1turno/", replay: false },
  ];
  for (const { path, replay } of views) {
    test(`rótulos regionais permanecem legíveis em ${path}${replay ? " replay pausado" : ""} a ${width}px`, async ({
      page,
      isMobile,
    }) => {
      test.skip(isMobile, "Larguras controladas verificadas no Chrome.");
      await page.setViewportSize({ width, height: 900 });
      await mockLivePanel(page);
      await page.goto(path);
      const card = page.locator(".regc:not(.rdet)");
      await expect(card).toBeVisible();
      await expect(card.locator(".reg")).toHaveCount(6);
      if (path === "/apurar/")
        await expect(card.locator(".reg .p")).toHaveText(
          Array(6).fill("Dados indisponíveis"),
        );
      await page.evaluate(() => document.fonts.ready);
      const labels = await card.locator(".reg").evaluateAll((rows) =>
        rows.map((row) => {
          const label = row.querySelector<HTMLElement>(".p")!;
          const bounds = label.getBoundingClientRect();
          const bar = row.querySelector(".bar")!.getBoundingClientRect();
          const range = document.createRange();
          range.selectNodeContents(label);
          const lines = Array.from(range.getClientRects());
          return {
            label: label.textContent?.trim(),
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
      await card.scrollIntoViewIfNeeded();
      await expect
        .poll(() => card.evaluate((node) => getComputedStyle(node).opacity))
        .toBe("1");
      await card.screenshot({
        path: test.info().outputPath(`regioes-${width}.png`),
      });
    });
  }
}
