import { expect, type Page } from "@playwright/test";

// O chat está retirado das entradas públicas. O build de navegador inclui
// uma entrada exclusiva de ensaio para conservar a cobertura do módulo arquivado.
export async function mountArchivedChat(page: Page) {
  await expect(
    page.getByRole("button", { name: "Chat ao vivo", exact: true }),
  ).toHaveCount(0);
  const response = await page.request.get("/__test__/chat.html");
  expect(response.ok()).toBe(true);
  const html = await response.text();
  for (const [, url] of html.matchAll(/<link[^>]+href="([^"]+)"[^>]*>/gu)) {
    if (url?.endsWith(".css")) await page.addStyleTag({ url });
  }
  const scripts = [...html.matchAll(/<script[^>]+src="([^"]+)"/gu)];
  expect(scripts).toHaveLength(1);
  const url = scripts[0]?.[1];
  if (!url) throw new Error("Entrada de ensaio do chat sem script compilado.");
  await page.addScriptTag({ url, type: "module" });
}
