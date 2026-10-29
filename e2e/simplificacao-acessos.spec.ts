import { expectOfficialTime } from "./official-source";
import { expect, test } from "@playwright/test";
import { mockLivePanel } from "./bundle-fixture";

const removedAccess =
  'a[href*="painel="], a[href*="demo="], a[href^="/simples"]';

for (const path of ["/", "/apurar/", "/1turno/"]) {
  test(`navegação não anuncia acessos removidos em ${path}`, async ({
    page,
  }) => {
    await mockLivePanel(page);
    await page.goto(path);
    if (path !== "/") {
      await page
        .getByRole("button", { name: "Abrir navegação" })
        .first()
        .click();
      await expect(
        page.getByRole("dialog", { name: "Explore o Apurar" }),
      ).toBeVisible();
    }
    await expect(page.locator(removedAccess)).toHaveCount(0);
    await expect(
      page.getByRole("button", {
        name: /^(?:arquivo(?: oficial)?|(?:ver )?demonstração|visão simplificada)$/i,
      }),
    ).toHaveCount(0);
  });
}

for (const path of ["/simples/", "/simples/index.html"]) {
  test(`diagnóstico removido responde 404 em ${path}`, async ({ request }) => {
    const response = await request.get(path);
    expect(response.status()).toBe(404);
    expect(await response.text()).not.toContain('id="root"');
  });
}

test("query antiga de demonstração usa a fonte oficial e limpa a URL", async ({
  page,
}) => {
  await mockLivePanel(page);
  const manifest = page.waitForResponse("**/api/manifest");
  await page.goto("/apurar/?demo=1&origem=legado#presidente-sp");
  await manifest;
  await expect(page).toHaveURL(/\/apurar\/\?origem=legado#presidente-sp$/);
  await expect(page.locator(".apurar-source")).toHaveCount(0);
  await expectOfficialTime(page, "25/10/2026, 18:00:00");
  await expect(page.locator(".demo-banner")).toHaveCount(0);
  await expect(
    page.getByRole("heading", { name: /demonstração.*dados fictícios/i }),
  ).toHaveCount(0);
});

test("query de demonstração não fornece números fictícios se a API falha", async ({
  page,
}) => {
  await page.route("**/api/manifest", (route) =>
    route.fulfill({ status: 503 }),
  );
  await page.goto("/apurar/?demo=1");
  await expect(page).toHaveURL(/\/apurar\/$/);
  await expect(page.locator("body")).toContainText("Aguardando dados oficiais");
  await expect(page.locator(".apurar-projection .pj-row")).toHaveCount(0);
  await expect(page.locator("body")).not.toContainText(
    /dados fictícios|demonstração/i,
  );
});
