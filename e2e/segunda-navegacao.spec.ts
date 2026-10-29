import { mockLivePanel } from "./bundle-fixture";
import { expect, test } from "@playwright/test";

test("menu global contém a rolagem e restaura foco em viewport curta", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 400 });
  await mockLivePanel(page);
  await page.goto("/apurar/");
  const trigger = page.getByRole("button", { name: "Abrir navegação" }).first();
  await trigger.click();
  const menu = page.getByRole("dialog", { name: "Explore o Apurar" });
  await expect(menu).toBeVisible();
  await expect(menu.locator('[aria-current="page"]')).toHaveText(/^Apuração/);
  const position = await page.evaluate(() => window.scrollY);
  await page.mouse.move(1, 350);
  await page.mouse.wheel(0, 600);
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(position);
  await expect(page.locator("body")).toHaveCSS("overflow", "hidden");
  const lastLink = menu.getByRole("link").last();
  await lastLink.focus();
  await expect(lastLink).toBeInViewport();
  await page.keyboard.press("Tab");
  await expect(
    menu.getByRole("button", { name: "Fechar navegação" }),
  ).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await expect(lastLink).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(menu).not.toBeVisible();
  await expect(trigger).toBeFocused();
  await expect(page.locator("body")).not.toHaveCSS("overflow", "hidden");
  expect(await page.evaluate(() => document.body.scrollWidth)).toBe(320);
});

test("fechar navegação restaura estilo de rolagem preexistente", async ({
  page,
}) => {
  await mockLivePanel(page);
  await page.goto("/apurar/");
  await page.evaluate(() => {
    document.body.style.overflow = "auto";
    document.documentElement.style.overflow = "auto";
  });
  await page.getByRole("button", { name: "Abrir navegação" }).first().click();
  await page.getByRole("button", { name: "Fechar navegação" }).click();
  await expect(page.locator("body")).toHaveCSS("overflow", "auto");
  await expect(page.locator("html")).toHaveCSS("overflow", "auto");
});

for (const path of ["/1turno/", "/apurar/"]) {
  test(`atalhos respeitam modificadores e composição em ${path}`, async ({
    page,
  }) => {
    await mockLivePanel(page);
    await page.goto(path);
    await expect(page.locator("canvas").first()).toBeVisible();
    const states = await page.evaluate(() => {
      const before = location.hash;
      return [
        { key: "2", altKey: true },
        { key: "2", ctrlKey: true },
        { key: "2", metaKey: true },
        { key: "2", isComposing: true },
        { key: "/", ctrlKey: true },
        { key: "k", ctrlKey: true, isComposing: true },
      ].map((options) => {
        const event = new KeyboardEvent("keydown", {
          ...options,
          bubbles: true,
          cancelable: true,
        });
        document.body.dispatchEvent(event);
        return {
          unchanged: location.hash === before,
          prevented: event.defaultPrevented,
        };
      });
    });
    expect(states.every((state) => state.unchanged && !state.prevented)).toBe(
      true,
    );
    await expect(page.locator(".search")).toHaveCount(0);
    await page.keyboard.press("Control+k");
    await expect(page.locator(".search")).toBeVisible();
  });
}
