import { openImageShareMenu, openMapActions } from "./map-actions";
import { test, expect } from "@playwright/test";
import { supplementalFixture } from "../packages/contracts/supplemental-fixture";

test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(new Date("2026-10-25T21:00:00Z"));
});

test("resultado exterior preserva cobertura e omite percentual incompleto", async ({
  page,
  isMobile,
}) => {
  const payload = supplementalFixture();
  const country = payload.exterior.countries[0]!;
  country.name = "São Tomé e Príncipe";
  country.coverage = { available: 1, total: 3 };
  country.stale = true;
  country.candidates.push({ ...country.candidates[0]!, id: "22", votes: 90 });
  country.totals = { ...country.totals, valid: 190 };
  await page.route("**/api/supplemental", (route) =>
    route.fulfill({ json: payload }),
  );
  await page.goto("/apurar/#presidente-zz-pt");
  const resultsTab = page
    .getByRole("navigation", { name: "Seções", exact: true })
    .getByRole("button", { name: "Resultados", exact: true });
  if (isMobile && (await resultsTab.isVisible())) await resultsTab.click();
  const result = page.locator('[data-result-id="PT"]');
  await expect(result).toBeVisible();
  const votes = result.locator(".votes");
  await expect(votes).toHaveCount(2);
  for (const [index, value] of ["100", "90"].entries()) {
    await expect(votes.nth(index).locator(".sr")).toHaveText(value);
    await expect(votes.nth(index).locator('[aria-hidden="true"]')).toHaveText(
      value,
    );
    await expect(votes.nth(index)).toContainText("votos");
  }
  await expect(result.getByText("Percentual indisponível")).toHaveCount(2);
  await expect(
    result.getByText("Último resultado preservado", { exact: false }),
  ).toBeVisible();
  await expect(
    result.getByText("Total parcial:", { exact: false }),
  ).toBeVisible();
  await expect(
    result.getByText("Soma das cidades oficiais disponíveis.", {
      exact: false,
    }),
  ).toBeVisible();
  await expect(
    result.getByText("% dos votos computados", { exact: false }),
  ).toHaveCount(0);
});

test("entrada no exterior usa sua fonte própria sem replay", async ({
  page,
}) => {
  const { demo, demoHistory } = await import("../apps/web/src/demo");
  const { mockManifest } = await import("./bundle-fixture");
  await page.clock.install({ time: new Date("2026-10-25T20:00:00-03:00") });
  const stamp = "2026-10-25T20:00:00-03:00";
  const snapshot = {
    ...demo,
    mode: "live",
    snapshot_id: "exterior-replay",
    published_at: stamp,
    source: { ...demo.source, as_of: stamp, collected_at: stamp },
  };
  await mockManifest(page, () => snapshot.snapshot_id);
  await page.route("**/api/snapshots/*", (route) =>
    route.fulfill({ json: snapshot }),
  );
  await page.route("**/api/municipalities/*", (route) =>
    route.fulfill({
      json: {
        schema_version: 1,
        election: "6258",
        snapshot_id: snapshot.snapshot_id,
        items: [],
      },
    }),
  );
  await page.route("**/api/history/*", (route) =>
    route.fulfill({
      json: {
        schema_version: 1,
        election: "6258",
        snapshot_id: snapshot.snapshot_id,
        points: demoHistory,
      },
    }),
  );
  await page.route("**/api/supplemental", (route) =>
    route.fulfill({ json: supplementalFixture() }),
  );
  await page.goto("/apurar/");
  await expect(
    page.getByRole("slider", { name: "Hora da apuração" }),
  ).toHaveCount(0);
  await page.evaluate(() => {
    location.hash = "presidente-zz-29955";
  });
  const exterior = page.getByRole("region", {
    name: "Mapa principal do exterior",
  });
  await expect(exterior).toBeVisible();
  await expect(page.locator(".apurar-source")).toHaveCount(0);
  await expect(exterior.locator('[data-result-id="ZZ:29955"]')).toContainText(
    "Fonte: 25/10/2026, 17:05:00 · Brasília",
  );
  await expect(exterior.getByRole("slider")).toHaveCount(0);
  await openMapActions(page);
  await exterior.getByRole("button", { name: "Brasil", exact: true }).click();
  await expect(page.locator(".tlbar, .live.replay")).toHaveCount(0);
});

