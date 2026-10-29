import { expect, test } from "@playwright/test";

for (const width of [1280, 1440]) {
  test(`falha da fonte preserva espaço dos controles do mapa em ${width}px`, async ({
    page,
    isMobile,
  }) => {
    test.skip(isMobile, "Geometria desktop controlada pelo cenário.");
    await page.setViewportSize({ width, height: 900 });
    await page.route("**/api/**", (route) =>
      route.fulfill({ status: 503, body: "" }),
    );
    await page.goto("/apurar/");
    const banner = page.locator(".rbwrap > section");
    await expect(banner).toContainText("Aguardando dados oficiais");
    const bounds = await page.locator(".maptop").evaluate((controls) => {
      const card = document.querySelector(".rbwrap > section")!;
      return {
        bannerBottom: card.getBoundingClientRect().bottom,
        controlsTop: controls.getBoundingClientRect().top,
      };
    });
    expect(bounds.bannerBottom).toBeLessThanOrEqual(bounds.controlsTop);
    await expect(banner.getByRole("progressbar")).toHaveCount(0);
    await expect(banner).not.toContainText("0%");
    const summary = page.locator(".col.l .natc");
    await expect(summary).toHaveCount(0);
  });
}
