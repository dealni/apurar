import { expect, test } from "@playwright/test";

test("arquivo original /1turno preserva o mapa e identifica a captura histórica", async ({
  page,
}) => {
  const errors: string[] = [];
  const commercialRequests: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("request", (request) => {
    if (new URL(request.url()).pathname === "/1turno/feed/anuncio.json")
      commercialRequests.push(request.url());
  });
  await page.goto("/1turno/", { waitUntil: "networkidle" });
  await expect(page.locator("#app")).not.toBeEmpty();
  await expect.poll(() => page.locator("canvas").count()).toBeGreaterThan(0);
  await expect(
    page.getByText(/captura|arquivad|históric/i).first(),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  expect(errors).toEqual([]);
  expect(commercialRequests).toEqual([]);
  await expect(page.locator("body")).not.toContainText(/Pandora|G4 Valley/);
  await expect(page.locator('meta[name="google-adsense-account"]')).toHaveCount(
    0,
  );
});
