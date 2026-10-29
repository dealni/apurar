import { expect, test } from "@playwright/test";
import { supplementalFixture } from "../packages/contracts/supplemental-fixture";
import { mockLivePanel } from "./bundle-fixture";

for (const path of [
  "/apurar/#presidente-sp",
  "/apurar/#governadores-df",
  "/apurar/#presidente-zz-pt",
  "/1turno/#presidente-sp",
]) {
  test(`busca global funciona após focar ações e preserva controles em ${path}`, async ({
    page,
  }) => {
    await mockLivePanel(page);
    await page.route("**/api/supplemental", (route) =>
      route.fulfill({ json: supplementalFixture() }),
    );
    await page.goto(path);
    await expect(page.locator("canvas.map").first()).toBeVisible();
    const search = page.getByRole("dialog", { name: "Buscar", exact: true });
    const menu = page.getByRole("button", {
      name: "Abrir navegação",
      exact: true,
    });
    const context = new URL(page.url()).hash;
    for (const key of ["Control+k", "Meta+k"]) {
      await menu.focus();
      await page.keyboard.press(key);
      await expect(search).toBeVisible();
      await expect(search.getByRole("combobox")).toBeFocused();
      await page.keyboard.press("Escape");
      await expect(search).toHaveCount(0);
      await expect(menu).toBeFocused();
    }
    const office = page.locator(".switch button:visible").first();
    await office.focus();
    await page.keyboard.press("Control+k");
    await expect(search).toBeVisible();
    await expect(search.getByRole("combobox")).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(search).toHaveCount(0);
    await expect(office).toBeFocused();
    const brand = page.getByRole("link", {
      name: "Apurar, apuração",
      exact: true,
    });
    await brand.focus();
    await page.keyboard.press("Control+k");
    await expect(search).toBeVisible();
    await expect(search.getByRole("combobox")).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(search).toHaveCount(0);
    await expect(brand).toBeFocused();

    const blocked = await page.evaluate(() => {
      const region = document.createElement("section");
      region.innerHTML =
        '<input><textarea></textarea><select><option>Local</option></select><div contenteditable="true">Editar</div>';
      document.body.append(region);
      const results = Array.from(region.children).map((control) => {
        (control as HTMLElement).focus();
        const event = new KeyboardEvent("keydown", {
          key: "k",
          ctrlKey: true,
          bubbles: true,
          cancelable: true,
        });
        control.dispatchEvent(event);
        return event.defaultPrevented;
      });
      region.remove();
      return results;
    });
    expect(blocked).toEqual([false, false, false, false]);
    await expect(search).toHaveCount(0);
    await menu.click();
    await expect(
      page.getByRole("dialog", { name: "Explore o Apurar" }),
    ).toBeVisible();
    await page.keyboard.press("Control+k");
    await expect(search).toHaveCount(0);
    await page.keyboard.press("Escape");
    expect(new URL(page.url()).hash).toBe(context);
  });
}
