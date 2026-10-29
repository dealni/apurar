import { expectOfficialTime } from "./official-source";
import { expect, test } from "@playwright/test";
import {
  loadRealPresidentialPublications,
  mockRealPresidentialReplay,
} from "./replay-real-fixture";

test("captura real presidencial preserva geração, fonte e totais no polling local", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  const fixture = await mockRealPresidentialReplay(page);
  // Relógio da captura; os horários das respostas eleitorais ficam intactos.
  await page.clock.install({
    time: new Date(fixture.provenance.objects.manifest.captured_at),
  });
  await page.goto("/apurar/");
  await expectOfficialTime(page, "24/10/2026, 19:19:13");
  const current = () =>
    page.evaluate(() => {
      const view = (
        window as unknown as {
          APURAR_CURRENT_VIEW: () => {
            seq: string;
            source: { as_of: string };
            nat: { cand: number[]; secDone: number; sections: number };
            projection: unknown;
          };
        }
      ).APURAR_CURRENT_VIEW();
      return {
        seq: view.seq,
        as_of: view.source.as_of,
        votes: view.nat.cand,
        counted: view.nat.secDone,
        total: view.nat.sections,
        projection: view.projection,
      };
    });
  await expect.poll(current).toEqual({
    seq: fixture.snapshot.snapshot_id,
    as_of: fixture.snapshot.source.as_of,
    votes: fixture.snapshot.candidates.map((candidate) => candidate.votes),
    counted: fixture.snapshot.sections.counted,
    total: fixture.snapshot.sections.total,
    projection: fixture.snapshot.projection,
  });
  const before = await current();
  const manifestCalls = () =>
    fixture.requests.filter((path) => path === "/api/manifest").length;
  const calls = manifestCalls();
  await page.clock.fastForward(15001);
  await expect.poll(manifestCalls).toBeGreaterThan(calls);
  expect(await current()).toEqual(before);
  await expectOfficialTime(page, "24/10/2026, 19:19:13");
  await expect(page.locator(".live.replay")).toHaveCount(0);
  expect(errors).toEqual([]);
});

test("histórico real anterior à abertura não vira replay de apuração pela interação pública", async ({
  page,
}) => {
  await mockRealPresidentialReplay(page);
  await page.goto("/apurar/");
  await expect(
    page.getByRole("slider", { name: "Hora da apuração" }),
  ).toHaveCount(0);
  await page.keyboard.press("Home");
  await page.keyboard.press("Space");
  await expect(page.locator(".live.replay")).toHaveCount(0);
  await expectOfficialTime(page, "24/10/2026, 19:19:13");
  await expect(
    page.getByRole("button", { name: "Mais recente", exact: true }),
  ).toHaveCount(0);
});

test("publicações reais atualizam projeção pelo polling sem alterar o horário original da fonte", async ({
  page,
}) => {
  await mockRealPresidentialReplay(page);
  const publications = loadRealPresidentialPublications();
  const suspended = publications.find(
    (item) => !item.snapshot.projection.available,
  )!;
  const resumed = publications.find(
    (item) =>
      item.snapshot.projection.available &&
      Date.parse(item.snapshot.published_at) >
        Date.parse(suspended.snapshot.published_at),
  )!;
  let current = suspended;
  const bodies = new Map<string, string>();
  for (const publication of [suspended, resumed])
    for (const name of ["snapshots", "history", "municipalities"] as const)
      bodies.set(publication.manifest[name], publication.bodies[name]);
  await page.route("**/api/manifest", (route) =>
    route.fulfill({ json: current.manifest }),
  );
  await page.route(/\/api\/(snapshots|history|municipalities)\//, (route) => {
    const body = bodies.get(new URL(route.request().url()).pathname);
    return body === undefined
      ? route.fulfill({ status: 404, body: "Fora das publicações reais." })
      : route.fulfill({ contentType: "application/json", body });
  });
  await page.clock.install({ time: new Date(resumed.snapshot.published_at) });
  await page.goto("/apurar/");
  const displayed = () =>
    page.evaluate(() => {
      const view = (
        window as unknown as {
          APURAR_CURRENT_VIEW: () => {
            seq: string;
            source: { as_of: string };
            projection: { available: boolean };
          };
        }
      ).APURAR_CURRENT_VIEW();
      return {
        seq: view.seq,
        as_of: view.source?.as_of,
        projection: view.projection?.available,
      };
    });
  await expect.poll(displayed).toEqual({
    seq: suspended.snapshot.snapshot_id,
    as_of: suspended.snapshot.source.as_of,
    projection: false,
  });
  current = resumed;
  await page.clock.fastForward(15001);
  await expect.poll(displayed).toEqual({
    seq: resumed.snapshot.snapshot_id,
    as_of: resumed.snapshot.source.as_of,
    projection: true,
  });
  await expectOfficialTime(page, "24/10/2026, 19:19:13");
  await expect(
    page.getByRole("slider", { name: "Hora da apuração" }),
  ).toHaveCount(0);
  await expect(page.locator(".live.replay")).toHaveCount(0);
});
