import { expect, it, vi } from "vitest";
import { digest, FeedUnavailable } from "./storage";
import { loadSupplemental } from "./supplemental";
import worker from "./worker";
import { supplementalFixture } from "../../../packages/contracts/supplemental-fixture";
const payload = {
  schema_version: 1,
  election: "6258",
  mode: "live",
  updated_at: new Date().toISOString(),
  governors: [],
  exterior: { cities: [], countries: [] },
  zones: [],
  capabilities: { governor: true, zones: false },
  coverage: { pending: 0, errors: 0 },
};
it("entrega suplemento íntegro independente do lote presidencial e rejeita adulteração", async () => {
  const body = JSON.stringify(payload),
    hash = await digest(body);
  const pointer = JSON.stringify({
    schema_version: 1,
    key: `live/6258/supplemental/${hash}.json`,
    sha256: hash,
  });
  let corrupted = false;
  const env = {
    SNAPSHOTS: {
      get: async (key: string) => ({
        text: async () =>
          key.endsWith("latest.json") ? pointer : corrupted ? "{}" : body,
      }),
    },
    ASSETS: { fetch: async () => new Response("asset") },
  };
  const request = (suffix = "", init?: RequestInit) =>
    new Request(`https://apurar.test/api/supplemental${suffix}`, init);
  const result = await worker.fetch(request(), env);
  expect(result.status).toBe(200);
  expect(await result.json()).toEqual(payload);
  expect(
    (await worker.fetch(request(`/${hash}`, { method: "HEAD" }), env)).status,
  ).toBe(200);
  expect(
    (await worker.fetch(request("", { method: "POST" }), env)).status,
  ).toBe(405);
  corrupted = true;
  expect((await worker.fetch(request(), env)).status).toBe(503);
});

it("versão suplementar imutável dispensa ponteiro e confirma o conteúdo", async () => {
  const bytes = JSON.stringify(payload);
  const hash = await digest(bytes);
  const get = vi.fn(async () => ({ text: async () => bytes }));
  const env = {
    SNAPSHOTS: { get },
    ASSETS: { fetch: async () => new Response("asset") },
  };
  await expect(loadSupplemental(env, hash)).resolves.toEqual({ bytes, hash });
  expect(get).toHaveBeenCalledExactlyOnceWith(
    `live/6258/supplemental/${hash}.json`,
  );
  get.mockClear();
  await expect(loadSupplemental(env, "../objeto")).rejects.toThrow(
    "Hash suplementar inválido",
  );
  expect(get).not.toHaveBeenCalled();
});

it("recusa ponteiros suplementares inválidos sem ler outro objeto", async () => {
  const hash = "a".repeat(64);
  for (const pointer of [
    null,
    [],
    "ponteiro",
    { schema_version: 1, key: `other/${hash}.json`, sha256: hash },
    {
      schema_version: 2,
      key: `live/6258/supplemental/${hash}.json`,
      sha256: hash,
    },
    {
      schema_version: 1,
      key: "live/6258/supplemental/invalid.json",
      sha256: "invalid",
    },
  ]) {
    const get = vi.fn(async () => ({
      text: async () => JSON.stringify(pointer),
    }));
    await expect(
      loadSupplemental({
        SNAPSHOTS: { get },
        ASSETS: { fetch: async () => new Response("asset") },
      }),
    ).rejects.toThrow();
    expect(get).toHaveBeenCalledOnce();
  }
});

it("ausência suplementar conserva estado indisponível e permite recuperar", async () => {
  const bytes = JSON.stringify(payload);
  const hash = await digest(bytes);
  let missing = true;
  const env = {
    SNAPSHOTS: {
      get: async () => (missing ? null : { text: async () => bytes }),
    },
    ASSETS: { fetch: async () => new Response("asset") },
  };
  await expect(loadSupplemental(env, hash)).rejects.toBeInstanceOf(
    FeedUnavailable,
  );
  missing = false;
  await expect(loadSupplemental(env, hash)).resolves.toEqual({ bytes, hash });
});

it("recusa resultado disponível incompleto mesmo com SHA-256 correto", async () => {
  const invalid = supplementalFixture();
  invalid.exterior.cities[0]!.sections.counted = null;
  const bytes = JSON.stringify(invalid);
  const hash = await digest(bytes);
  const env = {
    SNAPSHOTS: { get: async () => ({ text: async () => bytes }) },
    ASSETS: { fetch: async () => new Response("asset") },
  };
  const response = await worker.fetch(
    new Request(`https://apurar.test/api/supplemental/${hash}`),
    env,
  );
  expect(response.status).toBe(503);
  expect(response.headers.get("Cache-Control")).toBe("no-store");
  expect(await response.json()).toEqual({
    error: "invalid_or_unavailable_snapshot",
  });
});
