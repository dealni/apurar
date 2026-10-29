import { waitForOfficialSource } from "./official-source";
import { openMapActions } from "./map-actions";
import { mockLivePanel } from "./bundle-fixture";
import { test, expect, type Page } from "@playwright/test";

async function settleResults(page: Page) {
  await expect
    .poll(() =>
      page
        .locator(".rbwrap > section, .hero")
        .first()
        .evaluate((node) => {
          let current: Element | null = node;
          while (current) {
            if (Number(getComputedStyle(current).opacity) < 0.99) return false;
            current = current.parentElement;
          }
          return true;
        }),
    )
    .toBe(true);
}

test("interface principal preserva mapas, cargos do segundo turno e espera oficial", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.route("**/api/**", (route) =>
    route.fulfill({ status: 503, contentType: "application/json", body: "{}" }),
  );
  await page.goto("/apurar/");
  await expect(page.locator(".brand img[alt=Apurar]")).toBeVisible();
  await expect(page.locator("body")).toContainText("Aguardando dados oficiais");
  await expect(page.locator("canvas").first()).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Governadores", exact: true }),
  ).toBeVisible();
  await expect(page.getByText("by Pandora", { exact: false })).toHaveCount(0);
  await expect(page.locator("body")).not.toContainText("0 eleitores");
  await expect(page.locator("body")).not.toContainText("NaN");
  expect(errors).toEqual([]);
});

test("design completo usa resultados oficiais, busca, mapa e modo TV", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await mockLivePanel(page);
  await page.goto("/apurar/");
  await waitForOfficialSource(page);
  await expect(page.locator(".rbwrap > section, .hero").first()).toBeVisible();
  await expect(page.locator(".rbwrap > section, .hero").first()).toContainText(
    "2.400.000",
  );
  await expect(page.locator("canvas").first()).toBeVisible();
  const shares = await page
    .locator(
      '.rb-track b .num.run > span[aria-hidden="true"], .hero .fig .num.run > span[aria-hidden="true"]',
    )
    .evaluateAll((nodes) =>
      nodes
        .filter((node) => node.getClientRects().length > 0)
        .map((node) => node.textContent?.trim()),
    );
  expect(shares).toEqual(["53,33", "46,67"]);
  expect(
    shares.reduce((sum, value) => sum + Number(value?.replace(",", ".")), 0),
  ).toBeCloseTo(100, 2);
  const votes = await page
    .locator(
      '.rb-v .num.run > span[aria-hidden="true"], .hero .votes .num.run > span[aria-hidden="true"]',
    )
    .evaluateAll((nodes) =>
      nodes
        .filter((node) => node.getClientRects().length > 0)
        .map((node) => node.textContent?.trim()),
    );
  expect(votes).toEqual(["2.400.000", "2.100.000"]);
  await settleResults(page);
  await page.screenshot({
    path: `test-results/design-principal-${test.info().project.name}.png`,
    fullPage: true,
  });
  await page
    .getByRole("button", {
      name: "Buscar município, estado ou candidato",
      exact: true,
    })
    .click();
  const search = page.getByRole("combobox", {
    name: "Buscar município, estado ou candidato",
    exact: true,
  });
  await search.fill("Rio de Janeiro");
  await expect(
    page.getByRole("dialog", { name: "Buscar", exact: true }),
  ).toContainText("Rio de Janeiro");
  await page.keyboard.press("Escape");
  await openMapActions(page);
  await page.getByRole("button", { name: "Tela cheia", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Sair da tela cheia", exact: true }),
  ).toBeVisible();
  await expect(page.locator(".apurar-source")).toHaveCount(0);
  await page
    .getByRole("button", { name: "Sair da tela cheia", exact: true })
    .click();
  await page
    .locator(".rbwrap > section, .hero")
    .first()
    .scrollIntoViewIfNeeded();
  await expect(
    page.locator(".rbwrap > section, .hero").first(),
  ).toBeInViewport();
  await expect(page.locator("body")).not.toContainText("Faixa de 98%");
  await expect(page.locator("body")).not.toContainText("Margem de ±");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await settleResults(page);
  await page.screenshot({
    path: `test-results/design-completo-${test.info().project.name}.png`,
    fullPage: true,
  });
  expect(errors).toEqual([]);
});

test("município sem feed não exibe carregamento permanente nem eleitorado inventado", async ({
  page,
}) => {
  await mockLivePanel(page);
  await page.goto("/apurar/#presidente-rj-3304557");
  await expect(page.locator("body")).toContainText(
    "Dados municipais indisponíveis nesta atualização.",
  );
  await expect(page.locator("body")).not.toContainText("0 eleitores");
  await expect(page.locator("body")).not.toContainText(
    "Carregando o município",
  );
});
