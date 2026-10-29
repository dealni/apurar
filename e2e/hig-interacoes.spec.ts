import { mockLivePanel } from "./bundle-fixture";
import { expect, test } from "@playwright/test";

for (const route of ["/apurar/", "/1turno/"]) {
  test(`busca isola o fundo e restaura navegação em ${route}`, async ({
    page,
  }) => {
    await mockLivePanel(page);
    await page.goto(route);
    const trigger = page.getByRole("button", {
      name: "Buscar município, estado ou candidato",
      exact: true,
    });
    await trigger.click();
    const input = page.getByRole("combobox");
    await expect(input).toBeFocused();
    expect(await trigger.evaluate((node) => !!node.closest("[inert]"))).toBe(
      true,
    );
    expect(await page.evaluate(() => document.body.style.overflow)).toBe(
      "hidden",
    );
    await input.press("Shift+Tab");
    await expect(
      page.getByRole("button", { name: "Cancelar", exact: true }),
    ).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(trigger).toBeFocused();
    expect(await trigger.evaluate((node) => !!node.closest("[inert]"))).toBe(
      false,
    );
    expect(await page.evaluate(() => document.body.style.overflow)).not.toBe(
      "hidden",
    );
  });

  test(`mapas permitem navegar por teclado sem mudar seleção em ${route}`, async ({
    page,
    isMobile,
  }) => {
    test.skip(isMobile, "O seletor de leituras é exibido no layout desktop.");
    await mockLivePanel(page);
    await page.goto(route);
    const trigger = page.locator(".seg2 .cb").first();
    await expect(trigger).toBeVisible();
    await trigger.focus();
    await trigger.press("ArrowDown");
    const menu = page.getByRole("menu", { name: "Outras leituras do mapa" });
    await expect(menu).toBeVisible();
    const options = menu.locator("button:not(:disabled)");
    const selectedBefore = await menu.locator('[aria-checked="true"]').count();
    await expect(options.first()).toBeFocused();
    await page.keyboard.press("End");
    await expect(options.last()).toBeFocused();
    await page.keyboard.press("ArrowDown");
    await expect(options.first()).toBeFocused();
    await page.keyboard.press("ArrowUp");
    await expect(options.last()).toBeFocused();
    expect(await menu.locator('[aria-checked="true"]').count()).toBe(
      selectedBefore,
    );
    await page.keyboard.press("Escape");
    await expect(menu).toHaveCount(0);
    await expect(trigger).toBeFocused();
  });
}
