import { expect, test } from "@playwright/test";
import { mockLivePanel } from "./bundle-fixture";

for (const width of [320, 390, 430]) {
  for (const route of ["/apurar/", "/1turno/"]) {
    for (const location of ["", "#presidente-rj", "#presidente-rj-3304557"]) {
      test(`mapa precede os detalhes em ${route}${location} a ${width}px`, async ({
        page,
      }) => {
        await page.setViewportSize({ width, height: 844 });
        await page.route("**/api/**", (request) =>
          request.fulfill({ status: 503, json: {} }),
        );
        await page.goto(`${route}${location}`);
        const map = page.locator(".pres-map-first > .mapwrap");
        await expect(map.locator("canvas.map[role=img]")).toBeVisible();
        const context = page.locator(".pres-map-context");
        await expect(context).toContainText(
          location ? "Rio de Janeiro" : "Brasil",
        );
        if (route === "/1turno/" && location.endsWith("3304557")) {
          await expect(
            page.getByRole("searchbox", { name: "Buscar um bairro pelo nome" }),
          ).toBeVisible();
        }
        const geometry = await page
          .locator(".pres-map-first")
          .evaluate((node) => {
            const map = node.querySelector(".mapwrap")!.getBoundingClientRect();
            const details = node
              .querySelector(".pres-results")!
              .getBoundingClientRect();
            return {
              top: map.top,
              bottom: map.bottom,
              height: map.height,
              detailsTop: details.top,
            };
          });
        expect(geometry.top).toBeLessThan(440);
        expect(geometry.bottom).toBeLessThan(844);
        expect(geometry.height).toBeGreaterThan(250);
        expect(geometry.detailsTop).toBeGreaterThan(geometry.bottom);
        expect(
          await page.evaluate(() => document.documentElement.scrollWidth),
        ).toBeLessThanOrEqual(width);
        const button = page.getByRole("button", { name: "Ver resultados" });
        await button.focus();
        await page.keyboard.press("Enter");
        await expect(page.locator(".pres-results")).toBeFocused();
        const detailsBounds = await page
          .locator(".pres-results")
          .evaluate((node) => {
            const bounds = node.getBoundingClientRect();
            return {
              top: bounds.top,
              bottom: bounds.bottom,
              height: bounds.height,
            };
          });
        expect(detailsBounds.top).toBeGreaterThanOrEqual(70);
        if (detailsBounds.height < 600)
          expect(detailsBounds.bottom).toBeLessThanOrEqual(844);
        else expect(detailsBounds.top).toBeLessThan(200);
      });
    }
  }

  test(`dados oficiais preservados abaixo do mapa a ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 844 });
    await mockLivePanel(page);
    await page.goto("/apurar/");
    const details = page.locator(".pres-results");
    await expect(details.locator(".hero .leader").first()).toBeVisible();
    await expect(details.locator(".apurar-projection")).toContainText("51,2%");
    await expect(page.locator(".pres-map-context")).toContainText(
      "25,0% das seções totalizadas",
    );
    await expect(page.locator(".pres-map-context")).not.toContainText(
      "experimental",
    );
    const positions = await page.evaluate(() => ({
      map: document
        .querySelector(".pres-map-first > .mapwrap")!
        .getBoundingClientRect().bottom,
      result: document.querySelector(".pres-results")!.getBoundingClientRect()
        .top,
    }));
    expect(positions.result).toBeGreaterThan(positions.map);
  });
}

for (const route of ["/apurar/", "/1turno/"]) {
  test(`seleção preserva mapa visível e volta dos detalhes em ${route}`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.route("**/api/**", (request) =>
      request.fulfill({ status: 503, json: {} }),
    );
    await page.goto(route);
    await expect(page.locator(".pres-map-context")).toContainText("Brasil");
    await page.evaluate(() => scrollTo(0, 50));
    await page.evaluate(() => {
      location.hash = "presidente-rj";
    });
    await expect(page.locator(".pres-map-context")).toContainText(
      "Rio de Janeiro",
    );
    // Um resultado curto pode reduzir o documento e reajustar scrollY.
    // A seleção deve manter o mapa visível, independentemente da faixa removida.
    await expect
      .poll(() =>
        page.locator(".pres-map-first > .mapwrap").evaluate((map) => {
          const bounds = map.getBoundingClientRect();
          return bounds.top >= 0 && bounds.bottom <= innerHeight;
        }),
      )
      .toBe(true);
    const controls = await page
      .locator(".pres-map-first > .mapwrap")
      .evaluate((node) => ({
        canvasBottom: node.querySelector("canvas.map")!.getBoundingClientRect()
          .bottom,
        zoomTop: node.querySelector(".zoomctl")!.getBoundingClientRect().top,
      }));
    expect(controls.zoomTop).toBeGreaterThanOrEqual(controls.canvasBottom + 8);
    await page.goto(route);
    await page.getByRole("button", { name: "Ver resultados" }).click();
    await expect(page.locator(".pres-results")).toBeFocused();
    await page.evaluate(() => {
      location.hash = "presidente-sp";
    });
    await expect(page.locator(".pres-map-context")).toContainText("São Paulo");
    await expect
      .poll(async () => {
        const map = await page
          .locator(".pres-map-first > .mapwrap")
          .boundingBox();
        return !!map && map.y > 0 && map.y + map.height < 844;
      })
      .toBe(true);
  });
}
