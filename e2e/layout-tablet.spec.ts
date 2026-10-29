import { expect, test } from "@playwright/test";
import { mockLivePanel } from "./bundle-fixture";

for (const path of ["/apurar/", "/1turno/"]) {
  for (const width of [512, 600, 700, 768, 900]) {
    test(`mapa e resultados acessíveis em ${path} a ${width}px`, async ({
      page,
      isMobile,
    }) => {
      test.skip(isMobile, "Geometria com larguras controladas.");
      await page.setViewportSize({ width, height: width === 512 ? 384 : 1024 });
      await mockLivePanel(page);
      await page.goto(path);
      const map = page.locator(".mapwrap");
      await expect(map).toBeVisible();
      await expect
        .poll(() => map.evaluate((node) => node.clientHeight))
        .toBeGreaterThan(280);
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
      if (width < 700) {
        await expect(page.locator(".hud")).toHaveClass(/flow/);
        await map.scrollIntoViewIfNeeded();
        await expect(map).toBeInViewport();
        return;
      }
      const card = page.locator(".hud > .pcard");
      await expect(card).toHaveCSS("overflow-y", "auto");
      const positions = await page.evaluate(() => {
        const card = document.querySelector<HTMLElement>(".hud > .pcard")!;
        const map = document.querySelector(".mapwrap")!.getBoundingClientRect();
        const bounds = card.getBoundingClientRect();
        return {
          right: bounds.right,
          mapLeft: map.left,
          top: bounds.top,
          mapTop: map.top,
        };
      });
      expect(positions.right).toBeLessThanOrEqual(positions.mapLeft);
      expect(Math.abs(positions.top - positions.mapTop)).toBeLessThan(1);
      const labels = await card
        .locator(".leader .pm, .kpi .v")
        .evaluateAll((nodes) =>
          nodes.map((node) => {
            const bounds = node.getBoundingClientRect();
            const range = document.createRange();
            range.selectNodeContents(node);
            return Array.from(range.getClientRects()).every(
              (line) =>
                line.left >= bounds.left - 1 && line.right <= bounds.right + 1,
            );
          }),
        );
      expect(labels.every(Boolean)).toBe(true);
      await expect(page.locator(".tl, .tlbar")).toHaveCount(0);
      const before = await card.evaluate((node) => {
        node.scrollTop = node.scrollHeight;
        return {
          top: node.scrollTop,
          max: node.scrollHeight - node.clientHeight,
        };
      });
      expect(before.top).toBeGreaterThanOrEqual(before.max - 1);
      await page.screenshot({
        path: test.info().outputPath(`tablet-${width}.png`),
      });
    });
  }
}
