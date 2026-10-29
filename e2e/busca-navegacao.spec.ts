import { mockLivePanel } from "./bundle-fixture";
import { test, expect, type Page } from "@playwright/test";

async function abrirBusca(page: Page) {
  await page
    .getByRole("button", {
      name: "Buscar município, estado ou candidato",
      exact: true,
    })
    .click();
  const input = page.getByRole("combobox");
  await expect(input).toBeFocused();
  return input;
}

test("busca permite alcançar Cancelar e devolve o foco ao acionador", async ({
  page,
}) => {
  await mockLivePanel(page);
  await page.goto("/apurar/");
  const input = await abrirBusca(page);
  await input.fill("zzzznenhumlugar");
  await input.press("ArrowDown");
  await expect(input).not.toHaveAttribute("aria-activedescendant");
  await expect(
    page.getByRole("dialog", { name: "Buscar", exact: true }),
  ).toContainText("Nada encontrado");
  await expect(
    page.getByRole("dialog", { name: "Buscar", exact: true }),
  ).not.toContainText("Carregando a lista de deputados");
  await input.press("Tab");
  const cancelar = page.getByRole("button", { name: "Cancelar", exact: true });
  await expect(cancelar).toBeVisible();
  await expect(cancelar).toBeFocused();
  await cancelar.press("Tab");
  await expect(input).toBeFocused();
  await input.press("Shift+Tab");
  await expect(cancelar).toBeFocused();
  await cancelar.press("Escape");
  await expect(
    page.getByRole("dialog", { name: "Buscar", exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("button", {
      name: "Buscar município, estado ou candidato",
      exact: true,
    }),
  ).toBeFocused();
});

test("busca continua selecionável por teclado após consulta sem resultados", async ({
  page,
}) => {
  await mockLivePanel(page);
  await page.goto("/apurar/");
  const input = await abrirBusca(page);
  await input.fill("zzzznenhumlugar");
  await input.press("ArrowDown");
  await input.fill("Boa Esperança do Norte");
  await expect(page.getByRole("option")).toHaveCount(1);
  await expect(input).toHaveAttribute("aria-activedescendant", "sr0");
  await input.press("Enter");
  await expect(page).toHaveURL(/#presidente-mt-5101837$/);
  await expect(
    page.getByRole("heading", {
      name: "Boa Esperança do Norte",
      exact: true,
    }),
  ).toBeVisible();
});

test("resultado ativo acompanha a rolagem na busca", async ({ page }) => {
  await page.setViewportSize({ width: 1100, height: 560 });
  await mockLivePanel(page);
  await page.goto("/apurar/");
  const input = await abrirBusca(page);
  await input.fill("santo");
  await expect(page.getByRole("option")).toHaveCount(8);
  for (let index = 0; index < 7; index++) await input.press("ArrowDown");
  const ativo = page.getByRole("option", { selected: true });
  await expect(ativo).toBeInViewport();
  expect(
    await ativo.evaluate((node) => {
      const item = node.getBoundingClientRect();
      const list = node.parentElement!.getBoundingClientRect();
      return item.top >= list.top && item.bottom <= list.bottom;
    }),
  ).toBe(true);
});
