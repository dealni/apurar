import { expect, test } from "@playwright/test";
import { mockLivePanel } from "./bundle-fixture";

for (const [path, href] of [
  ["/index.html", "/"],
  ["/apurar/index.html", "/"],
  ["/1turno/index.html", "/1turno/"],
]) {
  test(`menu identifica a página atual no endereço direto ${path}`, async ({
    page,
  }) => {
    await mockLivePanel(page);
    await page.goto(path!);
    await page.getByRole("button", { name: "Abrir navegação" }).first().click();
    const current = page
      .getByRole("dialog", { name: "Explore o Apurar" })
      .locator('[aria-current="page"]');
    await expect(current).toHaveCount(1);
    await expect(current).toHaveAttribute("href", href!);
  });
}

for (const path of ["/apurar/", "/1turno/"]) {
  test(`menu permite acessar os dois turnos a partir de ${path}`, async ({
    page,
  }) => {
    await page.goto(path);
    const trigger = page
      .getByRole("button", { name: "Abrir navegação" })
      .first();
    await trigger.click();
    const menu = page.getByRole("dialog", { name: "Explore o Apurar" });
    await expect(menu).toBeVisible();
    const links = menu
      .getByRole("navigation", { name: "Áreas do Apurar" })
      .getByRole("link");
    await expect(links).toHaveCount(2);
    expect(
      await links.evaluateAll((items) =>
        items.map((item) => item.getAttribute("href")),
      ),
    ).toEqual(["/", "/1turno/"]);
    await expect(menu.locator('[aria-current="page"]')).toHaveCount(1);
    await page.keyboard.press("Escape");
    await expect(menu).not.toBeVisible();
    await expect(trigger).toBeFocused();
    await trigger.click();
    await menu.getByRole("link", { name: /^Apuração/, exact: false }).click();
    await expect(page).toHaveURL(/\/$/);
    await expect(page.locator("canvas.map").first()).toBeVisible();
  });
}

test("quatro cargos históricos cabem e recebem foco em 320 px", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 740 });
  await page.goto("/1turno/");
  await expect(page.locator("canvas").first()).toBeVisible();
  const cargos = page.locator(".hud .switch button");
  await expect(cargos).toHaveCount(4);
  for (const cargo of await cargos.all()) {
    await cargo.focus();
    await expect(cargo).toBeFocused();
    const box = await cargo.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.x).toBeGreaterThanOrEqual(0);
    expect(box!.x + box!.width).toBeLessThanOrEqual(320);
  }
  expect(await page.evaluate(() => document.body.scrollWidth)).toBe(320);
});
