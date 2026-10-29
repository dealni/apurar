import { expect, test } from "@playwright/test";
import { supplementalFixture } from "../packages/contracts/supplemental-fixture";

for (const viewport of [
  { width: 1024, height: 600 },
  { width: 1440, height: 500 },
]) {
  for (const textScale of [1, 2]) {
    test(`faixa vazia de governadores e ações legíveis ${viewport.width}×${viewport.height} texto ${textScale * 100}%`, async ({
      page,
      isMobile,
    }) => {
      test.skip(isMobile, "Geometria desktop controlada pelo teste.");
      await page.setViewportSize(viewport);
      await page.route("**/api/**", (route) =>
        route.fulfill({ status: 503, json: { error: "Indisponível" } }),
      );
      await page.goto("/apurar/#governadores");
      await expect(page.locator(".gov-scoreboard")).toBeVisible();
      if (textScale === 2) {
        // Emulação de ampliação apenas do texto, preservando a viewport CSS.
        await page.evaluate(() => {
          const sizes = Array.from(
            document.querySelectorAll<HTMLElement>("body *"),
            (node) => [node, getComputedStyle(node).fontSize] as const,
          );
          for (const [node, size] of sizes)
            node.style.fontSize = `${parseFloat(size) * 2}px`;
        });
      }
      const geometry = await page.evaluate(() => {
        const bounds = (selector: string) =>
          document.querySelector(selector)!.getBoundingClientRect();
        const title = bounds(".gov-scoreboard .rb-head");
        const summary = bounds(".gov-scoreboard .note");
        const banner = bounds(".gov-scoreboard");
        const workspace = bounds(".gov-workspace");
        const status = bounds(".hudtop > .status");
        return {
          titleFits:
            title.width >=
            document.querySelector(".gov-scoreboard .rb-head")!.scrollWidth - 1,
          summaryAfterTitle: summary.top >= title.bottom,
          workspaceAfterBanner: workspace.top >= banner.bottom,
          actionsFit: status.right <= innerWidth,
          mapHasHeight: workspace.height > 100,
          noOverflow: document.documentElement.scrollWidth <= innerWidth,
        };
      });
      expect(geometry).toEqual({
        titleFits: true,
        summaryAfterTitle: true,
        workspaceAfterBanner: true,
        actionsFit: true,
        mapHasHeight: true,
        noOverflow: true,
      });
    });
  }
}

for (const location of ["governadores-ac", "presidente-zz"]) {
  test(`texto 200% preserva participação sem faixa superior em 320px ${location}`, async ({
    page,
  }) => {
    await page.clock.setFixedTime(new Date("2026-10-25T21:00:00Z"));
    await page.setViewportSize({ width: 320, height: 568 });
    await page.route("**/api/**", (route) =>
      route.fulfill({ status: 503, json: { error: "Indisponível" } }),
    );
    if (location === "presidente-zz")
      await page.route("**/api/supplemental", (route) =>
        route.fulfill({ json: supplementalFixture() }),
      );
    await page.goto(`/apurar/#${location}`);
    if (location === "presidente-zz")
      await page.getByLabel("País no mapa do exterior").selectOption("PT");
    await expect(page.locator(".official-totals").first()).toBeAttached();
    await page.evaluate(() => {
      const sizes = Array.from(
        document.querySelectorAll<HTMLElement>("body *"),
        (node) => [node, getComputedStyle(node).fontSize] as const,
      );
      for (const [node, size] of sizes)
        node.style.fontSize = `${parseFloat(size) * 2}px`;
    });
    const layout = await page.evaluate(() => {
      const totals = document.querySelector(".official-totals")!;
      const cells = [...totals.children].map((node) =>
        node.getBoundingClientRect(),
      );
      return {
        sourceBarAbsent: !document.querySelector(".apurar-source"),
        singleColumn: cells.every(
          (cell) => Math.abs(cell.left - cells[0]!.left) < 1,
        ),
        noOverflow: document.documentElement.scrollWidth <= innerWidth,
      };
    });
    expect(layout).toEqual({
      sourceBarAbsent: true,
      singleColumn: true,
      noOverflow: true,
    });
  });
}
