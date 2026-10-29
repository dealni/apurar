import { expect, type Page } from "@playwright/test";

// Ações secundárias ficam no menu compacto do mapa em telas pequenas.
export async function openMapActions(page: Page) {
  // O arquivo histórico exibe um shell estático antes da interface interativa.
  await expect(page.locator(".hudtop.clean-header")).toBeVisible();
  const menu = page.locator(".map-actions");
  if (await menu.isVisible()) {
    if ((await menu.getAttribute("open")) === null)
      await menu.locator("summary").click();
    await expect(menu).toHaveAttribute("open", "");
    await expect(menu.locator(".map-actions-panel")).toBeVisible();
  }
}

export async function openMapFilters(page: Page) {
  const menu = page.locator(".gov-location");
  if ((await menu.isVisible()) && (await menu.getAttribute("open")) === null)
    await menu.locator("summary").click();
}

export async function closeMapActions(page: Page) {
  const menu = page.locator(".map-actions");
  if ((await menu.isVisible()) && (await menu.getAttribute("open")) !== null)
    await menu.locator("summary").click();
}

export async function showMapResults(page: Page) {
  const action = page.getByRole("button", {
    name: "Ver resultados",
    exact: true,
  });
  if (await action.isVisible()) await action.click();
}

/** O PNG continua disponível na opção específica do novo compartilhamento. */
export async function openImageShareMenu(page: Page) {
  await openMapActions(page);
  await page.getByRole("button", { name: "Compartilhar", exact: true }).click();
  await expect(
    page.getByRole("dialog", { name: "Compartilhar", exact: true }),
  ).toBeVisible();
}
