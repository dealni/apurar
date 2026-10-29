import { expectOfficialTime } from "./official-source";
import { openMapActions } from "./map-actions";
import { test, expect, type Page } from "@playwright/test";
import { demo } from "../apps/web/src/demo";
import { mockManifest, mockEmptyDetails } from "./bundle-fixture";

async function search(page: Page, term: string) {
  await page
    .getByRole("button", {
      name: "Buscar município, estado ou candidato",
      exact: true,
    })
    .click();
  await page.getByRole("combobox").fill(term);
  return page.getByRole("dialog", { name: "Buscar", exact: true });
}

test("busca preserva ausências e identifica detalhes sem fonte atual", async ({
  page,
  isMobile,
}) => {
  const presence: string[] = [];
  page.on("request", (request) => {
    if (request.url().includes("/api/vivo")) presence.push(request.method());
  });
  await page.goto("/apurar/");
  const dialog = await search(page, "São Paulo");
  await expect(dialog).toContainText("Município · Indisponível");
  await expect(dialog).not.toContainText("0 eleitores");
  await page.getByRole("combobox").fill("1 zona Recife");
  await expect(dialog.locator(".srow")).toHaveCount(0);
  await page.getByRole("combobox").fill("Recife");
  const municipality = dialog.locator('.srow[aria-disabled="false"]').first();
  await municipality.click();
  await expect(
    page.getByRole("heading", { name: "Recife", exact: true }).first(),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Ver zonas oficiais", exact: true }),
  ).toHaveCount(0);
  const reopened = await search(page, "Lisboa");
  const city = reopened.locator('.srow[aria-disabled="false"]').first();
  await expect(city).toContainText("resultado oficial por cidade");
  await city.click();
  const resultsTab = page
    .getByRole("navigation", { name: "Seções", exact: true })
    .getByRole("button", { name: "Resultados", exact: true });
  if (isMobile && (await resultsTab.isVisible())) await resultsTab.click();
  await expect(
    page.getByRole("heading", { name: "Lisboa", exact: true }).first(),
  ).toBeVisible();
  expect(presence).toEqual([]);
});

test("exterior conserva agregado e informa ausência de dados por país", async ({
  page,
}) => {
  await page.goto("/apurar/#presidente-zz-pt");
  await expect(page.locator("body")).toContainText(
    "Resultado oficial indisponível nesta atualização",
  );
  await expect(page.locator("body")).not.toContainText("urnas já fecharam");
  if (test.info().project.name === "desktop") {
    await expect(page.locator(".exterior-legend")).toContainText(
      "sem votos ou sem dados disponíveis",
    );
    await expect(page.locator(".exterior-legend")).not.toContainText(
      "urnas fechadas",
    );
  }
  await openMapActions(page);
  await page.getByRole("button", { name: "Exterior", exact: true }).click();
  await expect(page.locator("body")).toContainText(
    "Selecione um país ou uma cidade",
  );
});

test("antes do dia eleitoral contador não inventa meia-noite ou 17h congeladas", async ({
  page,
}) => {
  await page.clock.install({ time: new Date("2026-10-24T20:00:00-03:00") });
  const now = "2026-10-24T19:19:13-03:00";
  const snapshot = {
    ...demo,
    mode: "live",
    source: { ...demo.source, as_of: now, collected_at: now },
    published_at: now,
    sections: { counted: 0, total: 100 },
    candidates: demo.candidates.map((c) => ({ ...c, votes: 0 })),
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
  await expect(page.locator("body")).toContainText(
    "A apuração começa amanhã às 17:00",
  );
  await expect(page.locator("body")).not.toContainText("desde 00:00");
  await expectOfficialTime(page, "24/10");
  await expectOfficialTime(page, "19:19:13");
  await page.clock.runFor(1100);
  await expect(page.locator("body")).not.toContainText("17:00:00");
});

test("votos computados continuam visíveis quando a destinação difere dos válidos", async ({
  page,
}) => {
  const now = new Date().toISOString();
  const snapshot = {
    ...demo,
    mode: "live",
    source: { ...demo.source, as_of: now, collected_at: now },
    published_at: now,
    totals: {
      valid: 0,
      computed: 4500000,
      blank: 0,
      null: 0,
      turnout: 4500000,
      electorate: 10000000,
    },
    projection: {
      available: false,
      model: "none",
      reason: "Destinações especiais.",
      shares: null,
    },
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
  await expect(page.locator("body")).toContainText(
    "Percentuais calculados sobre votos computados das candidaturas",
  );
  if (test.info().project.name === "desktop") {
    const official = page.locator('.rb-bar[role="img"]');
    await expect(official).toHaveAttribute(
      "aria-label",
      /53,33%.*46,67% dos votos computados/,
    );
    await expect(page.locator(".rb-track")).toContainText("2.400.000");
  } else {
    await expect(page.locator(".hero .leaders")).toContainText("2.400.000");
    await expect(page.locator(".hero .leaders")).toContainText("53,33");
  }
});
