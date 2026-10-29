import { expect, test } from "@playwright/test";

for (const failure of ["404", "503", "rede"] as const) {
  test(`país histórico informa indisponibilidade após falha de ${failure}`, async ({
    page,
  }) => {
    await page.route("**/1turno/feed/uf/zz.json", (route) =>
      failure === "rede"
        ? route.abort("failed")
        : route.fulfill({ status: Number(failure), body: "Indisponível" }),
    );
    await page.goto("/1turno/#presidente-zz-pt");
    const country = page.locator(".stc.ext").filter({
      has: page.getByRole("heading", { name: "Portugal", exact: true }),
    });
    await expect(country).toBeVisible();
    await expect(country.getByRole("status")).toContainText(
      failure === "404"
        ? "Votos por país indisponíveis"
        : "Não foi possível carregar os votos por país desta captura.",
    );
    await expect(country).not.toContainText("Carregando…");
  });
}
