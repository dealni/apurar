import { expect, test } from "@playwright/test";

const routes = [
  "/apurar/",
  "/1turno/",
  "/apurar/#governadores",
  "/apurar/#presidente-zz-pt",
];

for (const width of [320, 390, 430]) {
  for (const path of routes) {
    test(`cabeçalho prioriza navegação e busca em ${path} a ${width}px`, async ({
      page,
      isMobile,
    }) => {
      test.skip(!isMobile, "Geometria e interação de toque do celular.");
      await page.setViewportSize({ width, height: 844 });
      await page.route("**/api/**", (route) =>
        route.fulfill({ status: 503, json: {} }),
      );
      await page.goto(path);
      const header = page.locator(".clean-header");
      const actions = header.locator(".map-actions");
      const trigger = actions.locator("summary");
      await expect(trigger).toBeVisible();
      expect((await header.boundingBox())!.height).toBe(44);
      for (const control of [
        header.locator(".site-brand-link"),
        header.getByRole("button", { name: "Abrir navegação" }),
        header.locator(".sbtn"),
        trigger,
      ]) {
        const bounds = (await control.boundingBox())!;
        expect(bounds.height).toBeGreaterThanOrEqual(44);
        expect(bounds.width).toBeGreaterThanOrEqual(44);
        expect(bounds.x).toBeGreaterThanOrEqual(0);
        expect(bounds.x + bounds.width).toBeLessThanOrEqual(width);
      }
      await trigger.click();
      const panel = actions.getByRole("group", { name: "Ações do mapa" });
      await expect(panel).toBeVisible();
      const panelBounds = (await panel.boundingBox())!;
      expect(panelBounds.x).toBeGreaterThanOrEqual(0);
      expect(panelBounds.x + panelBounds.width).toBeLessThanOrEqual(width);
      await expect(
        panel.getByRole("button", { name: "Tela cheia", exact: true }),
      ).toBeVisible();
      await expect(
        panel.getByRole("button", {
          name: "Compartilhar",
          exact: true,
        }),
      ).toBeVisible();
      expect(
        await panel
          .getByRole("button")
          .evaluateAll((nodes) =>
            nodes.every((node) => node.getBoundingClientRect().height >= 44),
          ),
      ).toBe(true);
      await panel
        .getByRole("button", { name: "Tela cheia", exact: true })
        .focus();
      await page.keyboard.press("Escape");
      await expect(actions).not.toHaveAttribute("open", "");
      await expect(trigger).toBeFocused();
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth),
      ).toBeLessThanOrEqual(width);
      await header.getByRole("button", { name: "Abrir navegação" }).click();
      await expect(page.locator("#site-navigation-dialog")).toBeVisible();
      await page.keyboard.press("Escape");
      await header.locator(".sbtn").click();
      await expect(page.locator(".sin input")).toBeVisible();
    });
  }
}

test("ações secundárias continuam diretas no computador", async ({
  page,
  isMobile,
}) => {
  test.skip(isMobile, "Controles do cabeçalho desktop.");
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.route("**/api/**", (route) =>
    route.fulfill({ status: 503, json: {} }),
  );
  await page.goto("/apurar/");
  const header = page.locator(".clean-header");
  await expect(
    header.getByRole("button", { name: "Tela cheia", exact: true }),
  ).toBeVisible();
  await expect(
    header.getByRole("button", {
      name: "Compartilhar",
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    header.getByRole("button", {
      name: "Ver os votos do exterior",
      exact: true,
    }),
  ).toBeVisible();
  await expect(header.locator(".map-actions")).toHaveCount(0);
});

for (const width of [320, 390, 430]) {
  for (const path of ["/apurar/", "/1turno/"]) {
    test(`cargos continuam acessíveis abaixo da fonte após rolar ${path} a ${width}px`, async ({
      page,
      isMobile,
    }) => {
      test.skip(!isMobile, "Rolagem da composição mobile.");
      await page.setViewportSize({ width, height: 844 });
      await page.route("**/api/**", (route) =>
        route.fulfill({ status: 503, json: {} }),
      );
      await page.goto(path);
      await page
        .getByRole("button", { name: "Ver resultados", exact: true })
        .click();
      await expect(page.locator(".pres-results")).toBeFocused();
      const geometry = await page.evaluate(() => {
        const source = document
          .querySelector(".archive-source")
          ?.getBoundingClientRect();
        const selector = document
          .querySelector(".hud.flow > .swbar")!
          .getBoundingClientRect();
        const active = document.querySelector(
          '.swbar button[aria-pressed="true"]',
        )!;
        const bounds = active.getBoundingClientRect();
        return {
          sourceBottom: source?.bottom ?? 0,
          selectorTop: selector.top,
          activeReceivesTouch: active.contains(
            document.elementFromPoint(
              bounds.left + bounds.width / 2,
              bounds.top + bounds.height / 2,
            ),
          ),
        };
      });
      expect(geometry.selectorTop).toBeGreaterThanOrEqual(
        geometry.sourceBottom - 1,
      );
      expect(geometry.activeReceivesTouch).toBe(true);
    });
  }
}
