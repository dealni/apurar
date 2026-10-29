import { expect, it } from "vitest";
import worker from "./worker";
import { loadArchive } from "./archive";
import { digest } from "./storage";
it("verifica hash do índice histórico e recusa escrita ou geração adulterada", async () => {
  const sha = "a".repeat(64),
    stamp = "2026-10-24T20:00:00Z";
  const index = {
    schema_version: 1,
    election: "6258",
    mode: "live",
    started_at: stamp,
    updated_at: stamp,
    total_observations: 1,
    sampled: false,
    truncated: false,
    observations: [
      {
        id: "supplemental-one",
        family: "supplemental",
        observed_at: stamp,
        source_as_of: null,
        pointer: { key: `live/6258/supplemental/${sha}.json`, sha256: sha },
      },
    ],
  };
  const body = JSON.stringify(index),
    hash = await digest(body);
  let corrupted = false;
  const env = {
    SNAPSHOTS: {
      get: async (key: string) => ({
        text: async () =>
          key.endsWith("latest.json")
            ? JSON.stringify({
                schema_version: 1,
                key: `live/6258/archive/${hash}.json`,
                sha256: hash,
              })
            : corrupted
              ? "{}"
              : body,
      }),
    },
    ASSETS: { fetch: async () => new Response("asset") },
  };
  const request = (path = "/api/archive", method = "GET") =>
    new Request(`https://apurar.test${path}`, { method });
  const result = await worker.fetch(request(), env);
  expect(result.status).toBe(200);
  expect(await result.json()).toEqual(index);
  expect(
    (await worker.fetch(request(`/api/archive/${hash}`, "HEAD"), env)).status,
  ).toBe(200);
  expect(
    (await worker.fetch(request("/api/archive", "POST"), env)).status,
  ).toBe(405);
  corrupted = true;
  expect((await worker.fetch(request(), env)).status).toBe(503);
});

function archiveFixture() {
  const stamp = "2026-10-24T20:00:00Z";
  const sha = "b".repeat(64);
  return {
    schema_version: 1,
    election: "6258",
    mode: "live",
    started_at: stamp,
    updated_at: stamp,
    total_observations: 1,
    sampled: false,
    truncated: false,
    observations: [
      {
        id: "supplemental-confirmed",
        family: "supplemental",
        observed_at: stamp,
        source_as_of: null,
        pointer: { key: `live/6258/supplemental/${sha}.json`, sha256: sha },
      },
    ],
  };
}

function archiveEnvironment(objects: Map<string, string>) {
  const reads: string[] = [];
  return {
    reads,
    env: {
      SNAPSHOTS: {
        get: async (key: string) => {
          reads.push(key);
          const body = objects.get(key);
          return body === undefined ? null : { text: async () => body };
        },
      },
      ASSETS: { fetch: async () => new Response("asset") },
    },
  };
}

it("consulta a versão imutável sem depender do ponteiro atual e preserva ETag/HEAD", async () => {
  const body = JSON.stringify(archiveFixture());
  const hash = await digest(body);
  const key = `live/6258/archive/${hash}.json`;
  const { env, reads } = archiveEnvironment(new Map([[key, body]]));
  const url = `https://apurar.test/api/archive/${hash}`;
  const result = await worker.fetch(new Request(url), env);
  expect(result.status).toBe(200);
  expect(await result.text()).toBe(body);
  expect(result.headers.get("ETag")).toBe(`"${hash}"`);
  expect(result.headers.get("Cache-Control")).toContain("immutable");
  const unchanged = await worker.fetch(
    new Request(url, { headers: { "If-None-Match": `W/"${hash}"` } }),
    env,
  );
  expect(unchanged.status).toBe(304);
  expect(await unchanged.text()).toBe("");
  const head = await worker.fetch(new Request(url, { method: "HEAD" }), env);
  expect(head.status).toBe(200);
  expect(await head.text()).toBe("");
  expect(reads).toEqual([key, key, key]);
});

it("mantém arquivo ausente como indisponível sem inventar observações", async () => {
  const { env } = archiveEnvironment(new Map());
  for (const suffix of ["", `/${"a".repeat(64)}`]) {
    const result = await worker.fetch(
      new Request(`https://apurar.test/api/archive${suffix}`),
      env,
    );
    expect(result.status).toBe(503);
    expect(await result.json()).toEqual({ error: "feed_unavailable" });
    expect(result.headers.get("Cache-Control")).toBe("no-store");
  }
});

it("recusa ponteiros inválidos antes de buscar objetos históricos", async () => {
  const hash = "a".repeat(64);
  const valid = {
    schema_version: 1,
    key: `live/6258/archive/${hash}.json`,
    sha256: hash,
  };
  for (const pointer of [
    null,
    [],
    "invalid",
    { ...valid, schema_version: 2 },
    { ...valid, sha256: "../latest" },
    { ...valid, key: `live/6258/snapshots/${hash}.json` },
  ]) {
    const { env, reads } = archiveEnvironment(
      new Map([["live/6258/archive-latest.json", JSON.stringify(pointer)]]),
    );
    const result = await worker.fetch(
      new Request("https://apurar.test/api/archive"),
      env,
    );
    expect(result.status).toBe(503);
    expect(reads).toEqual(["live/6258/archive-latest.json"]);
  }
});

it("recusa arquivo incompatível mesmo com hash correto", async () => {
  for (const changed of [
    { ...archiveFixture(), mode: "demo" },
    { ...archiveFixture(), schema_version: 2 },
    { ...archiveFixture(), observations: [] },
    { ...archiveFixture(), total_observations: 2 },
  ]) {
    const body = JSON.stringify(changed);
    const hash = await digest(body);
    const { env } = archiveEnvironment(
      new Map([[`live/6258/archive/${hash}.json`, body]]),
    );
    const result = await worker.fetch(
      new Request(`https://apurar.test/api/archive/${hash}`),
      env,
    );
    expect(result.status).toBe(503);
    expect(result.headers.get("Cache-Control")).toBe("no-store");
  }
});

it("não trata versão vazia ou inválida como pedido pela versão mais recente", async () => {
  const { env, reads } = archiveEnvironment(new Map());
  for (const hash of ["", "../latest", "A".repeat(64), "a".repeat(63)])
    await expect(loadArchive(env, hash)).rejects.toThrow(
      "Hash histórico inválido.",
    );
  expect(reads).toEqual([]);
});
