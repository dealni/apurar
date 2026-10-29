import { expect, test } from "@playwright/test";
import { supplementalFixture } from "../packages/contracts/supplemental-fixture";
import { mockLivePanel } from "./bundle-fixture";

for (const view of ["governadores", "exterior"]) {
  test(`${view} retoma após 503 e preserva resultado durante nova falha`, async ({
    page,
  }) => {
    await page.clock.install({ time: new Date("2026-10-25T20:20:00-03:00") });
    await mockLivePanel(page);
    const payload = supplementalFixture();
    const city = payload.exterior.cities[0]!;
    const state = {
      ...city,
      id: "DF:aggregate",
      name: "Distrito Federal",
      scope: "state",
      office: "governor" as const,
      election: "6260",
      uf: "DF",
      source_url: null,
      candidates: [
        { ...city.candidates[0]!, votes: 100 },
        {
          ...city.candidates[0]!,
          id: "22",
          name: "Segunda candidatura",
          votes: 50,
        },
      ],
      totals: { ...city.totals, valid: 150 },
    };
    payload.governors = [state];
    let failed = true;
    let requests = 0;
    await page.route("**/api/supplemental", (route) => {
      requests++;
      return failed
        ? route.fulfill({ status: 503, json: { error: "feed_unavailable" } })
        : route.fulfill({ json: payload });
    });
    await page.goto(
      `/apurar/#${view === "governadores" ? "governadores-df" : "presidente-zz-29955"}`,
    );
    await expect(
      page.locator(".gov-stage, .exterior-stage").first(),
    ).toBeVisible();
    await expect(page.locator(".apurar-source")).toHaveCount(0);
    const result = page.locator(
      `[data-result-id="${view === "governadores" ? "DF:aggregate" : "ZZ:29955"}"]`,
    );
    await expect.poll(() => requests).toBeGreaterThan(0);
    await expect(result.locator(".votes")).toHaveCount(0);
    failed = false;
    await page.clock.fastForward(15_000);
    await expect(result.locator(".votes").first()).toContainText("100");
    failed = true;
    await page.clock.fastForward(15_000);
    await expect.poll(() => requests).toBeGreaterThanOrEqual(3);
    await expect(result.locator(".votes").first()).toContainText("100");
    failed = false;
    payload.updated_at = "2026-10-25T20:11:00Z";
    city.candidates[0]!.votes = 90;
    state.candidates[0]!.votes = 90;
    state.totals.valid = 140;
    city.totals.valid = 90;
    await page.clock.fastForward(15_000);
    await expect(result.locator(".votes").first()).toContainText("90");
    expect(requests).toBeGreaterThanOrEqual(4);
  });
}
