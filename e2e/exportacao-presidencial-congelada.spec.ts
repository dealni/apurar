import { expectOfficialTime } from "./official-source";
import { openImageShareMenu } from "./map-actions";
import { expect, test, type Page } from "@playwright/test";
import { demo } from "../apps/web/src/demo";
import { mockManifest, mockEmptyDetails } from "./bundle-fixture";

type Capture = {
  waiting: boolean;
  releaseFonts: () => void;
  texts: string[];
  green: number;
  red: number;
  calls: number;
};

async function iniciarExportacao(page: Page) {
  await openImageShareMenu(page);
  await page
    .getByRole("button", { name: "Compartilhar imagem", exact: true })
    .evaluate((button) => {
      Object.defineProperty(navigator, "share", {
        configurable: true,
        value: undefined,
      });
      const capture: Capture = {
        waiting: false,
        releaseFonts: () => {},
        texts: [],
        green: 0,
        red: 0,
        calls: 0,
      };
      Object.assign(window, { presidentialCapture: capture });
      const pending = new Promise<FontFace[]>((resolve) => {
        capture.releaseFonts = () => resolve([]);
      });
      document.fonts.load = () => {
        capture.waiting = true;
        return pending;
      };
      const texts = new WeakMap<HTMLCanvasElement, string[]>();
      const fill = CanvasRenderingContext2D.prototype.fillText;
      CanvasRenderingContext2D.prototype.fillText = function (
        text,
        x,
        y,
        width,
      ) {
        const lines = texts.get(this.canvas) || [];
        lines.push(text);
        texts.set(this.canvas, lines);
        if (width === undefined) fill.call(this, text, x, y);
        else fill.call(this, text, x, y, width);
      };
      const toBlob = HTMLCanvasElement.prototype.toBlob;
      HTMLCanvasElement.prototype.toBlob = function (callback, type, quality) {
        capture.calls++;
        capture.texts = texts.get(this) || [];
        const pixels = this.getContext("2d")!.getImageData(
          0,
          0,
          this.width,
          this.height,
        ).data;
        for (let i = 0; i < pixels.length; i += 4) {
          if (pixels[i] === 0 && pixels[i + 1] === 255 && pixels[i + 2] === 0)
            capture.green++;
          if (pixels[i] === 255 && pixels[i + 1] === 0 && pixels[i + 2] === 0)
            capture.red++;
        }
        toBlob.call(this, callback, type, quality);
      };
      for (const map of document.querySelectorAll<HTMLCanvasElement>(
        "canvas.map:not(.prev)",
      )) {
        const context = map.getContext("2d")!;
        context.fillStyle = "#00ff00";
        context.fillRect(0, 0, map.width, map.height);
      }
      (button as HTMLButtonElement).click();
    });
}

async function capture(page: Page) {
  return page.evaluate(
    () =>
      (window as unknown as { presidentialCapture: Capture })
        .presidentialCapture,
  );
}

test("PNG presidencial congela pixels e fonte antes da espera pelas fontes", async ({
  page,
}) => {
  await page.clock.setFixedTime(new Date("2026-10-25T18:05:15-03:00"));
  let snapshot = {
    ...demo,
    mode: "live",
    snapshot_id: "export-before-fonts",
    projection: { ...demo.projection, model: "runoff" },
  };
  await mockManifest(page, () => snapshot.snapshot_id);
  await mockEmptyDetails(page, () => snapshot.snapshot_id);
  await page.route("**/api/snapshots/*", (route) =>
    route.fulfill({ json: snapshot }),
  );
  await page.route("**/api/supplemental", (route) =>
    route.fulfill({ status: 503, json: {} }),
  );
  await page.goto("/apurar/");
  await expectOfficialTime(page, "18:00:00");
  await expect(page.locator("canvas.map:not(.prev)").first()).toBeVisible();
  await iniciarExportacao(page);
  expect((await capture(page)).waiting).toBe(true);
  expect((await capture(page)).calls).toBe(0);

  snapshot = {
    ...snapshot,
    snapshot_id: "export-after-fonts",
    source: {
      ...snapshot.source,
      as_of: "2026-10-25T18:05:00-03:00",
      collected_at: "2026-10-25T18:05:10-03:00",
    },
    published_at: "2026-10-25T18:05:12-03:00",
    projection: {
      ...snapshot.projection,
      shares: { "01": 60, "02": 40 },
    },
  };
  // A retomada da aba provoca uma atualização real do Feed enquanto load aguarda.
  await page.evaluate(() =>
    document.dispatchEvent(new Event("visibilitychange")),
  );
  await expectOfficialTime(page, "18:05:00");
  expect((await capture(page)).calls).toBe(0);
  const downloaded = page.waitForEvent("download");
  await page.evaluate(() => {
    for (const map of document.querySelectorAll<HTMLCanvasElement>(
      "canvas.map:not(.prev)",
    )) {
      const context = map.getContext("2d")!;
      context.fillStyle = "#ff0000";
      context.fillRect(0, 0, map.width, map.height);
    }
    const title = document.querySelector(".crumbs, .stc .sh h2");
    if (title) title.textContent = "Recorte depois do clique";
    const legend = document.querySelector(".legend");
    if (legend) legend.textContent = "Legenda depois do clique";
    (
      window as unknown as { presidentialCapture: Capture }
    ).presidentialCapture.releaseFonts();
  });
  const download = await downloaded;
  expect(download.suggestedFilename()).toBe("apuracao-2026.png");
  const image = await capture(page);
  expect(image.calls).toBe(1);
  expect(image.green).toBeGreaterThan(1000);
  expect(image.red).toBe(0);
  const text = image.texts.join(" ");
  expect(text).not.toContain("51,2%");
  expect(text).toContain("53,3%");
  expect(text).toContain("25/10/2026, 18:00:00 (Brasília)");
  expect(text).not.toContain("18:05:00");
  expect(text).not.toContain("60,0%");
  expect(text).not.toContain("Recorte depois do clique");
  expect(text).not.toContain("Legenda depois do clique");
});
