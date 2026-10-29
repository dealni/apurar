import { expect, it } from "vitest";
import { collectionStatus, parseHealth } from "./health";
import { demo } from "../../apps/web/src/demo";
const stamp = "2026-10-25T20:00:00Z";
const health = {
  schema_version: 1 as const,
  election: "6258" as const,
  checked_at: stamp,
  last_success_at: stamp,
  status: "degraded",
  cycle_seconds: 2,
  pending_units: 1,
  tracking_failed_states: ["rj"],
  last_tracking_success_at: null,
};
it("aceita diagnóstico parcial e avisa mesmo com nacional recente", () => {
  expect(parseHealth(health)).toEqual(health);
  expect(
    collectionStatus({ ...demo, mode: "live" }, health, Date.parse(stamp)),
  ).toEqual({
    warning: true,
    label: "Coleta municipal parcial · totais nacionais preservados",
  });
  expect(
    collectionStatus(
      { ...demo, mode: "live" },
      { ...health, status: "live" },
      Date.parse(stamp),
    ).warning,
  ).toBe(true);
});
it("rejeita UFs e horário inválidos, aceitando o contrato anterior", () => {
  expect(() =>
    parseHealth({ ...health, tracking_failed_states: ["<script>"] }),
  ).toThrow();
  expect(() =>
    parseHealth({ ...health, tracking_failed_states: "rj" }),
  ).toThrow();
  expect(() =>
    parseHealth({ ...health, last_tracking_success_at: "inválido" }),
  ).toThrow();
  const { tracking_failed_states, last_tracking_success_at, ...legacy } =
    health;
  expect(parseHealth({ ...legacy, status: "live" })).toEqual({
    ...legacy,
    status: "live",
  });
});

it("valida saúde suplementar e mantém falha adicional distinta dos oficiais", () => {
  const health = {
    schema_version: 1,
    election: "6258",
    checked_at: new Date().toISOString(),
    last_success_at: new Date().toISOString(),
    status: "live",
    pending_units: 0,
    cycle_seconds: 1,
    supplemental: {
      status: "error",
      pending: 0,
      errors: 1,
      zones_pending: 0,
      last_updated_at: null,
    },
  };
  expect(parseHealth(health).supplemental?.status).toBe("error");
  expect(() =>
    parseHealth({
      ...health,
      supplemental: { ...health.supplemental, errors: -1 },
    }),
  ).toThrow();
});
