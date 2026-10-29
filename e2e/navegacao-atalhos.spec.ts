import { mockLivePanel } from "./bundle-fixture";
import { expect, test } from "@playwright/test";

for (const path of ["/apurar/", "/1turno/"]) {
  test(`navegação preserva local e controles atrás dos diálogos em ${path}`, async ({
    page,
  }) => {
    await mockLivePanel(page);
    await page.goto(`${path}#presidente-sp`);
    await expect(page.locator("canvas").first()).toBeVisible();
    const context = new URL(page.url()).hash;
    await page.locator("[data-site-navigation]").first().click();
    const menu = page.locator("#site-navigation-dialog");
    await expect(menu).toBeVisible();
    await page.keyboard.press("Control+k");
    await expect(page.locator(".search")).toHaveCount(0);
    await page.keyboard.press("+");
    await page.keyboard.press("0");
    await page.keyboard.press("Space");
    await page.keyboard.press("Escape");
    await expect(menu).not.toBeVisible();
    expect(new URL(page.url()).hash).toBe(context);

    const blocked = await page.evaluate(() => {
      const region = document.createElement("section");
      region.innerHTML = `<select><option>Observação</option></select>
        <div contenteditable="true"><span>Texto</span></div>
        <div role="slider" tabindex="0">Progresso</div>`;
      document.body.append(region);
      const results = Array.from(region.children).map((control) => {
        const event = new KeyboardEvent("keydown", {
          key: "/",
          bubbles: true,
          cancelable: true,
        });
        control.dispatchEvent(event);
        return event.defaultPrevented;
      });
      region.remove();
      return results;
    });
    expect(blocked).toEqual([false, false, false]);
    await expect(page.locator(".search")).toHaveCount(0);
    expect(new URL(page.url()).hash).toBe(context);
  });
}
