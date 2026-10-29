import { openImageShareMenu } from "./map-actions";
import { expect, test } from "@playwright/test";

for (const recorte of [
  {
    hash: "#governadores",
    nomes: [
      "Acre · AC",
      "Amazonas · AM",
      "Distrito Federal · DF",
      "Espírito Santo · ES",
      "Rio Grande do Norte · RN",
      "Tocantins · TO",
    ],
  },
  {
    hash: "#governadores-ac-1200401",
    nomes: ["Rio Branco · AC · código IBGE 1200401"],
  },
]) {
  test(`PNG identifica o recorte sem publicação oficial: ${recorte.hash}`, async ({
    page,
    isMobile,
  }) => {
    await page.addInitScript(() => {
      const fillText = CanvasRenderingContext2D.prototype.fillText;
      const texts: string[] = [];
      (window as unknown as { pngTexts: string[] }).pngTexts = texts;
      CanvasRenderingContext2D.prototype.fillText = function (
        text,
        x,
        y,
        maxWidth,
      ) {
        texts.push(String(text));
        if (maxWidth === undefined) fillText.call(this, text, x, y);
        else fillText.call(this, text, x, y, maxWidth);
      };
    });
    await page.route("**/api/**", (route) =>
      route.fulfill({ status: 503, json: {} }),
    );
    await page.goto("/apurar/" + recorte.hash);
    await expect(page.locator(".gov-stage canvas.map").first()).toBeVisible();
    const explorar = page
      .getByRole("navigation", { name: "Seções", exact: true })
      .getByRole("button", { name: "Explorar", exact: true });
    if (isMobile && (await explorar.isVisible())) await explorar.click();
    const downloaded = page.waitForEvent("download");
    await openImageShareMenu(page);
    await page
      .getByRole("button", { name: "Compartilhar imagem", exact: true })
      .click();
    await downloaded;
    const text = await page.evaluate(() =>
      (window as unknown as { pngTexts: string[] }).pngTexts.join(" "),
    );
    for (const nome of recorte.nomes) expect(text).toContain(nome);
    expect(text).toContain("Aguardando publicação oficial de governador");
    expect(text).toContain("Horário da fonte indisponível");
    expect(text).toContain("Seções indisponíveis");
    expect(text).not.toContain("0 votos");
  });
}
