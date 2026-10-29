import { afterEach, expect, it, vi } from "vitest";
import { demo } from "../demo";
import { requestBundle } from "./bundle";
import { createProjectionClient } from "./projection-client";
import type { Snapshot } from "../../../../packages/contracts/snapshot";

const now = Date.parse("2026-10-25T20:10:00Z");
function snapshot(time: number, id: string): Snapshot {
  const stamp = new Date(time).toISOString();
  return {
    ...structuredClone(demo),
    snapshot_id: id,
    mode: "live",
    published_at: stamp,
    source: { ...demo.source, as_of: stamp, collected_at: stamp },
  };
}
function documents(value: Snapshot) {
  const paths = {
    snapshots: `/api/snapshots/${"1".repeat(64)}`,
    municipalities: `/api/municipalities/${"2".repeat(64)}`,
    history: `/api/history/${"3".repeat(64)}`,
  };
  return {
    "/api/manifest": {
      schema_version: 1,
      snapshot_id: value.snapshot_id,
      ...paths,
    },
    [paths.snapshots]: value,
    [paths.municipalities]: { snapshot_id: value.snapshot_id },
    [paths.history]: { snapshot_id: value.snapshot_id },
  };
}
afterEach(() => vi.restoreAllMocks());

it("revalida o relógio do lote em cache e recupera uma publicação corrigida", async () => {
  const clock = vi.spyOn(Date, "now").mockReturnValue(now + 3600000);
  const future = snapshot(now + 3600000, "future");
  let docs: Record<string, unknown> = documents(future);
  const request = vi.fn(async (path: string) => docs[path]);
  const cached = await requestBundle(request);
  clock.mockReturnValue(now);
  await expect(requestBundle(request, future, cached)).rejects.toThrow(
    "Horário futuro",
  );
  // A cache continua poupando download; o horário inválido deixa de ser confirmado.
  expect(request).toHaveBeenCalledTimes(5);
  const repaired = snapshot(now, "repaired");
  docs = documents(repaired);
  const recovered = await requestBundle(request, future, cached);
  expect(recovered.snapshot.snapshot_id).toBe("repaired");
  expect(recovered.snapshot.published_at).toBe(repaired.published_at);
});

it("projeção recupera publicação futura após ajuste do relógio", async () => {
  let clock = now + 3600000;
  let value = snapshot(clock, "future");
  const request = vi.fn(async (path: string) =>
    Response.json(path === "/api/manifest" ? {} : value),
  );
  const client = createProjectionClient({
    request: request as typeof fetch,
    now: () => clock,
  });
  await client.refresh();
  clock = now;
  value = snapshot(now, "repaired");
  value.candidates[0]!.votes -= 1;
  await client.refresh();
  expect(client.get().snapshot?.snapshot_id).toBe("repaired");
  expect(client.get().error).toBe("");
});
