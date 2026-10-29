import { expect, it, vi } from "vitest";
import { demo } from "../demo";
import { supplementalFixture } from "../../../../packages/contracts/supplemental-fixture";
import { createSupplementalClient } from "./supplemental-client";
import { createProjectionClient } from "./projection-client";

const live = (published_at: string, votes: number) => ({
  ...structuredClone(demo),
  mode: "live",
  published_at,
  source: { ...demo.source, as_of: published_at, collected_at: published_at },
  candidates: demo.candidates.map((candidate) => ({ ...candidate, votes })),
});

it.each(["supplemental", "projection"])(
  "%s descarta corpo recebido após cancelamento e permite nova consulta",
  async (kind) => {
    let release!: (value: unknown) => void;
    const body = new Promise<unknown>((resolve) => {
      release = resolve;
    });
    const payload =
      kind === "supplemental"
        ? supplementalFixture()
        : live("2026-10-25T20:10:00Z", 100);
    const request = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => body,
        headers: new Headers(),
      })
      .mockImplementation(async (path: string) =>
        path === "/api/manifest" ? Response.json({}) : Response.json(payload),
      );
    const client =
      kind === "supplemental"
        ? createSupplementalClient(request as typeof fetch, () =>
            Date.parse("2026-10-25T20:20:00Z"),
          )
        : createProjectionClient({
            request: request as typeof fetch,
            now: () => Date.parse("2026-10-25T20:20:00Z"),
          });
    const listener = vi.fn();
    client.subscribe(listener);
    const pending = client.refresh();
    await vi.waitFor(() => expect(request).toHaveBeenCalledTimes(1));
    client.stop();
    release(payload);
    await pending;
    expect(client.get()).toMatchObject({ loading: true, error: "" });
    expect(listener).toHaveBeenCalledTimes(1);
    await client.refresh();
    expect(client.get()).toMatchObject({ loading: false, error: "" });
    expect(listener).toHaveBeenCalledTimes(2);
  },
);

it("projeção preserva publicação recente mas permite correções com menos votos", async () => {
  const request = vi.fn(async () => Response.json({}));
  const client = createProjectionClient({
    request: request as typeof fetch,
    now: () => Date.parse("2026-10-25T20:20:00Z"),
  });
  for (const [timestamp, votes] of [
    ["2026-10-25T20:10:00Z", 100],
    ["2026-10-25T20:09:00Z", 200],
    ["2026-10-25T20:11:00Z", 90],
  ] as const) {
    request.mockImplementation(async (path?: string) =>
      path === "/api/manifest"
        ? Response.json({})
        : Response.json(live(timestamp, votes)),
    );
    await client.refresh();
    if (votes === 200) {
      expect(client.get().snapshot?.candidates[0]?.votes).toBe(100);
      expect(client.get().error).toContain("Publicação anterior");
    }
  }
  expect(client.get().snapshot?.candidates[0]?.votes).toBe(90);
  expect(client.get().error).toBe("");
});
