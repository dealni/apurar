import { test, expect } from "@playwright/test";
import { demo } from "../apps/web/src/demo";
import { mockEmptyDetails, mockLivePanel } from "./bundle-fixture";

test("painel ocupa o topo sem faixa de status em telas estreitas", async ({
  page,
}) => {
  const stamp = new Date().toISOString();
  const snapshot = {
    ...demo,
    mode: "live",
    snapshot_id: "resultados-fonte",
    source: { ...demo.source, as_of: stamp, collected_at: stamp },
    published_at: stamp,
  };
  await mockEmptyDetails(page, () => snapshot.snapshot_id);
  await page.route("**/api/manifest", (route) =>
    route.fulfill({
      json: {
        schema_version: 1,
        snapshot_id: snapshot.snapshot_id,
        snapshots: `/api/snapshots/${"1".repeat(64)}`,
        municipalities: `/api/municipalities/${"2".repeat(64)}`,
        history: `/api/history/${"3".repeat(64)}`,
        health: {
          schema_version: 1,
          election: "6258",
          status: "live",
          checked_at: stamp,
          last_success_at: stamp,
          cycle_seconds: 1,
          pending_units: 0,
        },
      },
    }),
  );
  await page.route("**/api/snapshots/*", (route) =>
    route.fulfill({ json: snapshot }),
  );
  await page.goto("/apurar/");
  await expect(page.locator(".apurar-source")).toHaveCount(0);
  for (const width of [390, 320, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await expect
      .poll(() =>
        page.locator(".frame").evaluate((frame) => ({
          top: frame.getBoundingClientRect().top,
          padding: parseFloat(getComputedStyle(frame).paddingTop),
        })),
      )
      .toEqual({ top: 0, padding: 0 });
    await expect(page.locator("canvas.map").first()).toBeVisible();
  }
});

test("candidatura anuncia partido, percentual e votos antes de abrir detalhes", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 900 });
  await mockLivePanel(page);
  await page.goto("/apurar/");
  const candidate = page.locator(".hero .leader[role=button]").first();
  await expect(candidate).toHaveAccessibleName(
    /Ver detalhes de .+ · .+ · [\d,.]+% · [\d.]+ votos/,
  );
  await candidate.focus();
  await page.keyboard.press("Enter");
  await expect(
    page.getByRole("heading", { name: "Candidatura A", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Voltar", exact: true }),
  ).toBeVisible();
});
