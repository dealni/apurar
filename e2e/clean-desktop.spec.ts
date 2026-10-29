import { expect, test } from "@playwright/test";
import { mockLivePanel } from "./bundle-fixture";

const viewports = [
  { width: 1024, height: 600 },
  { width: 1024, height: 768 },
  { width: 1280, height: 720 },
  { width: 1440, height: 900 },
  { width: 700, height: 1024 },
  { width: 768, height: 1024 },
];

for (const path of ["/apurar/", "/1turno/"]) {
  for (const viewport of viewports) {
    test(`mapa e apoio sem sobreposição em ${path} ${viewport.width}×${viewport.height}`, async ({
      page,
      isMobile,
    }) => {
      test.skip(isMobile, "Geometria desktop e tablet controlada pelo teste.");
      await page.setViewportSize(viewport);
      await mockLivePanel(page);
      await page.goto(path);
      await expect(page.locator("canvas.map").first()).toBeVisible();
      await expect(page.locator(".zoomctl")).toBeInViewport({ ratio: 1 });
      await expect(page.locator(".tl, .tlbar")).toHaveCount(0);
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);

      const layout = await page.evaluate(() => {
        const bounds = (selector: string) =>
          document.querySelector(selector)!.getBoundingClientRect();
        const tablet = document.querySelector(".hud.tablet");
        const result = bounds(tablet ? ".hud > .pcard" : ".col.l");
        const map = bounds(tablet ? ".mapwrap" : ".maptop");
        const zoom = bounds(".zoomctl");
        return {
          resultRight: result.right,
          resultBottom: result.bottom,
          mapLeft: map.left,
          mapWidth: map.width,
          zoomLeft: zoom.left,
          viewportHeight: innerHeight,
        };
      });
      expect(layout.resultRight).toBeLessThanOrEqual(layout.mapLeft + 1);
      expect(layout.resultBottom).toBeLessThanOrEqual(
        layout.viewportHeight + 1,
      );
      expect(layout.mapWidth).toBeGreaterThan(300);
      expect(layout.zoomLeft).toBeGreaterThan(layout.resultRight);

      if (viewport.width < 1000) {
        const result = page.locator(".hud > .pcard");
        await expect(result).toHaveCSS("overflow-y", "auto");
        const reachedEnd = await result.evaluate((node) => {
          node.scrollTop = node.scrollHeight;
          return node.scrollTop >= node.scrollHeight - node.clientHeight - 1;
        });
        expect(reachedEnd).toBe(true);
        await result.evaluate((node) => (node.scrollTop = 0));
      }
      await page.screenshot({ path: test.info().outputPath("layout.png") });
    });
  }
}
