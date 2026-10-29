import { expect, test, type Page } from "@playwright/test";
import { supplementalFixture } from "../packages/contracts/supplemental-fixture";

async function abrirExterior(page: Page, feed: boolean) {
  await page.clock.setFixedTime(new Date("2026-10-25T21:00:00Z"));
  await page.route("**/api/**", (route) =>
    route.fulfill({ status: 503, json: { error: "Indisponível" } }),
  );
  if (feed) {
    const payload = supplementalFixture();
    payload.exterior.countries[0]!.coverage = { available: 1, total: 3 };
    await page.route("**/api/supplemental", (route) =>
      route.fulfill({ json: payload }),
    );
  }
  await page.goto("/apurar/#presidente-zz");
  await expect(
    page.locator(".exterior-stage canvas.map").first(),
  ).toBeVisible();
}

for (const width of [320, 390, 430, 768]) {
  for (const feed of [false, true]) {
    test(`exterior prioriza o mapa a ${width}px ${feed ? "com" : "sem"} fonte`, async ({
      page,
    }) => {
      const height = width === 768 ? 1024 : 844;
      await page.setViewportSize({ width, height });
      await abrirExterior(page, feed);
      const stage = page.locator(".exterior-stage");
      await expect
        .poll(() =>
          stage.evaluate((node) => {
            const canvas = node
              .querySelector("canvas.map")!
              .getBoundingClientRect();
            const stageBounds = node.getBoundingClientRect();
            const filters = document
              .querySelector(".exterior-sidebar")!
              .getBoundingClientRect();
            const result = document
              .querySelector(".exterior-detail")!
              .getBoundingClientRect();
            const padding = parseFloat(getComputedStyle(node).paddingBottom);
            return {
              resized:
                Math.abs(canvas.width - stageBounds.width) < 1 &&
                Math.abs(canvas.height - (stageBounds.height - padding)) < 1,
              mapAfterFilters: canvas.top >= filters.bottom,
              mapInFirstViewport:
                canvas.top + Math.min(canvas.height, 240) < innerHeight,
              resultAfterMap: result.top > canvas.bottom,
              noOverflow: document.documentElement.scrollWidth === innerWidth,
            };
          }),
        )
        .toEqual({
          resized: true,
          mapAfterFilters: true,
          mapInFirstViewport: true,
          resultAfterMap: true,
          noOverflow: true,
        });
      const help = page.locator(".exterior-map-help");
      await expect(help).not.toHaveAttribute("open");
      await help.locator("summary").click();
      await expect(help).toContainText("cobertura pode ser parcial");
      await expect(help).toContainText("empate, sem votos ou sem dados");
      await page.getByRole("button", { name: "Aproximar o mapa" }).click();
      await expect(
        page.getByRole("button", { name: "Voltar ao enquadramento" }),
      ).toBeVisible();
      // O zoom transforma o canvas durante a transição; compare o quadro
      // final, com todas as medidas obtidas na mesma avaliação do DOM.
      await expect
        .poll(() =>
          stage.evaluate((node) => {
            const canvas = node.querySelector("canvas.map")!;
            const mapZoom = node.querySelector<HTMLElement>(".mapzoom")!;
            const zoom = node
              .querySelector(".zoomctl")!
              .getBoundingClientRect();
            const marks = node.querySelector(".marks")!.getBoundingClientRect();
            return {
              settled:
                mapZoom.style.transform === "" &&
                !mapZoom
                  .getAnimations()
                  .some((item) => item.playState === "running"),
              canvasSeparated:
                zoom.top >= canvas.getBoundingClientRect().bottom + 4,
              markersSeparated: marks.bottom <= zoom.top,
            };
          }),
        )
        .toEqual({
          settled: true,
          canvasSeparated: true,
          markersSeparated: true,
        });
      await expect(stage.locator(".marks")).toHaveCSS("overflow", "hidden");
      await page
        .getByRole("button", { name: "Voltar ao enquadramento" })
        .click();
      await page.locator(".exterior-detail").scrollIntoViewIfNeeded();
      const visibleResult = await page
        .locator(".exterior-detail")
        .boundingBox();
      expect(visibleResult!.y).toBeLessThan(height);
      expect(visibleResult!.y + visibleResult!.height).toBeGreaterThan(0);
    });
  }
}

test("filtros preservam país, cidade, cobertura parcial e retorno ao Brasil", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await abrirExterior(page, true);
  await page.getByLabel("País no mapa do exterior").selectOption("PT");
  await expect(page.locator('[data-result-id="PT"]')).toBeVisible();
  await expect(page.locator(".exterior-detail")).toContainText(
    "Total parcial:",
  );
  await page.getByRole("button", { name: "Lisboa", exact: true }).click();
  await expect(page.locator('[data-result-id="ZZ:29955"]')).toBeVisible();
  await expect(page).toHaveURL(/presidente-zz-29955/);
  await page.getByRole("button", { name: "Brasil", exact: true }).click();
  await expect(page.locator(".exterior-principal")).toHaveCount(0);
});

test("seleção sem fonte preserva a indicação de ausência de dados", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 844 });
  await abrirExterior(page, false);
  await page.getByLabel("País no mapa do exterior").selectOption("PT");
  await expect(page.locator(".exterior-detail")).toContainText(
    "Isso não significa zero votos.",
  );
  await page
    .getByLabel("Cidade no mapa do exterior")
    .selectOption({ label: "Lisboa" });
  await expect(page.locator(".exterior-detail")).toContainText(
    "Isso não significa zero votos.",
  );
});
