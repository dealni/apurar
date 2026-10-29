import { test, expect } from "@playwright/test";
import { mockLivePanel } from "./bundle-fixture";

test("raiz abre diretamente a apuração sem página de escolha", async ({
  page,
}) => {
  await mockLivePanel(page);
  await page.goto("/");
  await expect(page).toHaveURL(/\/$/);
  await expect(page.locator("canvas.map").first()).toBeVisible();
  await expect(page.locator(".apurar-source")).toHaveCount(0);
  await expect(page.locator(".access-page,.access-card")).toHaveCount(0);
  await expect(
    page.getByRole("navigation", { name: "Opções de acesso" }),
  ).toHaveCount(0);
});

test("seleção na raiz é aplicada diretamente e remove parâmetros antigos", async ({
  page,
}) => {
  await mockLivePanel(page);
  await page.goto("/?demo=1#presidente-sp");
  await expect(page).toHaveURL(/\/#presidente-sp$/);
  await expect(page.locator(".apurar-source")).toHaveCount(0);
  await expect(
    page.getByRole("heading", { name: "São Paulo", exact: true }).first(),
  ).toBeVisible();
});

test("parâmetro de destino externo não desvia a apuração", async ({ page }) => {
  await mockLivePanel(page);
  await page.goto("/?next=https://example.com#presidente-sp");
  await expect(page.locator("canvas.map").first()).toBeVisible();
  expect(new URL(page.url()).pathname).toBe("/");
  expect(new URL(page.url()).hostname).toBe("127.0.0.1");
});

test("raiz sem JavaScript explica o requisito e mantém acesso ao histórico", async ({
  browser,
  baseURL,
}) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  const response = await page.goto(`${baseURL}/`);
  expect(await response!.text()).toContain("Ative o JavaScript");
  await expect(
    page.getByRole("link", { name: "Primeiro turno", exact: true }),
  ).toHaveAttribute("href", "/1turno/");
  await expect(page.locator(".access-card")).toHaveCount(0);
  await context.close();
});

test("página comercial e inventários da captura não são publicados", async ({
  request,
}) => {
  for (const path of [
    "/anunciar/",
    "/ads.txt",
    "/captura-index.json",
    "/captura-resources.json",
    "/og-2t.jpg",
    "/1turno/assets/anuncio.0c5c22b7d8.webp",
    "/1turno/assets/og.933bb11ba1.jpg",
  ]) {
    const response = await request.get(path);
    expect(response.status(), path).toBe(404);
  }
});
