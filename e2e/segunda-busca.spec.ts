import { mockLivePanel } from "./bundle-fixture";
import { expect, test } from "@playwright/test";

for (const route of ["/apurar/", "/1turno/"]) {
  test(`busca anuncia resultados e preserva composição em ${route}`, async ({
    page,
  }) => {
    await mockLivePanel(page);
    await page.goto(route);
    await page
      .getByRole("button", {
        name: "Buscar município, estado ou candidato",
        exact: true,
      })
      .click();
    const input = page.getByRole("combobox");
    const status = page.locator(".search-status");
    await input.fill("sao paulo");
    await expect(
      page.getByRole("option").filter({ hasText: "São Paulo" }).first(),
    ).toBeVisible();
    await expect(status).toContainText("resultados disponíveis");
    await input.evaluate((node) => {
      node.dispatchEvent(
        new KeyboardEvent("keydown", {
          key: "Enter",
          bubbles: true,
          isComposing: true,
        }),
      );
      node.dispatchEvent(
        new KeyboardEvent("keydown", {
          key: "Escape",
          bubbles: true,
          isComposing: true,
        }),
      );
    });
    await expect(input).toBeFocused();
    await input.fill("zzzznenhumlugar");
    await expect(status).toContainText("Nada encontrado");
    await expect(input).not.toHaveAttribute("aria-activedescendant");
    await input.fill("santo");
    await page.setViewportSize({ width: 667, height: 320 });
    for (let index = 0; index < 7; index++) await input.press("ArrowDown");
    await expect(page.getByRole("option", { selected: true })).toBeInViewport();
    await expect(
      page.getByRole("button", { name: "Cancelar", exact: true }),
    ).toBeInViewport();
  });
}
