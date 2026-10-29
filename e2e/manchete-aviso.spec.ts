import { test, expect, type Page } from "@playwright/test";

async function conteudoSemFaixa(page: Page) {
  await expect(page.locator(".apurar-source")).toHaveCount(0);
  await expect(page.locator(".rbwrap, .hero, .col").first()).toBeVisible();
  await expect
    .poll(() =>
      page
        .locator(".frame")
        .evaluate((frame) => frame.getBoundingClientRect().top),
    )
    .toBe(0);
}

test("falha oficial não recria faixa superior e histórico mantém manchete visível", async ({
  page,
}) => {
  await page.route("**/api/**", (route) =>
    route.fulfill({ status: 503, contentType: "application/json", body: "{}" }),
  );
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/apurar/");
  await conteudoSemFaixa(page);
  await page.goto("/1turno/");
  await expect(page.locator(".rb-head")).toBeVisible();
});
