import { expect, test, type Page } from "@playwright/test";
import { demo } from "../apps/web/src/demo";
import { mockEmptyDetails, mockManifest } from "./bundle-fixture";

async function feedTardio(
  page: Page,
  specialDestinations = true,
  path = "/apurar/",
) {
  await page.clock.setFixedTime(new Date("2026-10-25T18:00:15-03:00"));
  const snapshot = {
    ...demo,
    mode: "live",
    snapshot_id: "perfis-identidade-tardia",
    candidates: [
      { id: "13", name: "Ana da Silva", party: "PT", votes: 2400000 },
      { id: "22", name: "Bruno Ferreira", party: "PL", votes: 2100000 },
    ],
    totals: {
      valid: specialDestinations ? 2400000 : 4500000,
      annulled: specialDestinations ? 2100000 : 0,
      sub_judice: 0,
      blank: 0,
      null: 0,
      turnout: 4500000,
      electorate: 4500000,
    },
    projection: {
      available: false,
      model: "none",
      reason: "Sem projeção de teste.",
      shares: null,
    },
  };
  let release!: () => void;
  const pending = new Promise<void>((resolve) => (release = resolve));
  await mockManifest(page, () => snapshot.snapshot_id);
  await mockEmptyDetails(page, () => snapshot.snapshot_id);
  await page.route("**/api/municipalities/*", (route) =>
    route.fulfill({
      json: {
        schema_version: 1,
        election: "6258",
        snapshot_id: snapshot.snapshot_id,
        items: [
          {
            available: true,
            scope: "municipality",
            unit_id: "AC:01120",
            uf: "AC",
            name: "Acrelândia",
            as_of: snapshot.source.as_of,
            sections: { counted: 10, total: 20 },
            candidates: [
              { id: "13", votes: 2000 },
              { id: "22", votes: 1600 },
            ],
          },
        ],
      },
    }),
  );
  await page.route("**/api/supplemental", (route) =>
    route.fulfill({ status: 503, json: {} }),
  );
  await page.route("**/api/snapshots/*", async (route) => {
    await pending;
    await route.fulfill({ json: snapshot });
  });
  await page.goto(path);
  await expect(page.locator("canvas.map").first()).toBeVisible();
  return release;
}

test("busca aberta antes do feed troca identidades provisórias pelos candidatos oficiais", async ({
  page,
}) => {
  const release = await feedTardio(page);
  await page.keyboard.press("Control+k");
  const search = page.getByRole("dialog", { name: "Buscar", exact: true });
  await expect(search).toBeVisible();
  await search.getByRole("combobox").fill("Ana da Silva");
  await expect(search.getByRole("option")).toHaveCount(0);
  release();
  const candidate = search
    .getByRole("option")
    .filter({ hasText: "Ana da Silva" });
  await expect(candidate).toBeVisible();
  await candidate.click();
  await expect(page.locator(".candc h2")).toHaveText("Ana da Silva");
});

for (const specialDestinations of [true, false]) {
  test(`cartão abre perfil com identidade oficial e base ${specialDestinations ? "computada" : "válida"}`, async ({
    page,
  }) => {
    const release = await feedTardio(page, specialDestinations);
    release();
    const candidate = page.getByRole("button", {
      name: /^Ver detalhes de Ana da Silva/,
    });
    await expect(candidate.first()).toBeVisible();
    await candidate.first().click();
    await expect(page.locator(".candc h2")).toHaveText("Ana da Silva");
    await expect(page.locator(".candc .cfig")).toContainText(
      specialDestinations
        ? "dos votos computados das candidaturas no Brasil"
        : "dos votos válidos no Brasil",
    );
    await expect(page.locator(".candc .cfig b")).toContainText("53,3%");
  });
}

test("perfil estadual usa a base do estado mesmo quando a nacional tem apenas votos válidos", async ({
  page,
}) => {
  const release = await feedTardio(page, false, "/apurar/#presidente-ac");
  release();
  const candidate = page
    .getByRole("button", { name: /^Ver detalhes de Ana da Silva/ })
    .first();
  await expect(candidate).toBeVisible();
  await candidate.click();
  await expect(page.locator(".candc h2")).toHaveText("Ana da Silva");
  await expect(page.locator(".candc .who")).toContainText("Acre");
  await expect(page.locator(".candc .cfig")).toContainText(
    "dos votos computados das candidaturas no estado",
  );
  await expect(page.locator(".candc .cfig b")).toContainText("55,6%");
});
