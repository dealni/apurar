import { showMapResults } from "./map-actions";
import { test, expect, type Page } from "@playwright/test";
import { execFileSync } from "node:child_process";
import { validateCollection } from "../apps/edge/src/collections";
import { mockManifest } from "./bundle-fixture";

// Fixture oficial congelada; sem rede, publicação ou fallback na aplicação.
const bundle = JSON.parse(
  execFileSync(
    "python3",
    [
      "-B",
      "-c",
      `
import sys,json
from pathlib import Path
sys.path.insert(0,"services/collector")
from apurar_collector.core.tse import parse_result
from apurar_collector.dataset import load
from apurar_collector.snapshot import build,municipalities,history_point,now
f=json.loads(Path("services/collector/tests/fixtures/tse-6258-precount.json").read_text())
n=parse_result(f["national"]["raw"],"br","6258")
r=parse_result(f["municipality"]["raw"],"ac01120","6258")
c={"national":n,"units":[{"scope":"ac01120","uf":"AC","name":"ACRELÂNDIA","ibge_code":"1200013","sections_total":45,"result":r}]}
_,prior=load()
s=build(c,prior,mode="live",collected_at=now(),published_at=now())
m=municipalities(c);m["snapshot_id"]=s["snapshot_id"]
h={"schema_version":1,"election":"6258","snapshot_id":s["snapshot_id"],"points":[history_point(s)]}
print(json.dumps({"snapshot":s,"municipalities":m,"history":h}))
`,
    ],
    { encoding: "utf8" },
  ),
);
async function install(page: Page, data: typeof bundle) {
  validateCollection(data.municipalities, "municipalities");
  await mockManifest(page, () => data.snapshot.snapshot_id);
  for (const [kind, value] of Object.entries({
    snapshots: data.snapshot,
    municipalities: data.municipalities,
    history: data.history,
  }))
    await page.route(`**/api/${kind}/*`, (route) =>
      route.fulfill({ json: value }),
    );
}

test("EA20 congelado percorre Python, Worker e interface com 10.208 eleitores", async ({
  page,
}) => {
  await install(page, bundle);
  await page.goto("/apurar/#presidente-ac-1200013");
  const card = page
    .locator("section.card")
    .filter({
      has: page.getByRole("heading", { name: "Acrelândia", exact: true }),
    })
    .first();
  await expect(card.locator('[title="10.208 eleitores"]')).toBeVisible();
  for (const label of [
    "Votos computados",
    "Votos válidos",
    "Comparecimento",
    "Abstenção",
    "Brancos",
    "Nulos",
  ] as const) {
    const kpi = card
      .locator(".kpi")
      .filter({
        has: page.locator(".k", { hasText: new RegExp(`^${label}$`) }),
      })
      .first();
    await expect(kpi).toContainText("0");
    await expect(kpi).not.toContainText("Indisponível");
  }
  await expect(card).toContainText("45 seções totalizadas");
  await expect(card).not.toContainText("NaN");
  await expect(card).not.toContainText("100,0%");
  await expect(card).toHaveCSS("opacity", "1");
  await showMapResults(page);
  await expect(card).toBeInViewport();
  await page.screenshot({
    path: test.info().outputPath("acrelandia-oficial.png"),
    fullPage: true,
  });
});

test("painel principal separa computados e válidos em destinação especial", async ({
  page,
}) => {
  const data = structuredClone(bundle);
  const row = data.municipalities.items[0];
  row.sections.counted = 1;
  row.candidates = data.snapshot.candidates.map(
    (c: { id: string }, i: number) => ({
      id: c.id,
      votes: i ? 15 : 45,
      validity: i ? "Válido" : "Anulado sub judice",
    }),
  );
  row.totals = {
    electorate: 10208,
    electorate_totalized: 120,
    electorate_installed: 100,
    turnout: 70,
    abstention: 30,
    valid: 40,
    computed: 60,
    blank: 6,
    null: 4,
    annulled: 10,
    sub_judice: 10,
    total: 70,
  };
  await install(page, data);
  await page.goto("/apurar/#presidente-ac-1200013");
  const card = page
    .locator("section.card")
    .filter({
      has: page.getByRole("heading", { name: "Acrelândia", exact: true }),
    })
    .first();
  for (const [label, value] of [
    ["Votos válidos", "40"],
    ["Votos computados", "60"],
  ] as const) {
    const kpi = card
      .locator(".kpi")
      .filter({
        has: page.locator(".k", { hasText: new RegExp(`^${label}$`) }),
      })
      .first();
    await expect(kpi).toContainText(value);
  }
  await expect(card).toContainText(/75,0+%/);
  await expect(card).toContainText(
    "Percentuais calculados sobre votos computados das candidaturas",
  );
});
