import { test, expect } from "@playwright/test";

test("sem API, o painel aguarda dados sem inventar candidaturas ou percentuais", async ({
  page,
  baseURL,
}) => {
  const remote: string[] = [];
  const missing: string[] = [];
  const errors: string[] = [];
  const origin = new URL(baseURL!).origin;
  await page.route("**/*", (route) => {
    const url = new URL(route.request().url());
    if (url.protocol.startsWith("http") && url.origin !== origin) {
      remote.push(url.href);
      return route.abort();
    }
    if (url.pathname.startsWith("/api/"))
      return route.fulfill({
        status: 503,
        contentType: "application/json",
        json: { error: "Fonte indisponível no teste" },
      });
    return route.continue();
  });
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("response", (response) => {
    if (
      response.status() >= 400 &&
      !new URL(response.url()).pathname.startsWith("/api/")
    )
      missing.push(response.url());
  });

  await page.goto("/apurar/");
  await expect(
    page.getByRole("heading", { name: "Aguardando dados oficiais" }).first(),
  ).toBeVisible();
  await expect(page.getByText(/Candidatura [AB]/)).toHaveCount(0);
  await expect(page.getByText("50%", { exact: true })).toHaveCount(0);
  await expect(page.locator("canvas.map").first()).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
  expect(
    await page.evaluate(() => document.fonts.check('16px "Apurar Sans"')),
  ).toBe(true);
  expect(
    await page
      .locator("img")
      .evaluateAll(async (images: HTMLImageElement[]) => {
        // Emotes ocultos são lazy; valide os arquivos sem exigir download na abertura.
        for (const image of images) image.loading = "eager";
        await Promise.all(images.map((image) => image.decode()));
        return images.every(
          (image) => image.complete && image.naturalWidth > 0,
        );
      }),
  ).toBe(true);
  expect(remote).toEqual([]);
  expect(missing).toEqual([]);
  expect(errors).toEqual([]);
});
