import { test, expect } from "@playwright/test";

for (const rota of ["/apurar/", "/1turno/"]) {
  test(`busca modal conserva foco e isola atalhos em ${rota}`, async ({
    page,
  }) => {
    await page.route("**/api/**", (route) =>
      route.fulfill({ status: 503, body: "Indisponível" }),
    );
    await page.goto(rota);
    const acionador = page.getByRole("button", {
      name: "Buscar município, estado ou candidato",
      exact: true,
    });
    await acionador.click();
    const dialogo = page.getByRole("dialog", { name: "Buscar", exact: true });
    await expect(dialogo).toHaveAttribute("aria-modal", "true");
    const input = page.getByRole("combobox");
    await expect(input).toBeFocused();
    for (const seletor of [".hud .switch button"]) {
      const atalho = page.locator(seletor).first();
      if (!(await atalho.count())) continue;
      expect(
        await atalho.evaluate((node) => {
          return Boolean(node.closest("[inert]"));
        }),
      ).toBe(true);
    }
    await input.press("Tab");
    const cancelar = page.getByRole("button", {
      name: "Cancelar",
      exact: true,
    });
    await expect(cancelar).toBeFocused();
    await cancelar.press("Escape");
    await expect(dialogo).toHaveCount(0);
    await expect(acionador).toBeFocused();
  });
}

test("busca acionada sem foco prévio retorna ao botão Buscar", async ({
  page,
}) => {
  await page.route("**/api/**", (route) =>
    route.fulfill({ status: 503, body: "Indisponível" }),
  );
  await page.goto("/apurar/");
  const acionador = page.getByRole("button", {
    name: "Buscar município, estado ou candidato",
    exact: true,
  });
  await acionador.evaluate((node: HTMLButtonElement) => {
    (document.activeElement as HTMLElement)?.blur();
    node.click();
  });
  const input = page.getByRole("combobox");
  await expect(input).toBeFocused();
  await input.press("Escape");
  await expect(acionador).toBeFocused();
});
