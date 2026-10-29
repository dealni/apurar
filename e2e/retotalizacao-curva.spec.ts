import { expectOfficialTime } from "./official-source";
import { expect, test } from "@playwright/test";
import { demo } from "../apps/web/src/demo";
import { mockEmptyDetails, mockManifest } from "./bundle-fixture";
import type { HistoryPoint } from "../apps/web/src/feeds";

test("retotalização atualiza placar e curva com o mesmo horário oficial", async ({
  page,
  isMobile,
}) => {
  await page.clock.install({ time: new Date("2026-10-25T18:10:00-03:00") });
  await page.emulateMedia({ reducedMotion: "reduce" });
  let current = {
    ...demo,
    mode: "live",
    snapshot_id: "idg-100",
    sections: { counted: 60, total: 100 },
    candidates: demo.candidates.map((candidate, index) => ({
      ...candidate,
      votes: index ? 400 : 600,
    })),
    projection: {
      available: false,
      model: "none",
      reason: "Teste de observações oficiais.",
      shares: null,
    },
  };
  await mockManifest(page, () => current.snapshot_id);
  await mockEmptyDetails(page, () => current.snapshot_id);
  await page.route("**/api/snapshots/*", (route) =>
    route.fulfill({ json: current }),
  );
  const history = [
    {
      snapshot_id: "anterior",
      as_of: "2026-10-25T17:50:00-03:00",
      sections: { counted: 10, total: 100 },
      candidates: demo.candidates.map(({ id }) => ({ id, votes: 100 })),
    },
    {
      snapshot_id: current.snapshot_id,
      as_of: current.source.as_of,
      sections: current.sections,
      candidates: current.candidates,
    },
  ];
  // A amostra pode ainda conter a publicação anterior no mesmo horário.
  await page.route("**/api/history/*", (route) =>
    route.fulfill({
      json: {
        schema_version: 1,
        election: "6258",
        snapshot_id: current.snapshot_id,
        points: history,
      },
    }),
  );
  await page.goto("/apurar/");
  if (isMobile)
    await page.getByRole("button", { name: "Ver resultados" }).click();
  const chart = page.locator(".plot svg").first();
  await chart.scrollIntoViewIfNeeded();
  await expect(chart).toHaveAttribute("aria-label", /60,0% das seções/);
  await expect(chart).toHaveAttribute("aria-label", /Candidatura A: 60,0%/);
  const before = await chart
    .locator('path[stroke-width="2.2"]')
    .first()
    .getAttribute("d");
  current = {
    ...current,
    snapshot_id: "idg-101",
    published_at: "2026-10-25T18:05:12-03:00",
    source: { ...current.source, collected_at: "2026-10-25T18:05:10-03:00" },
    sections: { counted: 40, total: 100 },
    candidates: current.candidates.map((candidate, index) => ({
      ...candidate,
      votes: index ? 600 : 400,
    })),
  };
  await page.clock.fastForward(16000);
  await expectOfficialTime(page, "18:00:00");
  if (isMobile) {
    await expect(page.locator(".hero .leaders")).toContainText("400");
    await expect(page.locator(".hero .leaders")).toContainText("600");
  } else {
    await expect(page.locator('.rb-bar[role="img"]')).toHaveAttribute(
      "aria-label",
      /Candidatura A 40,00%.*Candidatura B 60,00%/,
    );
  }
  await expect(chart).toHaveAttribute("aria-label", /40,0% das seções/);
  await expect(chart).toHaveAttribute("aria-label", /Candidatura A: 40,0%/);
  await expect(chart).toHaveAttribute("aria-label", /Candidatura B: 60,0%/);
  await expect(
    chart.locator('path[stroke-width="2.2"]').first(),
  ).not.toHaveAttribute("d", before!);
  await expect(chart.locator(".cross")).toHaveCount(0);
  current = {
    ...current,
    snapshot_id: "idg-102",
    source: { ...current.source, as_of: "2026-10-25T18:05:00-03:00" },
    published_at: "2026-10-25T18:06:12-03:00",
    sections: { counted: 50, total: 100 },
  };
  await page.clock.fastForward(16000);
  await expect(chart).toHaveAttribute("aria-label", /Evolução até 18:05/);
  const path = chart.locator('path[stroke-width="2.2"]').first();
  const observacoes = (await path.getAttribute("d"))!
    .split(/[ML]/)
    .slice(1)
    .map((ponto) => ponto.split(",").map(Number));
  expect(observacoes).toHaveLength(3);
  // A amostra só contém idg-100; não pode desfazer idg-101 já observado.
  expect(observacoes[1]![1]).toBe(observacoes[2]![1]);
  current = {
    ...current,
    snapshot_id: "idg-103",
    source: { ...current.source, as_of: "2026-10-25T17:55:00-03:00" },
    published_at: "2026-10-25T18:07:12-03:00",
    sections: { counted: 20, total: 100 },
  };
  await page.clock.fastForward(16000);
  await expectOfficialTime(page, "17:55:00");
  await expect(chart).toHaveAttribute(
    "aria-label",
    /Evolução até 17:55; 20,0% das seções/,
  );
  await expect
    .poll(async () => (await path.getAttribute("d"))!.match(/[ML]/g)?.length)
    .toBe(2);
});

