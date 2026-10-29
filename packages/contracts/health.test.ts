import { expect, it } from "vitest";
import { collectionStatus, parseHealth, type CollectorHealth } from "./health";
import { demo } from "../../apps/web/src/demo";
const now = Date.parse("2026-10-25T20:00:00Z");
const snapshot = {
  ...demo,
  mode: "live" as const,
  source: { ...demo.source, as_of: "2026-10-25T19:00:00Z" },
};
const health: CollectorHealth = {
  schema_version: 1,
  election: "6258",
  checked_at: new Date(now).toISOString(),
  last_success_at: new Date(now).toISOString(),
  status: "live",
  cycle_seconds: 2,
  pending_units: 0,
};
it("distingue fonte sem novidade de coleta quebrada sem alterar horário", () => {
  const original = snapshot.source.as_of;
  expect(collectionStatus(snapshot, health, now)).toMatchObject({
    warning: false,
    label: expect.stringContaining("aguardando nova publicação"),
  });
  expect(
    collectionStatus(snapshot, { ...health, status: "error" }, now).warning,
  ).toBe(true);
  expect(
    collectionStatus(snapshot, { ...health, status: "backoff" }, now).label,
  ).toContain("bloqueio");
  expect(collectionStatus(snapshot, health, now + 121000).label).toContain(
    "sem atualização recente",
  );
  expect(collectionStatus(snapshot, null, now).label).toContain("indisponível");
  expect(snapshot.source.as_of).toBe(original);
});
it("pré-contagem e encerramento têm estados próprios e tolerância de cinco minutos", () => {
  const precount = {
    ...snapshot,
    sections: { counted: 0, total: 100 },
    candidates: snapshot.candidates.map((c) => ({ ...c, votes: 0 })),
  };
  expect(collectionStatus(precount, health, now).label).toContain(
    "divulgação dos votos",
  );
  expect(
    collectionStatus(snapshot, { ...health, status: "finished" }, now + 300000)
      .warning,
  ).toBe(false);
  expect(
    collectionStatus(snapshot, { ...health, status: "finished" }, now + 361000)
      .warning,
  ).toBe(true);
  expect(
    collectionStatus(snapshot, { ...health, last_success_at: null }, now)
      .warning,
  ).toBe(true);
});
it("recusa saúde malformada ou incompatível", () => {
  expect(parseHealth(health)).toEqual(health);
  for (const invalid of [
    { ...health, status: "secret" },
    { ...health, checked_at: "nunca" },
    { ...health, election: "6257" },
    { ...health, cycle_seconds: -1 },
    { ...health, pending_units: 1.5 },
  ])
    expect(() => parseHealth(invalid)).toThrow();
});

it("não anuncia coleta ativa com última consulta no futuro além da tolerância", () => {
  const statusAt = (offset: number) =>
    collectionStatus(
      snapshot,
      { ...health, last_success_at: new Date(now + offset).toISOString() },
      now,
    );
  expect(statusAt(60000).warning).toBe(false);
  expect(statusAt(60001)).toEqual({
    warning: true,
    label: "Sem consulta recente bem-sucedida ao TSE",
  });
});
