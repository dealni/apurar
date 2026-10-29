import { openImageShareMenu, openMapFilters } from "./map-actions";
import { expect, test, type Page } from "@playwright/test";
import { supplementalFixture } from "../packages/contracts/supplemental-fixture";

test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(new Date("2026-10-25T21:00:00Z"));
});

async function preparar(
  page: Page,
  status: "stale" | "withheld" | "available",
) {
  const payload = supplementalFixture();
  const base = payload.exterior.cities[0]!;
  payload.governors = [
    {
      ...base,
      id: "DF:aggregate",
      name: "Distrito Federal",
      scope: "state",
      office: "governor",
      election: "6260",
      uf: "DF",
      as_of: "2026-10-25T20:20:00Z",
      status: status === "withheld" ? "withheld" : "available",
      stale: status === "stale",
      candidates: [
        { ...base.candidates[0]!, id: "11", name: "Estadual Alfa", votes: 650 },
        { ...base.candidates[0]!, id: "22", name: "Estadual Beta", votes: 350 },
      ],
      sections: { counted: 7, total: 10 },
      totals: { ...base.totals, valid: 1000 },
    },
  ];
  await page.route("**/api/**", (route) =>
    route.fulfill({ status: 503, json: {} }),
  );
  await page.route("**/api/supplemental", (route) =>
    route.fulfill({ json: payload }),
  );
  await page.addInitScript(() => {
    const capture = {
      texts: [] as string[],
      calls: 0,
      release: null as null | ((success: boolean) => void),
    };
    Object.assign(window, { pngCapture: capture });
    const fill = CanvasRenderingContext2D.prototype.fillText;
    CanvasRenderingContext2D.prototype.fillText = function (text, x, y, width) {
      capture.texts.push(text);
      if (width === undefined) fill.call(this, text, x, y);
      else fill.call(this, text, x, y, width);
    };
    const blob = HTMLCanvasElement.prototype.toBlob;
    HTMLCanvasElement.prototype.toBlob = function (callback, type, quality) {
      capture.calls++;
      capture.release = (success) =>
        success ? blob.call(this, callback, type, quality) : callback(null);
    };
  });
  await page.goto("/apurar/#governadores-df");
  await expect(page.locator(".gov-stage canvas.map").first()).toBeVisible();
  const explore = page
    .getByRole("navigation", { name: "Seções", exact: true })
    .getByRole("button", { name: "Explorar", exact: true });
  if (await explore.isVisible()) await explore.click();
}

async function capture(page: Page) {
  return page.evaluate(
    () =>
      (window as unknown as { pngCapture: { texts: string[]; calls: number } })
        .pngCapture,
  );
}
async function release(page: Page, success: boolean) {
  await page.evaluate(
    (ok) =>
      (
        window as unknown as {
          pngCapture: { release: (success: boolean) => void };
        }
      ).pngCapture.release(ok),
    success,
  );
}

for (const status of ["stale", "withheld"] as const) {
  test(`PNG de governadores segue observações e restrições da tela: ${status}`, async ({
    page,
  }) => {
    await preparar(page, status);
    await openImageShareMenu(page);
    await page
      .getByRole("button", { name: "Compartilhar imagem", exact: true })
      .click();
    await expect.poll(async () => (await capture(page)).calls).toBe(1);
    const text = (await capture(page)).texts.join(" ");
    expect(text).toContain("Distrito Federal · DF");
    expect(text).toContain("Fonte: 25/10/2026, 17:20:00 · Brasília");
    if (status === "stale") {
      expect(text).toContain("650 votos");
      expect(text).toContain("350 votos");
      expect(text).toContain("Seções totalizadas: 7 de 10");
    } else {
      expect(text).toContain("Votos indisponíveis");
      expect(text).toContain("Seções indisponíveis");
      expect(text).not.toContain("650 votos");
      expect(text).not.toContain("Seções totalizadas: 7 de 10");
    }
    const downloaded = page.waitForEvent("download");
    await release(page, true);
    await downloaded;
  });
}

