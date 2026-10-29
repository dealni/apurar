import { test, expect } from "@playwright/test";
import {
  mockManifest,
  mockEmptyDetails,
  mockLivePanel,
} from "./bundle-fixture";
import { demo } from "../apps/web/src/demo";

test("painel sem fonte mantém ausência explícita e não oferece demonstração", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.route("**/api/**", (route) =>
    route.fulfill({ status: 503, json: { error: "feed_unavailable" } }),
  );
  await page.goto("/apurar/");
  await expect(page.locator("body")).toContainText("Aguardando dados oficiais");
  await expect(page.getByRole("button", { name: /demonstração/i })).toHaveCount(
    0,
  );
  await expect(page.getByText("Candidatura A", { exact: true })).toHaveCount(0);
  expect(errors).toEqual([]);
});

test("feed oficial recusa snapshot sintético sem substituir ausência por votos", async ({
  page,
}) => {
  await mockManifest(page, () => demo.snapshot_id);
  await mockEmptyDetails(page, () => demo.snapshot_id);
  await page.route("**/api/snapshots/*", (route) =>
    route.fulfill({ json: demo }),
  );
  await page.goto("/apurar/");
  await expect(page.locator("body")).toContainText("Aguardando dados oficiais");
  await expect(page.getByText("Candidatura A", { exact: true })).toHaveCount(0);
});

test("painel ao vivo mantém resultados e mapa dentro da largura disponível", async ({
  page,
}) => {
  await mockLivePanel(page);
  await page.goto("/apurar/");
  await expect(
    page.getByRole("heading", { level: 2, name: /Candidatura A lidera/ }),
  ).toBeVisible();
  await expect(
    page.getByRole("progressbar", { name: "Seções totalizadas" }),
  ).toBeVisible();
  await expect(
    page.getByRole("img", { name: "Mapa eleitoral do Brasil", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("slider", { name: "Hora da apuração" }),
  ).toHaveCount(0);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
