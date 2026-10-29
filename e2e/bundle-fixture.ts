import type { Page } from "@playwright/test";

// Hashes de transporte fictícios: integridade criptográfica é exercitada no Worker.
export async function mockManifest(page: Page, snapshotId: () => string) {
  await page.route("**/api/manifest", (route) =>
    route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        schema_version: 1,
        snapshot_id: snapshotId(),
        snapshots: `/api/snapshots/${"1".repeat(64)}`,
        municipalities: `/api/municipalities/${"2".repeat(64)}`,
        history: `/api/history/${"3".repeat(64)}`,
      }),
    }),
  );
}
export async function mockEmptyDetails(page: Page, snapshotId: () => string) {
  for (const kind of ["municipalities", "history"]) {
    await page.route(`**/api/${kind}/*`, (route) =>
      route.fulfill({
        contentType: "application/json",
        body: JSON.stringify({
          schema_version: 1,
          election: "6258",
          snapshot_id: snapshotId(),
          [kind === "municipalities" ? "items" : "points"]: [],
        }),
      }),
    );
  }
}

// Dados controlados apenas nos testes: exercitam o fluxo ao vivo sem rede externa.
export async function mockLivePanel(page: Page) {
  await page.clock.setFixedTime(new Date("2026-10-25T18:00:15-03:00"));
  const { demo, demoHistory } = await import("../apps/web/src/demo");
  const snapshot = {
    ...demo,
    mode: "live",
    snapshot_id: "browser-live-fixture",
    projection: {
      ...demo.projection,
      model: "runoff",
      reason: "Projeção experimental de teste.",
    },
  };
  await mockManifest(page, () => snapshot.snapshot_id);
  await page.route("**/api/snapshots/*", (route) =>
    route.fulfill({ json: snapshot }),
  );
  await page.route("**/api/municipalities/*", (route) =>
    route.fulfill({
      json: {
        schema_version: 1,
        election: "6258",
        snapshot_id: snapshot.snapshot_id,
        items: [],
      },
    }),
  );
  await page.route("**/api/history/*", (route) =>
    route.fulfill({
      json: {
        schema_version: 1,
        election: "6258",
        snapshot_id: snapshot.snapshot_id,
        points: demoHistory.map((point) => ({
          ...point,
          projection: snapshot.projection,
        })),
      },
    }),
  );
}
