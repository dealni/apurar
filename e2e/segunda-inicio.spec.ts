import { expect, test } from "@playwright/test";
import { mockLivePanel } from "./bundle-fixture";

test("raiz e endereço antigo abrem o mesmo painel", async ({ page }) => {
  await mockLivePanel(page);
  for (const path of ["/", "/apurar/"]) {
    await page.goto(path);
    await expect(page.locator("canvas.map").first()).toBeVisible();
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      "href",
      "https://apurar.app/",
    );
    await page
      .getByRole("button", { name: "Abrir navegação", exact: true })
      .click();
    const menu = page.getByRole("dialog", { name: "Explore o Apurar" });
    await expect(menu.locator('[aria-current="page"]')).toHaveCount(1);
    await expect(menu.getByRole("link", { name: /^Apuração/ })).toHaveAttribute(
      "href",
      "/",
    );
    await expect(menu.getByText("Página de acesso")).toHaveCount(0);
  }
});

test("painel direto na raiz cabe no celular e desktop", async ({ page }) => {
  await mockLivePanel(page);
  for (const width of [320, 390, 768, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    await expect(page.locator("canvas.map").first()).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  }
});
