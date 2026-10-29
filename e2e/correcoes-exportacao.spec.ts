import { waitForOfficialSource } from "./official-source";
import { openImageShareMenu } from "./map-actions";
import { test, expect, type Page } from "@playwright/test";
import { demo } from "../apps/web/src/demo";
import { mockManifest, mockLivePanel } from "./bundle-fixture";

type Exported = {
  texts: string[];
  width: number;
  height: number;
  ink: number;
  type: string;
};
async function capturePng(page: Page) {
  await page.evaluate(() => {
    Object.defineProperty(navigator, "share", {
      configurable: true,
      value: undefined,
    });
    const texts = new WeakMap<HTMLCanvasElement, string[]>();
    const fillText = CanvasRenderingContext2D.prototype.fillText;
    CanvasRenderingContext2D.prototype.fillText = function (
      text,
      x,
      y,
      maxWidth,
    ) {
      const lines = texts.get(this.canvas) || [];
      lines.push(text);
      texts.set(this.canvas, lines);
      if (maxWidth === undefined) fillText.call(this, text, x, y);
      else fillText.call(this, text, x, y, maxWidth);
    };
    const toBlob = HTMLCanvasElement.prototype.toBlob;
    HTMLCanvasElement.prototype.toBlob = function (callback, type, quality) {
      const ctx = this.getContext("2d")!;
      const pixels = ctx.getImageData(
        0,
        0,
        this.width,
        Math.min(300, this.height),
      ).data;
      let ink = 0;
      for (let i = 0; i < pixels.length; i += 4) {
        if (pixels[i]! > 50 || pixels[i + 1]! > 50 || pixels[i + 2]! > 50)
          ink++;
      }
      const result = {
        texts: texts.get(this) || [],
        width: this.width,
        height: this.height,
        ink,
        type: type || "",
      };
      (window as unknown as { exported: unknown }).exported = result;
      toBlob.call(this, callback, type, quality);
    };
  });
  const downloaded = page.waitForEvent("download");
  await openImageShareMenu(page);
  await page
    .getByRole("button", { name: "Compartilhar imagem", exact: true })
    .click();
  const download = await downloaded;
  expect(download.suggestedFilename()).toBe("apuracao-2026.png");
  await download.saveAs(test.info().outputPath("compartilhamento.png"));
  return page.evaluate(
    () => (window as unknown as { exported: Exported }).exported,
  );
}

function verifyImage(image: Exported) {
  expect(image.width).toBeGreaterThanOrEqual(720);
  expect(image.height).toBeGreaterThan(300);
  expect(image.type).toBe("image/png");
  expect(image.ink).toBeGreaterThan(1000);
  expect(image.texts.join(" ")).not.toMatch(/NaN|undefined|null/);
}

test("PNG ao vivo inclui cartão, modo, fonte e avisos na imagem real", async ({
  page,
}) => {
  await mockLivePanel(page);
  await page.goto("/apurar/");
  await expect(page.locator(".rbwrap > section, .hero").first()).toContainText(
    "2.400.000",
  );
  const image = await capturePng(page);
  verifyImage(image);
  const text = image.texts.join(" ");
  expect(text).toContain("AO VIVO · DADOS OFICIAIS TSE");
  expect(text).not.toContain("Projeção");
  expect(text).toContain("53,3%");
  expect(text).toContain("25/10/2026, 18:00:00 (Brasília)");
  expect(text).not.toContain("Estimativa experimental");
  expect(text).not.toContain("Estimativa experimental");
});

for (const state of ["final", "indisponivel", "precontagem", "destinacao"]) {
  test(`PNG ${state} preserva semântica e horário da fonte`, async ({
    page,
  }) => {
    const asOf = new Date().toISOString();
    await mockManifest(page, () => "export-test");
    const live = liveFixture(state, asOf);
    await page.route("**/api/snapshots/*", (route) =>
      route.fulfill({ json: live }),
    );
    await page.route("**/api/municipalities/*", (route) =>
      route.fulfill({
        json: {
          schema_version: 1,
          snapshot_id: live.snapshot_id,
          election: "6258",
          items: [],
        },
      }),
    );
    await page.route("**/api/history/*", (route) =>
      route.fulfill({
        json: {
          schema_version: 1,
          snapshot_id: live.snapshot_id,
          election: "6258",
          points: [],
        },
      }),
    );
    await page.goto("/apurar/");
    await waitForOfficialSource(page);
    const image = await capturePng(page);
    verifyImage(image);
    const text = image.texts.join(" ");
    expect(text).not.toContain("Projeção");
    expect(text).not.toContain("Estimativa experimental");
    if (state === "precontagem") {
      expect(text).not.toContain("51,2%");
      expect(text).not.toContain("48,8%");
    } else if (state === "destinacao") {
      expect(text).toContain(
        "destinações distintas dos votos válidos oficiais",
      );
      expect(text).toContain("53,3%");
    }
  });
}

test("PNG sem feed informa ausência em vez de resultados zero", async ({
  page,
}) => {
  await page.route("**/api/**", (route) =>
    route.fulfill({ status: 503, json: {} }),
  );
  await page.goto("/apurar/");
  await expect(page.locator("body")).toContainText("Aguardando dados oficiais");
  const image = await capturePng(page);
  verifyImage(image);
  const text = image.texts.join(" ");
  expect(text).toContain("DADOS OFICIAIS INDISPONÍVEIS");
  expect(text).toContain("Data e hora da fonte: indisponível");
  expect(text).toContain("Apuração oficial indisponível neste recorte");
  expect(text).not.toContain("0,00% das seções");
});

function liveFixture(state: string, asOf: string) {
  return {
    ...demo,
    mode: "live",
    snapshot_id: "export-test",
    source: { ...demo.source, as_of: asOf, collected_at: asOf },
    published_at: asOf,
    sections:
      state === "final"
        ? { counted: 50000, total: 50000 }
        : state === "precontagem"
          ? { counted: 0, total: 50000 }
          : demo.sections,
    candidates:
      state === "precontagem"
        ? demo.candidates.map((c) => ({ ...c, votes: 0 }))
        : demo.candidates,
    ...(state === "destinacao"
      ? {
          totals: {
            valid: 0,
            blank: 0,
            null: 0,
            turnout: 4500000,
            electorate: 10000000,
            computed: 4500000,
            annulled: 4500000,
          },
        }
      : {}),
    projection:
      state === "indisponivel" || state === "destinacao"
        ? {
            available: false,
            model: "none",
            shares: null,
            reason: "Conciliação pendente.",
          }
        : {
            ...demo.projection,
            model: state === "final" ? "official_final" : "runoff",
            reason: "Modelo do coletor.",
          },
  };
}
