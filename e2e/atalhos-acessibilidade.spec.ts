import { mockLivePanel } from "./bundle-fixture";
import { expect, test } from "@playwright/test";

test("sem replay Espaço preserva comportamento nativo nos controles e diálogos", async ({
  page,
}) => {
  await mockLivePanel(page);
  await page.goto("/apurar/");
  await expect(page.locator(".tl .play")).toHaveCount(0);
  const result = await page.evaluate(() => {
    const space = (target: Element) => {
      const event = new KeyboardEvent("keydown", {
        code: "Space",
        key: " ",
        bubbles: true,
        cancelable: true,
      });
      target.dispatchEvent(event);
      return event.defaultPrevented;
    };
    const region = document.createElement("div");
    region.innerHTML = `
      <select><option>Uma observação</option></select>
      <details><summary>Detalhes</summary></details>
      <a href="#">Fonte oficial</a>
      <div role="dialog"><p tabindex="0">Descrição</p></div>
      <dialog open><p tabindex="0">Descrição nativa</p></dialog>
      <div contenteditable="true"><span>Editar</span></div>
      <button><span>Ativar</span></button>`;
    document.body.append(region);
    const controls = [
      "select",
      "summary",
      "a",
      '[role="dialog"] p',
      "dialog p",
      "[contenteditable] span",
      "button span",
    ].map((selector) => [selector, space(region.querySelector(selector)!)]);
    region.remove();
    return { controls, body: space(document.body) };
  });
  expect(result.controls.every(([, prevented]) => !prevented)).toBe(true);
  expect(result.body).toBe(false);
});

for (const hash of ["governadores-df", "presidente-zz-pt"]) {
  test(`Espaço preserva recorte sem histórico: ${hash}`, async ({ page }) => {
    await mockLivePanel(page);
    await page.goto(`/apurar/#${hash}`);
    await expect(page.locator("canvas.map").first()).toBeVisible();
    const requests: string[] = [];
    page.on("request", (request) => {
      if (/\/api\/history/.test(request.url())) requests.push(request.url());
    });
    const prevented = await page.evaluate(() => {
      const event = new KeyboardEvent("keydown", {
        code: "Space",
        key: " ",
        bubbles: true,
        cancelable: true,
      });
      document.body.dispatchEvent(event);
      return event.defaultPrevented;
    });
    expect(prevented).toBe(false);
    await expect(page).toHaveURL(new RegExp(`#${hash}$`));
    expect(requests).toEqual([]);
  });
}
