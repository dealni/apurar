import { expectOfficialTime } from "./official-source";
import {
  mockLivePanel,
  mockManifest,
  mockEmptyDetails,
} from "./bundle-fixture";
import { demo } from "../apps/web/src/demo";
import { expect, test } from "@playwright/test";

for (const path of ["/", "/apurar/", "/1turno/"]) {
  test(`painel permanece na última publicação sem controles ou atalhos de replay: ${path}`, async ({
    page,
  }) => {
    await mockLivePanel(page);
    await page.goto(path);
    await expect(page.locator("canvas.map").first()).toBeVisible();
    await expect(page.locator(".tlbar, .sh-tl, .tlp")).toHaveCount(0);
    await expect(
      page.getByRole("slider", { name: "Hora da apuração" }),
    ).toHaveCount(0);
    await expect(
      page.getByRole("button", {
        name: /Reproduzir.*histórico|Pausar o histórico|Mais recente/,
      }),
    ).toHaveCount(0);
    const result = page.locator(".rbwrap > section, .hero").first();
    await expect(result).toBeVisible();
    const votes = result.locator('[aria-label*="votos"]');
    const before = await votes.evaluateAll((nodes) =>
      nodes.map((node) => node.getAttribute("aria-label")),
    );
    await page.keyboard.press("Space");
    await page.keyboard.press("Home");
    await page.keyboard.press("ArrowLeft");
    await expect(page.locator(".live.replay")).toHaveCount(0);
    expect(
      await votes.evaluateAll((nodes) =>
        nodes.map((node) => node.getAttribute("aria-label")),
      ),
    ).toEqual(before);
    await page.screenshot({
      path: test.info().outputPath("sem-replay.png"),
      fullPage: true,
    });
  });
}

test("sem replay o polling continua aplicando o resultado mais recente", async ({
  page,
}) => {
  await page.clock.install({ time: new Date("2026-10-25T18:10:00-03:00") });
  let current = { ...demo, mode: "live", snapshot_id: "latest-first" };
  await mockManifest(page, () => current.snapshot_id);
  await mockEmptyDetails(page, () => current.snapshot_id);
  await page.route("**/api/snapshots/*", (route) =>
    route.fulfill({ json: current }),
  );
  await page.goto("/apurar/");
  await expectOfficialTime(page, "18:00:00");
  await page.keyboard.press("Space");
  current = {
    ...current,
    snapshot_id: "latest-second",
    source: {
      ...current.source,
      as_of: "2026-10-25T18:05:00-03:00",
      collected_at: "2026-10-25T18:05:05-03:00",
    },
    published_at: "2026-10-25T18:05:10-03:00",
    candidates: current.candidates.map((candidate) => ({
      ...candidate,
      votes: candidate.votes + 1000,
    })),
  };
  await page.clock.fastForward(16000);
  await expectOfficialTime(page, "18:05:00");
  await expect(page.locator(".rbwrap > section, .hero").first()).toContainText(
    "2.401.000",
  );
  await expect(page.locator(".live.replay, .tlbar")).toHaveCount(0);
});
