import { expect, test } from "@playwright/test";
import { mockLivePanel } from "./bundle-fixture";

for (const path of ["/apurar/", "/1turno/", "/apurar/#governadores"]) {
  test(`mapa e tooltip usam bandeira local com nome acessível: ${path}`, async ({
    page,
    isMobile,
  }) => {
    await mockLivePanel(page);
    await page.goto(path);
    await expect(page.locator("canvas.map").first()).toBeVisible();
    const state = page.locator('button.mk[data-uf="SC"]').first();
    await expect(state).toBeVisible();
    await expect(state).toHaveAttribute("aria-label", /Santa Catarina/);
    const flag = state.locator('img.state-flag[data-uf="SC"]');
    await expect(flag).toBeVisible();
    await expect(flag).toHaveAttribute("alt", "Bandeira de Santa Catarina");
    await expect
      .poll(() =>
        flag.evaluate(
          (image: HTMLImageElement) => image.complete && image.naturalWidth > 0,
        ),
      )
      .toBe(true);
    await expect(state.locator("b")).toHaveText("");
    if (!isMobile) {
      await state.hover();
      const tip = page.locator(".tip.on");
      await expect(tip).toContainText("Santa Catarina");
      await expect(tip.locator('img.state-flag[data-uf="SC"]')).toBeVisible();
      await expect(tip).toHaveCSS("opacity", "1");
      await page.screenshot({
        path: test.info().outputPath("bandeira-tooltip.png"),
      });
    }
    await state.click();
    await expect(page).toHaveURL(/(?:presidente|governadores)-sc/);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth + 1,
      ),
    ).toBe(true);
  });
}
