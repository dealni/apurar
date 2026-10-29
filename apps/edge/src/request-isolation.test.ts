import { afterEach, expect, it, vi } from "vitest";
import worker from "./worker";
import { digest } from "./storage";
import { demo } from "../../web/src/demo";

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}
const request = (path = "/api/snapshot", method = "GET", tag?: string) =>
  new Request(`https://apurar.test${path}`, {
    method,
    ...(tag ? { headers: { "If-None-Match": tag } } : {}),
  });
async function fixture(id = "shared") {
  const bytes = JSON.stringify({
    ...demo,
    mode: "live",
    snapshot_id: id,
    source: {
      ...demo.source,
      as_of: "2026-10-24T10:00:00Z",
      collected_at: "2026-10-24T10:00:01Z",
    },
    published_at: "2026-10-24T10:00:02Z",
  });
  const hash = await digest(bytes);
  const key = `live/6258/snapshots/${hash}.json`;
  const gate = deferred<void>();
  const get = vi.fn(async (name: string) => {
    await gate.promise;
    return {
      text: async () =>
        name === key ? bytes : JSON.stringify({ key, sha256: hash }),
    };
  });
  return {
    bytes,
    hash,
    gate,
    get,
    env: {
      SNAPSHOTS: { get },
      ASSETS: { fetch: async () => new Response("asset") },
    },
  };
}
afterEach(() => vi.unstubAllGlobals());
it("isola GET, HEAD e condicionais e usa a mesma chave de cache sem compartilhar promises", async () => {
  const { bytes, hash, gate, get, env } = await fixture();
  const put = vi.fn(async () => undefined);
  vi.stubGlobal("caches", { default: { match: async () => undefined, put } });
  const tasks = [
    worker.fetch(request("/api/snapshot?a=1"), env),
    worker.fetch(request("/api/snapshot?a=2"), env),
    worker.fetch(request("/api/snapshot", "HEAD"), env),
    worker.fetch(request("/api/snapshot", "GET", `W/"${hash}"`), env),
  ];
  await vi.waitFor(() => expect(get).toHaveBeenCalledTimes(4));
  gate.resolve();
  const responses = await Promise.all(tasks);
  expect(responses.map((value) => value.status)).toEqual([200, 200, 200, 304]);
  expect(await Promise.all(responses.map((value) => value.text()))).toEqual([
    bytes,
    bytes,
    "",
    "",
  ]);
  expect(get).toHaveBeenCalledTimes(8);
  expect(put).toHaveBeenCalledTimes(4);
  expect(responses[0]!.headers.get("Cache-Control")).toContain("s-maxage=10");
});
it("isola bindings, origens e caminhos sem misturar resultados", async () => {
  const first = await fixture("first"),
    second = await fixture("second");
  const tasks = [
    worker.fetch(request(), first.env),
    worker.fetch(request(), second.env),
    worker.fetch(new Request("https://other.test/api/snapshot"), first.env),
    worker.fetch(request("/api/export"), first.env),
  ];
  await vi.waitFor(() => expect(first.get).toHaveBeenCalledTimes(3));
  first.gate.resolve();
  second.gate.resolve();
  const responses = await Promise.all(tasks);
  expect(await Promise.all(responses.map((value) => value.text()))).toEqual([
    first.bytes,
    second.bytes,
    first.bytes,
    first.bytes,
  ]);
  expect(responses[0]!.headers.has("Content-Disposition")).toBe(false);
  expect(responses[3]!.headers.get("Content-Disposition")).toContain(
    "attachment;",
  );
  expect(first.get).toHaveBeenCalledTimes(6);
  expect(second.get).toHaveBeenCalledTimes(2);
});
it("falhas de uma requisição não impedem a próxima chamada", async () => {
  const { env, gate, get, bytes } = await fixture();
  get.mockRejectedValueOnce(new Error("R2 temporariamente indisponível"));
  get.mockRejectedValueOnce(new Error("R2 temporariamente indisponível"));
  const failed = await Promise.all([
    worker.fetch(request(), env),
    worker.fetch(request(), env),
  ]);
  expect(failed.map((value) => value.status)).toEqual([503, 503]);
  expect(get).toHaveBeenCalledTimes(2);
  gate.resolve();
  expect(await (await worker.fetch(request(), env)).text()).toBe(bytes);
  expect(get).toHaveBeenCalledTimes(4);
});
it("cache hit evita R2 e cache lento ou rejeitado não atrasa o resultado", async () => {
  const { env, gate, get, bytes } = await fixture();
  const write = deferred<void>();
  const waitUntil = vi.fn();
  const match = vi.fn(async () => undefined as Response | undefined);
  const put = vi.fn(() => write.promise);
  vi.stubGlobal("caches", { default: { match, put } });
  gate.resolve();
  const response = await worker.fetch(request(), env, { waitUntil });
  expect(await response.text()).toBe(bytes);
  expect(waitUntil).toHaveBeenCalledOnce();
  expect(put).toHaveBeenCalledOnce();
  // Escrita represada não cria cache de memória nem prolonga o TTL do feed.
  expect(await (await worker.fetch(request(), env)).text()).toBe(bytes);
  expect(get).toHaveBeenCalledTimes(4);
  expect(put).toHaveBeenCalledTimes(2);
  write.resolve();
  match.mockResolvedValueOnce(
    new Response(bytes, { headers: { ETag: '"cached"' } }),
  );
  expect(await (await worker.fetch(request(), env)).text()).toBe(bytes);
  expect(get).toHaveBeenCalledTimes(4);
  put.mockRejectedValueOnce(new Error("cache falhou"));
  expect((await worker.fetch(request(), env)).status).toBe(200);
});
it("usa operações próprias mesmo quando Environment compartilha o binding real", async () => {
  const { env, gate, get, bytes } = await fixture();
  const tasks = [
    worker.fetch(request(), env),
    worker.fetch(request(), { ...env }),
  ];
  await vi.waitFor(() => expect(get).toHaveBeenCalledTimes(2));
  gate.resolve();
  const responses = await Promise.all(tasks);
  expect(await Promise.all(responses.map((value) => value.text()))).toEqual([
    bytes,
    bytes,
  ]);
  expect(get).toHaveBeenCalledTimes(4);
});
it("isola versões imutáveis e tolera exceção síncrona do PUT sem contexto", async () => {
  const { env, gate, get, bytes, hash } = await fixture();
  const put = vi.fn(() => {
    throw new Error("cache indisponível");
  });
  vi.stubGlobal("caches", { default: { match: async () => undefined, put } });
  const tasks = [
    worker.fetch(request(`/api/snapshots/${hash}?one=1`), env),
    worker.fetch(request(`/api/snapshots/${hash}?two=2`), env),
  ];
  await vi.waitFor(() => expect(get).toHaveBeenCalledTimes(2));
  gate.resolve();
  const responses = await Promise.all(tasks);
  expect(await Promise.all(responses.map((value) => value.text()))).toEqual([
    bytes,
    bytes,
  ]);
  expect(get).toHaveBeenCalledTimes(2);
  expect(put).toHaveBeenCalledTimes(2);
  expect(responses[0]!.headers.get("Cache-Control")).toContain("immutable");
});
