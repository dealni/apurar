import { showMapResults } from "./map-actions";
import { test, expect, type Page } from "@playwright/test";
import { demo } from "../apps/web/src/demo";
import { mockManifest } from "./bundle-fixture";
import type { MunicipalTotals } from "../packages/contracts/municipality";

const official: MunicipalTotals = {
  electorate: 10208,
  electorate_totalized: 6000,
  electorate_installed: 5000,
  turnout: 4000,
  abstention: 1000,
  valid: 3600,
  computed: 3600,
  blank: 200,
  null: 200,
  annulled: 0,
  sub_judice: 0,
  total: 4000,
};
async function setup(page: Page, totals?: MunicipalTotals, counted = 10) {
  const now = new Date().toISOString();
  const snapshot = {
    ...demo,
    snapshot_id: "municipal-official",
    mode: "live",
    source: { ...demo.source, as_of: now, collected_at: now },
    published_at: now,
  };
  // Uma mudança material publica outra geração; objetos de uma geração são imutáveis.
  const version = () =>
    `${snapshot.snapshot_id}-${totals?.electorate ?? "unknown"}`;
  await mockManifest(page, version);
  await page.route("**/api/snapshots/*", (route) =>
    route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({ ...snapshot, snapshot_id: version() }),
    }),
  );
  await page.route("**/api/history/*", (route) =>
    route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        schema_version: 1,
        election: "6258",
        snapshot_id: version(),
        points: [],
      }),
    }),
  );
  await page.route("**/api/municipalities/*", (route) =>
    route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        schema_version: 1,
        election: "6258",
        snapshot_id: version(),
        items: [
          {
            available: true,
            scope: "municipality",
            unit_id: "AC:01120",
            uf: "AC",
            name: "Acrelândia",
            sections: { counted, total: 20 },
            as_of: new Date(Date.parse(now) - 90000).toISOString(),
            candidates: [
              { id: "01", votes: counted ? 2000 : 0, validity: "Válido" },
              {
                id: "02",
                votes: counted ? 1600 : 0,
                validity:
                  totals?.valid === 0 && counted
                    ? "Anulado sub judice"
                    : "Válido",
              },
            ],
            ...(totals ? { totals } : {}),
          },
        ],
      }),
    }),
  );
  await page.goto("/apurar/");
  await page
    .getByRole("button", {
      name: "Buscar município, estado ou candidato",
      exact: true,
    })
    .click();
  await page.getByRole("combobox").fill("Acrelândia");
  const result = page
    .getByRole("option")
    .filter({ hasText: "Acrelândia" })
    .first();
  await expect(result).toBeVisible();
  return result;
}
function municipalCard(page: Page) {
  return page
    .locator("section.card")
    .filter({
      has: page.getByRole("heading", { name: "Acrelândia", exact: true }),
    })
    .first();
}
function count(card: ReturnType<typeof municipalCard>, label: string) {
  return card
    .locator(".kpi")
    .filter({
      has: card.page().locator(".k", { hasText: new RegExp(`^${label}$`) }),
    })
    .first()
    .locator(".v .sr");
}
test("Acrelândia exibe totais oficiais e taxas do eleitorado instalado na parcial", async ({
  page,
}) => {
  const result = await setup(page, official);
  await expect(result).toContainText("10 mil eleitores");
  await result.click();
  const card = municipalCard(page);
  await expect(card).toContainText("10 mil eleitores");
  await expect(card).toContainText("Fonte municipal:");
  await expect(card).toContainText("(Brasília)");
  await expect(count(card, "Votos computados")).toHaveText("3.600");
  await expect(count(card, "Votos válidos")).toHaveText("3.600");
  await expect(
    card.locator(".kpi").filter({ hasText: "Comparecimento" }).last(),
  ).toContainText("80,0%");
  await expect(
    card.locator(".kpi").filter({ hasText: "Abstenção" }).last(),
  ).toContainText("20,0%");
  await expect(
    card.locator(".kpi").filter({ hasText: "Brancos e nulos" }),
  ).toContainText("10,0%");
  await expect(card).not.toContainText("NaN");
  await expect(card).toHaveCSS("opacity", "1");
  await showMapResults(page);
  await expect(card).toBeInViewport();
  await page.screenshot({
    path: test.info().outputPath("totais-municipais-legiveis.png"),
    fullPage: true,
  });
});
test("votos válidos zero não apagam computados nem usam vv como denominador", async ({
  page,
}) => {
  const result = await setup(page, {
    ...official,
    valid: 0,
    annulled: 2000,
    sub_judice: 1600,
  });
  await result.click();
  const card = municipalCard(page);
  await expect(count(card, "Votos válidos")).toHaveText("0");
  await expect(count(card, "Votos computados")).toHaveText("3.600");
  await expect(card).toContainText(
    "Percentuais calculados sobre votos computados das candidaturas",
  );
  await expect(card).toContainText("55,6");
  await expect(card).toContainText("44,4");
  await expect(card).not.toContainText("NaN");
});
test("feed legado conserva ausência dos totais e não inventa eleitorado ou válidos", async ({
  page,
}) => {
  const result = await setup(page);
  await expect(result).toContainText("Município · Indisponível");
  await result.click();
  const card = municipalCard(page);
  await expect(count(card, "Votos válidos")).toHaveText("Indisponível");
  await expect(count(card, "Votos computados")).toHaveText("Indisponível");
  await expect(
    card.locator(".kpi").filter({ hasText: "Comparecimento" }),
  ).toHaveCount(1);
});
test("antes da contagem preserva eleitorado oficial sem fabricar percentuais", async ({
  page,
}) => {
  const zero = Object.fromEntries(
    Object.keys(official).map((key) => [key, 0]),
  ) as unknown as MunicipalTotals;
  const result = await setup(page, { ...zero, electorate: 10208 }, 0);
  await result.click();
  const card = municipalCard(page);
  await expect(card).toContainText("10 mil eleitores");
  await expect(
    card.locator(".kpi").filter({ hasText: "Comparecimento" }),
  ).toHaveCount(1);
  await expect(
    card.locator(".kpi").filter({ hasText: "Brancos e nulos" }),
  ).toHaveCount(0);
  await expect(card).not.toContainText("NaN");
});
test("busca aberta e detalhe recebem o eleitorado atualizado no próximo lote", async ({
  page,
}) => {
  await page.clock.install();
  const totals = { ...official };
  const result = await setup(page, totals);
  await expect(result).toContainText("10 mil eleitores");
  totals.electorate = 20416;
  await page.clock.fastForward(15001);
  await expect(result).toContainText("20 mil eleitores");
  await result.click();
  const card = municipalCard(page);
  await expect(card.locator('[title="20.416 eleitores"]')).toBeVisible();
});
test.afterEach(async ({ page }) => {
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth + 1,
    ),
  ).toBe(true);
  const card = municipalCard(page);
  if (await card.count()) {
    expect(
      await card.evaluate(
        (element) => element.scrollWidth <= element.clientWidth + 1,
      ),
    ).toBe(true);
    const readable = await card
      .locator(".kpis")
      .first()
      .evaluate((grid) => {
        const rects = [...grid.querySelectorAll(".k")].map((label) => {
          const range = document.createRange();
          range.selectNodeContents(label);
          return range.getBoundingClientRect();
        });
        return rects.every((rect, index) =>
          rects.every(
            (other, otherIndex) =>
              index === otherIndex ||
              rect.right <= other.left + 1 ||
              other.right <= rect.left + 1 ||
              rect.bottom <= other.top + 1 ||
              other.bottom <= rect.top + 1,
          ),
        );
      });
    expect(readable, "rótulos dos totais municipais não se sobrepõem").toBe(
      true,
    );
  }
});
