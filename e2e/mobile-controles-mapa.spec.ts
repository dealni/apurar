import { expect, test } from "@playwright/test";

for (const width of [320, 390, 430]) {
  for (const route of ["#governadores", "#presidente-zz-pt"]) {
    test(`zoom preserva os alvos do mapa ${route} a ${width}px`, async ({
      page,
      isMobile,
    }) => {
      test.skip(!isMobile, "Verificação de toque no celular.");
      await page.setViewportSize({ width, height: 844 });
      await page.route("**/api/**", (request) =>
        request.fulfill({ status: 503, json: {} }),
      );
      await page.goto(`/apurar/${route}`);
      const stage = page.locator(".gov-stage, .exterior-stage");
      await expect(stage.locator("canvas.map").first()).toBeVisible();
      await stage.scrollIntoViewIfNeeded();
      const geometry = await stage.evaluate((node) => {
        const map = node.querySelector("canvas.map")!.getBoundingClientRect();
        const zoom = node.querySelector(".zoomctl")!.getBoundingClientRect();
        const labelsCovered = [...node.querySelectorAll(".mk")]
          .filter((label) => {
            const bounds = label.getBoundingClientRect();
            return (
              bounds.left < zoom.right &&
              bounds.right > zoom.left &&
              bounds.top < zoom.bottom &&
              bounds.bottom > zoom.top
            );
          })
          .map((label) => label.textContent);
        return { mapBottom: map.bottom, zoomTop: zoom.top, labelsCovered };
      });
      expect(geometry.zoomTop).toBeGreaterThanOrEqual(geometry.mapBottom + 4);
      expect(geometry.labelsCovered).toEqual([]);
      const zoomIn = page.getByRole("button", {
        name: "Aproximar o mapa",
        exact: true,
      });
      await zoomIn.scrollIntoViewIfNeeded();
      expect(
        await zoomIn.evaluate((node) => {
          const bounds = node.getBoundingClientRect();
          return node.contains(
            document.elementFromPoint(
              bounds.left + bounds.width / 2,
              bounds.top + bounds.height / 2,
            ),
          );
        }),
      ).toBe(true);
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth),
      ).toBeLessThanOrEqual(width);
    });
  }
}

for (const path of ["/apurar/", "/1turno/"]) {
  test(`voltar e candidaturas secundárias têm alvos de toque em ${path}`, async ({
    page,
    isMobile,
  }) => {
    test.skip(!isMobile, "Verificação de toque no celular.");
    await page.setViewportSize({ width: 320, height: 844 });
    await page.route("**/api/**", (request) =>
      request.fulfill({ status: 503, json: {} }),
    );
    if (path === "/1turno/") {
      await page.goto(path);
      const candidates = page.locator(".others .crow.clk");
      await expect(candidates.first()).toBeVisible();
      expect(
        await candidates.evaluateAll((nodes) =>
          nodes.every((node) => node.getBoundingClientRect().height >= 44),
        ),
      ).toBe(true);
    }
    await page.goto(`${path}#presidente-rj-3304557`);
    const back = page.getByRole("button", {
      name: "Voltar para Rio de Janeiro",
    });
    await expect(back).toBeVisible();
    expect((await back.boundingBox())!.height).toBeGreaterThanOrEqual(44);
  });
}
