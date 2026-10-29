import { describe, it, expect, vi } from "vitest";
import { createProjectionClient } from "../../apps/web/src/integration/projection-client";
import { demo } from "../../apps/web/src/demo";
const now = Date.parse("2026-10-25T22:00:00Z");
const live = { ...demo, mode: "live" };
const response = (value: unknown) => new Response(JSON.stringify(value));
describe("extensão de projeção no sistema original", () => {
  it("usa somente nosso endpoint e mantém hora/percentuais da fonte", async () => {
    const request = vi.fn(
      async (_input: RequestInfo | URL, _init?: RequestInit) => response(live),
    );
    const client = createProjectionClient({ request, now: () => now });
    await client.refresh();
    expect(request.mock.calls[0]?.[0]).toBe("/api/snapshot");
    expect(client.get().snapshot?.projection.shares).toEqual(
      demo.projection.shares,
    );
    expect(client.get().snapshot?.source.as_of).toBe(demo.source.as_of);
    expect(client.get().stale).toBe(true);
  });
  it("recusa demonstração sem substituir a fonte oficial", async () => {
    const client = createProjectionClient({
      request: async () => response(demo),
      now: () => now,
    });
    await client.refresh();
    expect(client.get().snapshot).toBeNull();
    expect(client.get().error).toContain("demonstração");
  });
  it("preserva última projeção e informa falha de rede", async () => {
    let calls = 0;
    const request = vi.fn(async (path: RequestInfo | URL) => {
      if (path === "/api/manifest") return response({ health: null });
      if (calls++ === 0) return response(live);
      throw new Error("Sem conexão");
    });
    const client = createProjectionClient({ request, now: () => now });
    await client.refresh();
    await client.refresh();
    expect(client.get().snapshot?.snapshot_id).toBe(live.snapshot_id);
    expect(client.get().error).toBe("Sem conexão");
    expect(client.get().stale).toBe(true);
  });
  it("não cria projeção quando backend a suspende", async () => {
    const client = createProjectionClient({
      request: async () =>
        response({
          ...live,
          projection: {
            available: false,
            model: "none",
            reason: "Reconciliação pendente",
            shares: null,
          },
        }),
      now: () => now,
    });
    await client.refresh();
    expect(client.get().snapshot?.projection.available).toBe(false);
    expect(client.get().snapshot?.projection.shares).toBeNull();
  });
});
