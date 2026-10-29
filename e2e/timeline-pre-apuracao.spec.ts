import { expectOfficialTime } from "./official-source";
import { expect, test } from "@playwright/test";
import { demo } from "../apps/web/src/demo";
import { mockEmptyDetails, mockManifest } from "./bundle-fixture";

for (const [asOf, text] of [
  ["2026-10-24T19:19:13-03:00", "24/10/2026, 19:19:13"],
  ["2026-10-25T10:00:00-03:00", "25/10/2026, 10:00:00"],
] as const) {
  test(`fonte anterior à abertura mantém seu horário sem habilitar cortes futuros: ${asOf}`, async ({
    page,
  }) => {
    await page.clock.setFixedTime(new Date("2026-10-25T12:00:00-03:00"));
    const snapshot = {
      ...demo,
      mode: "live",
      snapshot_id: "timeline-pre-apuracao",
      source: {
        ...demo.source,
        as_of: asOf,
        collected_at: "2026-10-25T11:59:00-03:00",
      },
      published_at: "2026-10-25T11:59:10-03:00",
    };
    await mockManifest(page, () => snapshot.snapshot_id);
    await mockEmptyDetails(page, () => snapshot.snapshot_id);
    await page.route("**/api/history/*", (route) =>
      route.fulfill({
        json: {
          schema_version: 1,
          election: "6258",
          snapshot_id: snapshot.snapshot_id,
          points: [
            {
              snapshot_id: snapshot.snapshot_id,
              as_of: asOf,
              sections: snapshot.sections,
              candidates: snapshot.candidates,
              projection: snapshot.projection,
            },
          ],
        },
      }),
    );
    await page.route("**/api/snapshots/*", (route) =>
      route.fulfill({ json: snapshot }),
    );
    await page.route("**/api/supplemental", (route) =>
      route.fulfill({ status: 503, json: {} }),
    );
    await page.goto("/apurar/");
    await expect(
      page.getByRole("slider", { name: "Hora da apuração" }),
    ).toHaveCount(0);
    await page.keyboard.press("Space");
    await expectOfficialTime(page, text);
    await expect(page.locator(".live.replay")).toHaveCount(0);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth + 1,
      ),
    ).toBe(true);
  });
}
