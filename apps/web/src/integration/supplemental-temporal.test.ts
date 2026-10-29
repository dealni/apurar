import { describe, expect, it, vi } from "vitest";
import { supplementalFixture } from "../../../../packages/contracts/supplemental-fixture";
import { createSupplementalClient } from "./supplemental-client";

const publication = (updated_at: string, votes: number) => {
  const value = supplementalFixture();
  value.updated_at = updated_at;
  value.exterior.cities[0]!.candidates[0]!.votes = votes;
  return value;
};

describe("ordem temporal das publicações suplementares", () => {
  it("preserva dados e ETag anterior ao receber publicação antiga", async () => {
    const current = publication("2026-10-25T20:10:00Z", 100);
    const old = publication("2026-10-25T17:09:59-03:00", 200);
    const request = vi
      .fn()
      .mockResolvedValueOnce(
        Response.json(current, { headers: { ETag: '"atual"' } }),
      )
      .mockResolvedValueOnce(
        Response.json(old, { headers: { ETag: '"antigo"' } }),
      )
      .mockResolvedValueOnce(new Response(null, { status: 304 }));
    const client = createSupplementalClient(request as typeof fetch, () =>
      Date.parse("2026-10-25T20:20:00Z"),
    );
    await client.refresh();
    const previous = client.get().payload;
    await client.refresh();
    expect(client.get().payload).toBe(previous);
    expect(client.get().error).toContain("anterior");
    expect(client.get().loading).toBe(false);
    await client.refresh();
    expect(request.mock.calls[2]?.[1]?.headers).toEqual({
      "If-None-Match": '"atual"',
    });
    expect(client.get().payload).toBe(previous);
    expect(client.get().error).toBe("");
  });

  it("aceita correção mais recente que diminui a contagem oficial", async () => {
    const request = vi
      .fn()
      .mockResolvedValueOnce(
        Response.json(publication("2026-10-25T20:10:00Z", 100)),
      )
      .mockResolvedValueOnce(
        Response.json(publication("2026-10-25T20:11:00Z", 90)),
      );
    const client = createSupplementalClient(request as typeof fetch, () =>
      Date.parse("2026-10-25T20:20:00Z"),
    );
    await client.refresh();
    await client.refresh();
    expect(client.get().payload?.exterior.cities[0]?.candidates[0]?.votes).toBe(
      90,
    );
    expect(client.get().error).toBe("");
  });

  it("aceita revisão com horário equivalente em outro fuso", async () => {
    const request = vi
      .fn()
      .mockResolvedValueOnce(
        Response.json(publication("2026-10-25T20:10:00Z", 100)),
      )
      .mockResolvedValueOnce(
        Response.json(publication("2026-10-25T17:10:00-03:00", 90)),
      );
    const client = createSupplementalClient(request as typeof fetch, () =>
      Date.parse("2026-10-25T20:20:00Z"),
    );
    await client.refresh();
    await client.refresh();
    expect(client.get().payload?.exterior.cities[0]?.candidates[0]?.votes).toBe(
      90,
    );
    expect(client.get().error).toBe("");
  });
});