test("PNG oficial agrupa cliques simultâneos e permite nova tentativa após falha", async ({
  page,
}) => {
  await preparar(page, "available");
  const button = page.getByRole("button", {
    name: "Compartilhar imagem",
    exact: true,
  });
  await openImageShareMenu(page);
  await button.click();
  await expect.poll(async () => (await capture(page)).calls).toBe(1);
  await openImageShareMenu(page);
  await button.click();
  await expect.poll(async () => (await capture(page)).calls).toBe(1);
  await release(page, false);
  await expect(
    page.getByRole("status").filter({
      hasText: "Não foi possível exportar a imagem. Tente novamente.",
    }),
  ).toBeVisible();
  await openImageShareMenu(page);
  await button.click();
  await expect.poll(async () => (await capture(page)).calls).toBe(2);
  const downloaded = page.waitForEvent("download");
  await release(page, true);
  expect((await downloaded).suggestedFilename()).toBe(
    "apurar-governadores-df.png",
  );
  await expect(
    page
      .getByRole("status")
      .filter({ hasText: "Download da imagem iniciado." }),
  ).toBeVisible();
});

test("PNG congela mapa e metadados antes de esperar a fonte, sem bloquear navegação", async ({
  page,
}) => {
  await preparar(page, "available");
  await openImageShareMenu(page);
  await page
    .getByRole("button", { name: "Compartilhar imagem", exact: true })
    .evaluate((element) => {
      let resolveFonts: () => void;
      const ready = new Promise<void>((resolve) => {
        resolveFonts = resolve;
      });
      const race = {
        releaseFonts: () => resolveFonts(),
        pixel: [] as number[],
      };
      Object.assign(window, { pngRace: race });
      Object.defineProperty(document.fonts, "ready", {
        configurable: true,
        get: () => ready,
      });
      const toBlob = HTMLCanvasElement.prototype.toBlob;
      HTMLCanvasElement.prototype.toBlob = function (callback, type, quality) {
        race.pixel = Array.from(
          this.getContext("2d")!.getImageData(5, 5, 1, 1).data,
        );
        toBlob.call(this, callback, type, quality);
      };
      for (const canvas of document.querySelectorAll<HTMLCanvasElement>(
        ".gov-stage canvas.map:not(.prev)",
      )) {
        const context = canvas.getContext("2d")!;
        context.fillStyle = "#00ff00";
        context.fillRect(0, 0, canvas.width, canvas.height);
      }
      (element as HTMLButtonElement).click();
    });
  expect((await capture(page)).calls).toBe(0);
  await openMapFilters(page);
  await page
    .getByRole("combobox", { name: "Estado no mapa de governadores" })
    .selectOption("AC");
  await expect(page).toHaveURL(/#governadores-ac$/);
  await page.evaluate(() => {
    for (const canvas of document.querySelectorAll<HTMLCanvasElement>(
      ".gov-stage canvas.map:not(.prev)",
    )) {
      const context = canvas.getContext("2d")!;
      context.fillStyle = "#ff0000";
      context.fillRect(0, 0, canvas.width, canvas.height);
    }
    (
      window as unknown as { pngRace: { releaseFonts: () => void } }
    ).pngRace.releaseFonts();
  });
  await expect.poll(async () => (await capture(page)).calls).toBe(1);
  expect(
    await page.evaluate(
      () =>
        (window as unknown as { pngRace: { pixel: number[] } }).pngRace.pixel,
    ),
  ).toEqual([0, 255, 0, 255]);
  const text = (await capture(page)).texts.join(" ");
  expect(text).toContain("Distrito Federal · DF");
  expect(text).toContain("Fonte: 25/10/2026, 17:20:00 · Brasília");
  const downloaded = page.waitForEvent("download");
  await release(page, true);
  expect((await downloaded).suggestedFilename()).toBe(
    "apurar-governadores-df.png",
  );
});
