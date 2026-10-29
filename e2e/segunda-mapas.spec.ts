import { openMapActions, closeMapActions } from "./map-actions";
import { mockLivePanel } from "./bundle-fixture";
import { expect, test } from "@playwright/test";

for (const route of ["/apurar/", "/1turno/"]) {
  test(`mapa oferece ampliação sem gesto e enquadramento em ${route}`, async ({
    page,
    isMobile,
  }) => {
    await mockLivePanel(page);
    await page.goto(route);
    const zoom = page.getByRole("group", { name: "Zoom do mapa", exact: true });
    const closer = zoom.getByRole("button", { name: "Aproximar o mapa" });
    const farther = zoom.getByRole("button", { name: "Afastar o mapa" });
    await expect(closer).toBeVisible();
    await expect(farther).toBeDisabled();
    if (isMobile) {
      const legend = page.locator(".compact-map-legend .mapleg");
      await expect(legend).toHaveCSS("opacity", "1");
      await expect(
        legend.getByRole("group", { name: "Legenda do mapa" }),
      ).toBeVisible();
      await openMapActions(page);
      for (const button of [closer, farther, page.locator(".expill")]) {
        const box = await button.boundingBox();
        expect(box?.width).toBeGreaterThanOrEqual(44);
        expect(box?.height).toBeGreaterThanOrEqual(44);
      }
      await closeMapActions(page);
    }
    await closer.click();
    const reset = zoom.getByRole("button", { name: "Voltar ao enquadramento" });
    await expect(reset).toBeVisible();
    await expect(farther).toBeEnabled();
    await reset.click();
    await expect(reset).toHaveCount(0);
    await expect(farther).toBeDisabled();
  });

  test(`mapa descreve alternativa textual para leitores de tela em ${route}`, async ({
    page,
  }) => {
    await mockLivePanel(page);
    await page.goto(route);
    const map = page.getByRole("img", { name: "Mapa eleitoral do Brasil" });
    await expect(map).toBeVisible();
    await expect(map).toHaveAttribute("aria-description", /busca de local/);
    await expect(map).toHaveAttribute("aria-description", /legenda do mapa/);
    await expect(
      page.getByRole("button", {
        name: "Buscar município, estado ou candidato",
        exact: true,
      }),
    ).toBeVisible();
  });
}

test("legenda compacta acompanha recorte municipal e exterior", async ({
  page,
  isMobile,
}) => {
  test.skip(!isMobile, "A legenda compacta pertence ao layout móvel.");
  await mockLivePanel(page);
  await page.goto("/1turno/#presidente-sp");
  await expect(page.locator(".compact-map-legend")).toContainText(
    "Liderança por município",
  );
  await expect(page.locator(".compact-map-legend")).toContainText("municípios");
  await mockLivePanel(page);
  await page.goto("/apurar/#presidente-zz");
  await expect(page.locator(".exterior-legend")).toContainText(
    "sem votos ou sem dados disponíveis",
  );
});
