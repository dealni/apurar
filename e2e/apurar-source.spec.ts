import { waitForOfficialSource } from "./official-source";
import { test, expect } from "@playwright/test";
import { mockManifest, mockEmptyDetails } from "./bundle-fixture";
import { demo } from "../apps/web/src/demo";

test("falha antes do primeiro resultado fica explícita", async ({ page }) => {
  await page.route("**/api/**", (route) =>
    route.fulfill({ status: 503, body: "indisponível" }),
  );
  await page.goto("/apurar/");
  await expect(page.locator("body")).toContainText("Aguardando dados oficiais");
});

test("resultado final tem identificação acessível e não aguarda projeção", async ({
  page,
}) => {
  const now = new Date().toISOString();
  const snapshot = {
    ...demo,
    mode: "live",
    snapshot_id: "source-final",
    source: { ...demo.source, as_of: now, collected_at: now },
    published_at: now,
    sections: { counted: 100, total: 100 },
    projection: { ...demo.projection, model: "official_final", reason: "" },
  };
  await mockManifest(page, () => snapshot.snapshot_id);
  await mockEmptyDetails(page, () => snapshot.snapshot_id);
  await page.route("**/api/snapshots/*", (route) =>
    route.fulfill({
      contentType: "application/json",
      body: JSON.stringify(snapshot),
    }),
  );
  await page.goto("/apurar/");
  await expect(
    page.getByRole("progressbar", { name: "Seções totalizadas" }).first(),
  ).toHaveAttribute("aria-valuenow", "100");
  await expect(page.locator(".apurar-projection")).toContainText(
    "Resultado final oficial",
  );
  await waitForOfficialSource(page);
});

test("indisponibilidade do modelo não esconde os resultados oficiais", async ({
  page,
}) => {
  const now = new Date().toISOString();
  const reason = "Projeção suspensa: conciliação municipal divergente.";
  const snapshot = {
    ...demo,
    mode: "live",
    snapshot_id: "source-suspended",
    source: { ...demo.source, as_of: now, collected_at: now },
    published_at: now,
    projection: { available: false, model: "none", reason, shares: null },
  };
  await mockManifest(page, () => snapshot.snapshot_id);
  await mockEmptyDetails(page, () => snapshot.snapshot_id);
  await page.route("**/api/snapshots/*", (route) =>
    route.fulfill({
      contentType: "application/json",
      body: JSON.stringify(snapshot),
    }),
  );
  await page.goto("/apurar/");
  await waitForOfficialSource(page);
  await expect(page.locator(".rbwrap > section, .hero").first()).toContainText(
    "2.400.000",
  );
  await expect(page.locator(".apurar-projection")).toContainText(reason);
  await expect(page.locator(".apurar-projection .pj-row")).toHaveCount(0);
});
