import { openMapActions, openMapFilters } from "./map-actions";
import { test, expect } from "@playwright/test";
import { supplementalFixture } from "../packages/contracts/supplemental-fixture";
import { mockLivePanel } from "./bundle-fixture";

async function explorarSeDisponivel(
  page: import("@playwright/test").Page,
  isMobile: boolean,
) {
  if (!isMobile) return;
  const button = page
    .getByRole("navigation", { name: "Seções", exact: true })
    .getByRole("button", { name: "Explorar", exact: true });
  if (await button.isVisible()) await button.click();
}

test.beforeEach(async ({ page }) => {
  await mockLivePanel(page);
  await page.route("**/api/supplemental", async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 400));
    await route.fulfill({ json: supplementalFixture() });
  });
});

test("endereço antigo de governadores seleciona o mapa principal e preserva a UF", async ({
  page,
  isMobile,
}) => {
  await page.goto("/apurar/?painel=governadores&origem=acesso#presidente-sp");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  const map = page.getByRole("region", {
    name: "Mapa principal de governadores",
  });
  await expect(map).toBeVisible();
  await explorarSeDisponivel(page, isMobile);
  await openMapFilters(page);
  await expect(map.getByLabel("Estado no mapa de governadores")).toHaveValue(
    "SP",
  );
  await expect(page).toHaveURL(/\?origem=acesso#governadores-sp$/);
  await expect(
    page.getByRole("button", { name: "Governadores", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "Presidente", exact: true }).click();
  await expect(map).toHaveCount(0);
  await expect(page).toHaveURL(/\?origem=acesso#presidente-sp$/);
});

test("endereço antigo do exterior abre o mapa principal e permite voltar ao Brasil", async ({
  page,
}) => {
  await page.goto("/apurar/?painel=exterior&origem=acesso#presidente-sp");
  const exterior = page.getByRole("region", {
    name: "Mapa principal do exterior",
  });
  await expect(exterior).toBeVisible();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page).toHaveURL(/\?origem=acesso#presidente-zz$/);
  await openMapActions(page);
  await exterior.getByRole("button", { name: "Brasil", exact: true }).click();
  await expect(exterior).toHaveCount(0);
  await expect(page).toHaveURL(/\?origem=acesso(?:#presidente)?$/);
});

test("endereço antigo do arquivo é limpo sem abrir conteúdo arquivado", async ({
  page,
}) => {
  const archives: string[] = [];
  page.on("request", (request) => {
    if (/\/api\/archive(?:[/?]|$)/u.test(request.url()))
      archives.push(request.url());
  });
  await page.goto("/apurar/?painel=arquivo&origem=acesso#presidente-sp");
  await expect(page.locator(".apurar-source")).toHaveCount(0);
  await expect(page).toHaveURL(/\?origem=acesso#presidente-sp$/);
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Arquivo oficial", exact: true }),
  ).toHaveCount(0);
  expect(archives).toEqual([]);
});

test("Voltar e Avançar sincronizam os mapas de governadores e exterior", async ({
  page,
  isMobile,
}) => {
  await page.goto("/apurar/?origem=acesso#presidente-sp");
  const governors = page.getByRole("region", {
    name: "Mapa principal de governadores",
  });
  const exterior = page.getByRole("region", {
    name: "Mapa principal do exterior",
  });
  await page.getByRole("button", { name: "Governadores", exact: true }).click();
  await expect(governors).toBeVisible();
  await expect(page).toHaveURL(/#governadores-sp$/);
  await page.goBack();
  await expect(governors).toHaveCount(0);
  await page.goForward();
  await expect(governors).toBeVisible();
  await explorarSeDisponivel(page, isMobile);
  await openMapActions(page);
  await page
    .getByRole("button", { name: "Ver os votos do exterior", exact: true })
    .click();
  await expect(exterior).toBeVisible();
  await expect(governors).toHaveCount(0);
  await expect(page).toHaveURL(/#presidente-zz$/);
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.goBack();
  await expect(exterior).toHaveCount(0);
  await expect(governors).toBeVisible();
});

for (const panel of ["governadores", "exterior", "arquivo"]) {
  test(`demonstração legada com ${panel} nunca ativa dados sintéticos ou modais`, async ({
    page,
    isMobile,
  }) => {
    const official = page.waitForResponse("**/api/manifest");
    await page.goto(`/apurar/?demo=1&painel=${panel}`);
    await official;
    await expect(page).not.toHaveURL(/[?&](demo|painel)=/);
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await expect(page.locator(".demo-banner")).toHaveCount(0);
    await expect(
      page.getByRole("heading", { name: /demonstração.*dados fictícios/i }),
    ).toHaveCount(0);
    if (panel === "governadores") await explorarSeDisponivel(page, isMobile);
    await expect(page.locator(".apurar-source")).toHaveCount(0);
    await expect(page.locator(".hudtop")).not.toContainText(
      /dados fictícios|demonstração/i,
    );
    if (panel === "governadores") {
      await expect(
        page.getByRole("region", { name: "Mapa principal de governadores" }),
      ).toBeVisible();
    } else if (panel === "exterior") {
      await expect(
        page.getByRole("region", { name: "Mapa principal do exterior" }),
      ).toBeVisible();
    } else {
      await expect(page.locator(".apurar-source")).toHaveCount(0);
    }
  });
}
