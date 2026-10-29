import { expectOfficialTime } from "./official-source";
import { test, expect } from "@playwright/test";
import { demo } from "../apps/web/src/demo";
import { mockEmptyDetails } from "./bundle-fixture";

test("lote inalterado só consulta manifesto e preserva dados quando a saúde falha", async ({
  page,
}) => {
  await page.clock.install();
  const stamp = new Date().toISOString();
  const snapshot = {
    ...demo,
    mode: "live",
    snapshot_id: "unchanged",
    source: {
      ...demo.source,
      as_of: new Date(Date.now() - 600000).toISOString(),
      collected_at: stamp,
    },
    published_at: stamp,
  };
  let status = "live",
    manifests = 0,
    snapshots = 0;
  await page.route("**/api/manifest", (route) => {
    manifests++;
    return route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        schema_version: 1,
        snapshot_id: snapshot.snapshot_id,
        snapshots: `/api/snapshots/${"1".repeat(64)}`,
        municipalities: `/api/municipalities/${"2".repeat(64)}`,
        history: `/api/history/${"3".repeat(64)}`,
        health: {
          schema_version: 1,
          election: "6258",
          status,
          checked_at: stamp,
          last_success_at: stamp,
          cycle_seconds: 1.2,
          pending_units: 0,
        },
      }),
    });
  });
  await mockEmptyDetails(page, () => snapshot.snapshot_id);
  await page.route("**/api/snapshots/*", (route) => {
    snapshots++;
    return route.fulfill({
      contentType: "application/json",
      body: JSON.stringify(snapshot),
    });
  });
  await page.goto("/apurar/");
  await expectOfficialTime(
    page,
    new Date(snapshot.source.as_of).toLocaleString("pt-BR", {
      timeZone: "America/Sao_Paulo",
    }),
  );
  await expect(page.locator(".apurar-source")).toHaveCount(0);
  const initial = manifests;
  await page.clock.runFor(16000);
  await expect.poll(() => manifests).toBeGreaterThan(initial);
  expect(snapshots).toBe(1);
  status = "error";
  await page.clock.runFor(16000);
  await expectOfficialTime(
    page,
    new Date(snapshot.source.as_of).toLocaleString("pt-BR", {
      timeZone: "America/Sao_Paulo",
    }),
  );
  expect(snapshots).toBe(1);
});