for (const recorte of [
  { hash: "presidente-zz-29955", id: "ZZ:29955", filename: "29955" },
  { hash: "presidente-zz-pt", id: "PT", filename: "PT" },
]) {
  for (const shell of [false, true]) {
    test(`uma candidatura com cobertura completa preserva votos sem criar 100% na tela e PNG: ${recorte.id} ${shell ? "abas" : "fluxo"}`, async ({
      page,
    }, info) => {
      if (shell)
        await page.addInitScript(() => {
          let config: Record<string, unknown>;
          Object.defineProperty(window, "APURACAO", {
            configurable: true,
            get: () => config,
            set: (value) => {
              config = { ...value, shell: true };
            },
          });
        });
      const payload = supplementalFixture();
      payload.exterior.cities[0]!.coverage = { available: 1, total: 1 };
      payload.exterior.countries[0]!.coverage = { available: 1, total: 1 };
      await page.route("**/api/**", (route) =>
        route.fulfill({ status: 503, json: {} }),
      );
      await page.route("**/api/supplemental", (route) =>
        route.fulfill({ json: payload }),
      );
      await page.addInitScript(() => {
        const texts: string[] = [];
        Object.assign(window, { officialPngTexts: texts });
        const fill = CanvasRenderingContext2D.prototype.fillText;
        CanvasRenderingContext2D.prototype.fillText = function (
          text,
          x,
          y,
          width,
        ) {
          texts.push(String(text));
          if (width === undefined) fill.call(this, text, x, y);
          else fill.call(this, text, x, y, width);
        };
      });
      await page.goto(`/apurar/#${recorte.hash}`);
      const tab = page
        .getByRole("navigation", { name: "Seções", exact: true })
        .getByRole("button", { name: "Resultados", exact: true });
      if (await tab.isVisible()) await tab.click();
      const result = page.locator(`[data-result-id="${recorte.id}"]`);
      await expect(result).toBeVisible();
      await expect(result.locator(".votes .sr")).toHaveText("100");
      await expect(result.locator('.votes [aria-hidden="true"]')).toHaveText(
        "100",
      );
      await expect(
        result.getByText("Percentual indisponível", { exact: true }),
      ).toBeVisible();
      await expect(result.locator(".leaders .fig")).toHaveCount(0);
      await expect(result).not.toContainText("100%");
      await expect(result).not.toContainText("100,00%");
      await expect(
        result.getByRole("img", { name: /50% dos votos/ }),
      ).toHaveCount(0);
      await expect(
        result.getByRole("progressbar", { name: "Seções totalizadas" }),
      ).toHaveAttribute("aria-valuenow", "20");
      await expect(result).toContainText("17:05:00");
      await page.evaluate(() => {
        (
          window as unknown as { officialPngTexts: string[] }
        ).officialPngTexts.length = 0;
      });
      const downloaded = page.waitForEvent("download");
      await openImageShareMenu(page);
      await page
        .getByRole("button", { name: "Compartilhar imagem", exact: true })
        .click();
      const file = await downloaded;
      expect(file.suggestedFilename()).toBe(
        `apurar-exterior-${recorte.filename}.png`,
      );
      const text = await page.evaluate(() =>
        (
          window as unknown as { officialPngTexts: string[] }
        ).officialPngTexts.join(" "),
      );
      expect(text).toContain("100 votos · Percentual indisponível");
      expect(text).toContain("17:05:00");
      expect(text).toContain("Cobertura: 1 de 1 cidades disponíveis");
      expect(text).not.toMatch(/100(?:,0+)?%/);
      const pngPath = info.outputPath(
        `uma-candidatura-${recorte.filename}.png`,
      );
      await file.saveAs(pngPath);
      await info.attach("PNG com uma candidatura oficial", {
        path: pngPath,
        contentType: "image/png",
      });
    });
  }
}
