import { expect, test } from "@playwright/test";

test("marca identifica todas as entradas e leva ao início", async ({
  page,
  isMobile,
}) => {
  for (const path of ["/", "/apurar/?demo=1", "/1turno/"]) {
    await page.goto(path);
    const logo = page.locator("header .apurar-wordmark").first();
    await expect(logo).toBeVisible();
    await expect(logo).toHaveAttribute("alt", "Apurar");
    await expect(logo).toHaveJSProperty("complete", true);
    expect(
      await logo.evaluate((image: HTMLImageElement) => image.naturalWidth),
    ).toBeGreaterThan(0);
    const link = logo.locator("..");
    await expect(link).toHaveAttribute("href", "/");
    expect((await link.boundingBox())!.height).toBeGreaterThanOrEqual(
      isMobile ? 44 : 24,
    );
    await expect(page.locator('link[rel="icon"]')).toHaveAttribute(
      "href",
      "/favicon.svg",
    );
    await link.click();
    await expect(page).toHaveURL(/\/$/);
    await expect(page.locator("canvas.map").first()).toBeVisible();
  }
});

test("início carrega marca e ícones sem JavaScript", async ({
  browser,
  baseURL,
}) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto(`${baseURL}/`);
  const logo = page.getByRole("img", { name: "Apurar", exact: true });
  await expect(logo).toBeVisible();
  expect(
    await logo.evaluate((image: HTMLImageElement) => image.naturalWidth),
  ).toBeGreaterThan(0);
  for (const icon of [
    "/favicon.svg",
    "/favicon.ico",
    "/apple-touch-icon.png",
  ]) {
    const response = await page.request.get(`${baseURL}${icon}`);
    expect(response.ok()).toBe(true);
    expect((await response.body()).length).toBeGreaterThan(100);
  }
  await context.close();
});
