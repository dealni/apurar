import { expect, test } from "@playwright/test";
import { openMapActions } from "./map-actions";
import { mockLivePanel } from "./bundle-fixture";

for (const path of [
  "/apurar/#presidente-sp",
  "/1turno/#presidente-sp",
  "/apurar/#governadores-ac",
  "/apurar/#presidente-zz-pt",
]) {
  test(`compartilhar preserva a vista, oferece redes e devolve foco: ${path}`, async ({
    page,
    isMobile,
  }) => {
    if (isMobile) await page.setViewportSize({ width: 320, height: 568 });
    await mockLivePanel(page);
    await page.goto(path);
    await openMapActions(page);
    const trigger = page.getByRole("button", {
      name: "Compartilhar",
      exact: true,
    });
    await expect(trigger).toContainText("Compartilhar");
    const url = page.url();
    await trigger.click();
    const panel = page.getByRole("dialog", {
      name: "Compartilhar",
      exact: true,
    });
    await expect(panel).toBeVisible();
    await expect(panel.getByLabel("Link desta vista")).toHaveValue(url);
    for (const [name, host, param] of [
      ["WhatsApp", "wa.me", "text"],
      ["Telegram", "t.me", "url"],
      ["X", "x.com", "url"],
      ["Facebook", "www.facebook.com", "u"],
    ] as const) {
      const link = panel.getByRole("link", { name, exact: true });
      await expect(link.locator("img")).toBeVisible();
      await expect
        .poll(() =>
          link
            .locator("img")
            .evaluate(
              (image: HTMLImageElement) =>
                image.complete && image.naturalWidth > 0,
            ),
        )
        .toBe(true);
      const target = new URL((await link.getAttribute("href"))!);
      expect(target.hostname).toBe(host);
      expect(target.searchParams.get(param)).toContain(url);
      await expect(link).toHaveAttribute("rel", "noopener noreferrer");
    }
    const box = (await panel.boundingBox())!;
    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width).toBeLessThanOrEqual(page.viewportSize()!.width);
    expect(box.y).toBeGreaterThanOrEqual(0);
    expect(box.y + box.height).toBeLessThanOrEqual(page.viewportSize()!.height);
    await page.screenshot({ path: test.info().outputPath("compartilhar.png") });
    await page.keyboard.press("Escape");
    await expect(panel).toHaveCount(0);
    const actions = page.locator(".map-actions > summary");
    await expect(isMobile ? actions : trigger).toBeFocused();
    await expect(page).toHaveURL(url);
  });
}

test("copiar link confirma somente após sucesso e oferece cópia manual em falha", async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "clipboard", {
      value: {
        writeText: async (text: string) => {
          if ((window as unknown as { rejectCopy?: boolean }).rejectCopy)
            throw new Error("denied");
          Object.assign(window, { copiedLink: text });
        },
      },
    });
  });
  await mockLivePanel(page);
  await page.goto("/apurar/#presidente-rj");
  await openMapActions(page);
  await page.getByRole("button", { name: "Compartilhar", exact: true }).click();
  const panel = page.getByRole("dialog", { name: "Compartilhar", exact: true });
  await panel.getByRole("button", { name: "Copiar link", exact: true }).click();
  await expect(panel.getByRole("status")).toHaveText("Link copiado.");
  expect(
    await page.evaluate(
      () => (window as unknown as { copiedLink: string }).copiedLink,
    ),
  ).toBe(page.url());
  await page.evaluate(() => Object.assign(window, { rejectCopy: true }));
  await panel.getByRole("button", { name: "Copiar link", exact: true }).click();
  await expect(panel.getByRole("status")).toContainText(
    "Não foi possível copiar",
  );
  await expect(panel.getByLabel("Link desta vista")).toBeFocused();
});

test("compartilhamento nativo respeita cancelamento e troca de local fecha o diálogo", async ({
  page,
}) => {
  await page.addInitScript(() =>
    Object.defineProperty(navigator, "share", {
      value: async (data: ShareData) => {
        Object.assign(window, { sharedLink: data.url });
        throw new DOMException("Cancelado", "AbortError");
      },
    }),
  );
  await mockLivePanel(page);
  await page.goto("/apurar/#presidente-sp");
  await openMapActions(page);
  await page.getByRole("button", { name: "Compartilhar", exact: true }).click();
  const panel = page.getByRole("dialog", { name: "Compartilhar", exact: true });
  await panel.getByRole("button", { name: "Mais opções", exact: true }).click();
  await expect(
    panel.getByRole("button", { name: "Mais opções", exact: true }),
  ).toBeEnabled();
  await expect(panel.getByRole("status", { includeHidden: true })).toBeEmpty();
  expect(
    await page.evaluate(
      () => (window as unknown as { sharedLink: string }).sharedLink,
    ),
  ).toBe(page.url());
  await page.evaluate(() => {
    location.hash = "presidente-rj";
  });
  await expect(panel).toHaveCount(0);
});
