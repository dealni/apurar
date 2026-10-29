import { expect, test } from "@playwright/test";
import { mockLivePanel } from "./bundle-fixture";

for (const viewport of [
  { width: 1440, height: 900 },
  { width: 1366, height: 768 },
  { width: 768, height: 1000 },
]) {
  test(`painel sem replay mantém o painel inteiro na tela em ${viewport.width}px`, async ({
    page,
    isMobile,
  }) => {
    test.skip(isMobile, "Geometria de desktop e tablet.");
    await page.setViewportSize(viewport);
    await mockLivePanel(page);
    await page.goto("/apurar/");
    await expect(
      page.getByRole("slider", { name: "Hora da apuração" }),
    ).toHaveCount(0);
    await expect
      .poll(() =>
        page.locator(".hud").evaluate((node) => {
          const panel = node.getBoundingClientRect();
          return panel.top >= 0 && panel.bottom <= innerHeight + 1;
        }),
      )
      .toBe(true);
    await page.setViewportSize({ ...viewport, height: viewport.height - 80 });
    await expect(page.locator("canvas.map").first()).toBeVisible();
    await expect(page.locator(".tlbar, .sh-tl")).toHaveCount(0);
  });
}
