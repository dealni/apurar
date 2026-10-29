import { test, expect } from "@playwright/test";
import {
  mockManifest,
  mockEmptyDetails,
  mockLivePanel,
} from "./bundle-fixture";
import { demo } from "../apps/web/src/demo";

for (const state of ["precontagem", "apurando", "final"]) {
  const final = state === "final";
  const preCount = state === "precontagem";
  test(`projeção respeita o estado ${state}`, async ({ page }) => {
    const now = new Date().toISOString();
    const snapshot = {
      ...demo,
      mode: "live",
      snapshot_id: final ? "official-final" : "pre-count",
      source: { ...demo.source, as_of: now, collected_at: now },
      published_at: now,
      sections: { counted: final ? 100 : preCount ? 0 : 10, total: 100 },
      candidates: demo.candidates.map((candidate) => ({
        ...candidate,
        votes: preCount ? 0 : candidate.votes,
      })),
      projection: {
        ...demo.projection,
        model: final ? "official_final" : "runoff",
        pre_count: preCount,
        reason: final
          ? "Totalização concluída."
          : "Estimativa baseada no primeiro turno.",
      },
    };
    await mockManifest(page, () => snapshot.snapshot_id);
    await mockEmptyDetails(page, () => snapshot.snapshot_id);
    await page.route("**/api/snapshots/*", (route) =>
      route.fulfill({ json: snapshot }),
    );
    await page.goto("/apurar/");
    const projection = page.getByRole("region", {
      name: final ? "Resultado final oficial" : "Projeção Apurar",
      exact: true,
    });
    await expect(projection).toBeVisible();
    if (final) {
      await expect(projection).toContainText("Totalização concluída.");
      await expect(projection).not.toContainText(
        "Estimativa anterior à apuração",
      );
      await expect(projection).not.toContainText("experimental");
    } else if (preCount) {
      await expect(projection).toContainText(
        "Aguardando o início da apuração.",
      );
      await expect(projection.locator(".pj-row")).toHaveCount(0);
      await expect(projection).not.toContainText("%");
      await expect(projection).not.toContainText("experimental");
    } else {
      await expect(projection.locator(".pj-row")).toHaveCount(2);
      await expect(projection).toContainText("51,2%");
      await expect(projection).toContainText("experimental");
    }
  });
}

test("curva de projeção aparece nos resultados sem transbordar a tela", async ({
  page,
  isMobile,
}) => {
  await mockLivePanel(page);
  await page.goto("/apurar/");
  if (isMobile)
    await page.getByRole("button", { name: "Ver resultados" }).click();
  const projection = page.locator(".apurar-projection");
  await expect(projection).toContainText("51,2%");
  const chart = page.locator(".plot svg").first();
  await chart.scrollIntoViewIfNeeded();
  await expect(chart).toBeVisible();
  await expect(chart.locator(".pj")).toHaveCount(2);
  await expect(page.locator(".pjf").first()).toContainText(
    "Estimativa experimental Apurar",
  );
  await expect
    .poll(() =>
      page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
    )
    .toBe(true);
  const panel = chart.locator(
    "xpath=ancestor::*[contains(concat(' ', normalize-space(@class), ' '), ' chart ')][1]",
  );
  await expect
    .poll(() =>
      panel.evaluate((node) => {
        let current: Element | null = node;
        while (current) {
          if (Number(getComputedStyle(current).opacity) < 0.99) return false;
          current = current.parentElement;
        }
        return true;
      }),
    )
    .toBe(true);
  const note = page.locator(".pjf").first();
  await expect
    .poll(() => note.evaluate((node) => node.scrollHeight <= node.clientHeight))
    .toBe(true);
  await expect
    .poll(() =>
      panel.evaluate((node) => {
        const bounds = node.getBoundingClientRect();
        const graph = node.querySelector("svg")!.getBoundingClientRect();
        const note = node.querySelector(".pjf")!.getBoundingClientRect();
        return graph.bottom <= note.top + 1 && note.bottom <= bounds.bottom + 1;
      }),
    )
    .toBe(true);
  await panel.screenshot({ path: test.info().outputPath("projecao.png") });
});
