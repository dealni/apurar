import { describe, expect, it, vi } from "vitest";
import { supplementalFixture } from "../../../../packages/contracts/supplemental-fixture";
import { parseSupplemental } from "./supplemental-data";
import { createSupplementalClient } from "./supplemental-client";

const now = Date.parse("2026-10-25T20:10:00Z");

describe("relógio do suplemento ao vivo", () => {
  it.each(["updated_at", "generated_at", "as_of"] as const)(
    "preserva dados e ETag quando %s vem do futuro",
    async (field) => {
      const value = supplementalFixture();
      const future = supplementalFixture();
      if (field === "updated_at") future[field] = "2026-10-25T20:11:01Z";
      else future.exterior.cities[0]![field] = "2026-10-25T20:11:01Z";
      const request = vi
        .fn()
        .mockResolvedValueOnce(
          Response.json(value, { headers: { ETag: '"válido"' } }),
        )
        .mockResolvedValueOnce(
          Response.json(future, { headers: { ETag: '"futuro"' } }),
        )
        .mockResolvedValueOnce(new Response(null, { status: 304 }));
      const client = createSupplementalClient(
        request as typeof fetch,
        () => now,
      );
      await client.refresh();
      const previous = client.get().payload;
      await client.refresh();
      expect(client.get().payload).toBe(previous);
      expect(client.get().error).toContain("futuro");
      await client.refresh();
      expect(request.mock.calls[2]?.[1]?.headers).toEqual({
        "If-None-Match": '"válido"',
      });
    },
  );

  it("aceita tolerância de 60s e pré-contagem sem as_of", async () => {
    const value = supplementalFixture();
    value.updated_at = "2026-10-25T20:11:00Z";
    value.exterior.cities[0]!.as_of = null;
    const request = vi.fn().mockResolvedValue(Response.json(value));
    const client = createSupplementalClient(request as typeof fetch, () => now);
    await client.refresh();
    expect(client.get().payload?.exterior.cities[0]?.as_of).toBeNull();
    expect(client.get().error).toBe("");
  });

  it("recupera relógio adiantado sem bloquear redução oficial dos votos", async () => {
    let clock = now + 3600000;
    const future = supplementalFixture();
    future.updated_at = new Date(clock).toISOString();
    const repaired = supplementalFixture();
    repaired.exterior.cities[0]!.candidates[0]!.votes = 90;
    const request = vi
      .fn()
      .mockResolvedValueOnce(Response.json(future))
      .mockResolvedValueOnce(Response.json(repaired));
    const client = createSupplementalClient(
      request as typeof fetch,
      () => clock,
    );
    await client.refresh();
    expect(client.get().payload?.updated_at).toBe(future.updated_at);
    clock = now;
    await client.refresh();
    expect(client.get().payload?.exterior.cities[0]?.candidates[0]?.votes).toBe(
      90,
    );
    expect(client.get().error).toBe("");
  });

  it("mantém leitura imutável independente do relógio atual", () => {
    const archived = supplementalFixture();
    archived.updated_at = "2099-10-25T20:10:00Z";
    expect(parseSupplemental(archived)).toBe(archived);
  });

  it("abandona ETag futuro e não confirma 304 após correção do relógio", async () => {
    let clock = now + 3600000;
    const future = supplementalFixture();
    future.updated_at = new Date(clock).toISOString();
    const request = vi
      .fn()
      .mockResolvedValueOnce(
        Response.json(future, { headers: { ETag: '"futuro"' } }),
      )
      .mockResolvedValueOnce(new Response(null, { status: 304 }))
      .mockResolvedValueOnce(Response.json(supplementalFixture()));
    const client = createSupplementalClient(
      request as typeof fetch,
      () => clock,
    );
    await client.refresh();
    const previous = client.get().payload;
    clock = now;
    await client.refresh();
    expect(request.mock.calls[1]?.[1]?.headers).toBeUndefined();
    expect(client.get().payload).toBe(previous);
    expect(client.get().error).toContain("futuro");
    await client.refresh();
    expect(request.mock.calls[2]?.[1]?.headers).toBeUndefined();
    expect(client.get().payload?.updated_at).toBe("2026-10-25T20:10:00Z");
    expect(client.get().error).toBe("");
  });
});