test("histórico reconcilia revisões e lacunas sem conservar uma virada corrigida", async ({
  page,
  isMobile,
}) => {
  await page.clock.install({ time: new Date("2026-10-25T18:20:00-03:00") });
  await page.emulateMedia({ reducedMotion: "reduce" });
  const ponto = (
    id: string,
    hora: string,
    secoes: number,
    votosA: number,
  ): HistoryPoint => ({
    snapshot_id: id,
    as_of: `2026-10-25T${hora}:00-03:00`,
    sections: { counted: secoes, total: 100 },
    candidates: demo.candidates.map(({ id }, index) => ({
      id,
      votes: index ? 1000 - votosA : votosA,
    })),
  });
  const inicial = ponto("atual-1", "18:00", 40, 400);
  let current = {
    ...demo,
    mode: "live",
    snapshot_id: inicial.snapshot_id,
    sections: inicial.sections,
    candidates: demo.candidates.map((candidate, index) => ({
      ...candidate,
      votes: inicial.candidates[index]!.votes,
    })),
  };
  let history = [
    ponto("inicio", "17:40", 10, 600),
    ponto("virada", "17:50", 20, 400),
  ];
  await mockManifest(page, () => current.snapshot_id);
  await mockEmptyDetails(page, () => current.snapshot_id);
  await page.route("**/api/snapshots/*", (route) =>
    route.fulfill({ json: current }),
  );
  await page.route("**/api/history/*", (route) =>
    route.fulfill({
      json: {
        schema_version: 1,
        election: "6258",
        snapshot_id: current.snapshot_id,
        points: history,
      },
    }),
  );
  await page.goto("/apurar/");
  if (isMobile)
    await page.getByRole("button", { name: "Ver resultados" }).click();
  const chart = page.locator(".plot svg").first();
  await chart.scrollIntoViewIfNeeded();
  await expect(chart.locator(".cross")).toHaveCount(1);
  const path = chart.locator('path[stroke-width="2.2"]').first();
  await expect
    .poll(async () => (await path.getAttribute("d"))!.match(/[ML]/g)?.length)
    .toBe(3);
  const ultimo = ponto("atual-2", "18:10", 50, 400);
  current = {
    ...current,
    snapshot_id: ultimo.snapshot_id,
    source: {
      ...current.source,
      as_of: ultimo.as_of,
      collected_at: ultimo.as_of,
    },
    published_at: "2026-10-25T18:10:12-03:00",
    sections: ultimo.sections,
  };
  history = [
    history[0]!,
    ponto("inicio-corrigido", "17:40", 10, 400),
    history[1]!,
    ponto("lacuna-recuperada", "17:55", 15, 400),
  ];
  await page.clock.fastForward(16000);
  await expect(chart).toHaveAttribute("aria-label", /Evolução até 18:10/);
  await expect(chart.locator(".cross")).toHaveCount(0);
  // Cinco observações, incluindo a publicação das 18:00 ausente da nova amostra.
  await expect
    .poll(async () => (await path.getAttribute("d"))!.match(/[ML]/g)?.length)
    .toBe(5);
  const coordenadas = (await path.getAttribute("d"))!
    .split(/[ML]/)
    .slice(1)
    .map((p) => p.split(",").map(Number));
  // A redução oficial de seções 20 → 15 é mantida no eixo horizontal.
  expect(coordenadas[2]![0]).toBeLessThan(coordenadas[1]![0]!);
  history = [history[0]!];
  current = {
    ...current,
    snapshot_id: "atual-3",
    source: {
      ...current.source,
      as_of: "2026-10-25T18:15:00-03:00",
      collected_at: "2026-10-25T18:15:10-03:00",
    },
    published_at: "2026-10-25T18:15:12-03:00",
    sections: { counted: 55, total: 100 },
  };
  await page.clock.fastForward(16000);
  await expect(chart).toHaveAttribute("aria-label", /Evolução até 18:15/);
  const revisados = (await path.getAttribute("d"))!
    .split(/[ML]/)
    .slice(1)
    .map((p) => p.split(",").map(Number));
  expect(revisados).toHaveLength(6);
  // Nem pontos parciais regridem quando a revisão conhecida sai da amostra.
  expect(new Set(revisados.map((ponto) => ponto[1])).size).toBe(1);
  await expect(chart.locator(".cross")).toHaveCount(0);
});
