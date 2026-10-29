import { openImageShareMenu } from "./map-actions";
import { mockLivePanel } from "./bundle-fixture";
import { expect, test, type Page } from "@playwright/test";

async function instrumentExport(page: Page) {
  await page.addInitScript(() => {
    const state = {
      texts: [] as string[],
      overflow: [] as string[],
      shares: 0,
    };
    Object.assign(window, { exportReview: state });
    const original = CanvasRenderingContext2D.prototype.fillText;
    CanvasRenderingContext2D.prototype.fillText = function (text, x, y, max) {
      // Os canvas do mapa usam outras fontes; registra as notas do PNG.
      if (this.font.includes("Apurar Sans")) {
        state.texts.push(text);
        if (x + this.measureText(text).width > this.canvas.width + 1)
          state.overflow.push(text);
      }
      if (max === undefined) original.call(this, text, x, y);
      else original.call(this, text, x, y, max);
    };
  });
}

for (const route of ["/apurar/", "/1turno/"]) {
  test(`exportação ${route} preserva legenda e confirma download sem clipboard`, async ({
    page,
  }) => {
    await instrumentExport(page);
    await page.addInitScript(() => {
      Object.defineProperty(navigator, "share", { value: undefined });
      Object.defineProperty(navigator, "clipboard", {
        value: {
          writeText: () =>
            Promise.reject(new DOMException("Negado", "NotAllowedError")),
        },
      });
    });
    await mockLivePanel(page);
    await page.goto(route);
    await expect(page.locator(".legend")).toBeVisible();
    const longTitle = "São🧑🏽‍💻".repeat(50);
    await page.evaluate((title) => {
      const crumbs =
        document.querySelector(".crumbs") ||
        document.body.appendChild(document.createElement("div"));
      crumbs.classList.add("crumbs");
      crumbs.textContent = title;
      crumbs.setAttribute("hidden", "");
    }, longTitle);
    const downloadPromise = page.waitForEvent("download");
    await openImageShareMenu(page);
    await page
      .getByRole("button", { name: "Compartilhar imagem", exact: true })
      .click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe("apuracao-2026.png");
    await expect(
      page.getByText("Imagem salva. Não foi possível copiar o link:", {
        exact: false,
      }),
    ).toBeVisible();
    const result = await page.evaluate(
      () =>
        (
          window as unknown as {
            exportReview: { texts: string[]; overflow: string[] };
          }
        ).exportReview,
    );
    expect(result.overflow).toEqual([]);
    expect(result.texts.join("")).toContain(longTitle);
    expect(result.texts.join(" ")).toContain("Legenda do mapa");
    if (route === "/1turno/") {
      expect(result.texts.join(" ")).toContain(
        "ARQUIVO · 1º TURNO · DADOS PRESERVADOS",
      );
      expect(result.texts.join(" ")).toMatch(
        /Data e hora da fonte: \d{2}\/\d{2}\/2026/,
      );
    } else
      expect(result.texts.join(" ")).toContain("AO VIVO · DADOS OFICIAIS TSE");
  });

  test(`compartilhamento ${route} impede repetição e respeita cancelamento`, async ({
    page,
  }) => {
    await instrumentExport(page);
    await page.addInitScript(() => {
      Object.defineProperty(navigator, "canShare", { value: () => true });
      Object.defineProperty(navigator, "share", {
        value: () => {
          const state = (
            window as unknown as { exportReview: { shares: number } }
          ).exportReview;
          state.shares++;
          return new Promise((_, reject) => {
            Object.assign(window, {
              cancelExportShare: () =>
                reject(new DOMException("Cancelado", "AbortError")),
            });
          });
        },
      });
    });
    await mockLivePanel(page);
    await page.goto(route);
    const button = page.getByRole("button", {
      name: "Compartilhar imagem",
      exact: true,
    });
    await openImageShareMenu(page);
    await button.click();
    await expect
      .poll(() =>
        page.evaluate(
          () =>
            (window as unknown as { exportReview: { shares: number } })
              .exportReview.shares,
        ),
      )
      .toBe(1);
    await openImageShareMenu(page);
    await button.click();
    const downloads: string[] = [];
    page.on("download", (download) =>
      downloads.push(download.suggestedFilename()),
    );
    await page.evaluate(() =>
      (
        window as unknown as { cancelExportShare: () => void }
      ).cancelExportShare(),
    );
    await expect
      .poll(() =>
        page.evaluate(
          () =>
            (window as unknown as { exportReview: { shares: number } })
              .exportReview.shares,
        ),
      )
      .toBe(1);
    await openImageShareMenu(page);
    await button.click();
    await expect
      .poll(() =>
        page.evaluate(
          () =>
            (window as unknown as { exportReview: { shares: number } })
              .exportReview.shares,
        ),
      )
      .toBe(2);
    expect(downloads).toEqual([]);
    await page.evaluate(() =>
      (
        window as unknown as { cancelExportShare: () => void }
      ).cancelExportShare(),
    );
  });
}

test("PNG de recorte estadual mobile identifica São Paulo", async ({
  page,
  isMobile,
}) => {
  test.skip(
    !isMobile,
    "Confere o título compacto, que usa o cartão territorial.",
  );
  await instrumentExport(page);
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "share", { value: undefined });
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText: () => Promise.resolve() },
    });
  });
  await mockLivePanel(page);
  await page.goto("/1turno/#presidente-sp");
  await expect(page.locator(".stc .sh h2")).toHaveText("São Paulo");
  const download = page.waitForEvent("download");
  await openImageShareMenu(page);
  await page
    .getByRole("button", { name: "Compartilhar imagem", exact: true })
    .click();
  await download;
  const texts = await page.evaluate(
    () =>
      (window as unknown as { exportReview: { texts: string[] } }).exportReview
        .texts,
  );
  expect(texts.join(" ")).toContain("Apuração 2026 · São Paulo · SP");
  expect(texts.join(" ")).toContain("Brasil ·");
});
