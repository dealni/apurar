import { afterEach, expect, it, vi } from "vitest";
import worker from "./worker";
import { digest } from "./storage";
import { demo } from "../../web/src/demo";

const assets = { fetch: async () => new Response("asset") };
const request = (
  path = "/api/snapshot",
  method = "GET",
  headers?: HeadersInit,
) =>
  new Request(`https://apurar.test${path}`, {
    method,
    ...(headers ? { headers } : {}),
  });
async function fixture() {
  const bytes = JSON.stringify({
    ...demo,
    mode: "live",
    source: {
      ...demo.source,
      as_of: "2026-10-24T10:00:00Z",
      collected_at: "2026-10-24T10:00:01Z",
    },
    published_at: "2026-10-24T10:00:02Z",
  });
  const hash = await digest(bytes);
  const key = `live/6258/snapshots/${hash}.json`;
  const documents = new Map<string, string>([
    [key, bytes],
    ["live/6258/latest.json", JSON.stringify({ key, sha256: hash })],
  ]);
  const get = vi.fn(
    async (
      name: string,
    ): Promise<{
      size?: number;
      text(): Promise<string>;
    } | null> => {
      const body = documents.get(name);
      return body === undefined ? null : { text: async () => body };
    },
  );
  return {
    bytes,
    hash,
    key,
    documents,
    get,
    env: { SNAPSHOTS: { get }, ASSETS: assets },
  };
}
afterEach(() => vi.unstubAllGlobals());
it("não inventa resultados e remove body de HEAD inclusive nos erros", async () => {
  const env = { SNAPSHOTS: { get: async () => null }, ASSETS: assets };
  for (const path of [
    "/api/snapshot",
    "/api/history",
    "/api/municipalities",
    "/api/nao-existe",
    "/api",
  ]) {
    const response = await worker.fetch(request(path, "HEAD"), env);
    expect(response.status).toBe(
      path === "/api/nao-existe" || path === "/api" ? 404 : 503,
    );
    expect(await response.text()).toBe("");
    expect(response.headers.get("Cache-Control")).toBe("no-store");
  }
});
it("recusa mutação pública e preserva entrega dos assets", async () => {
  const { env } = await fixture();
  expect(
    (await worker.fetch(request("/api/snapshot", "POST"), env)).status,
  ).toBe(405);
  expect(await (await worker.fetch(request("/"), env)).text()).toBe("asset");
});
it("entrega snapshot íntegro, HEAD e ETags fortes/fracos/lista", async () => {
  const { env, bytes, hash } = await fixture();
  expect(await (await worker.fetch(request(), env)).text()).toBe(bytes);
  for (const tag of [`"${hash}"`, `W/"${hash}"`, `"outro", "${hash}"`, "*"]) {
    expect(
      (
        await worker.fetch(
          request("/api/snapshot", "GET", { "If-None-Match": tag }),
          env,
        )
      ).status,
    ).toBe(304);
  }
  expect(
    await (await worker.fetch(request("/api/snapshot", "HEAD"), env)).text(),
  ).toBe("");
});
it("recusa objeto adulterado ou demo no canal live", async () => {
  const { env, documents, key } = await fixture();
  documents.set(key, "{}");
  expect((await worker.fetch(request(), env)).status).toBe(503);
  const bytes = JSON.stringify(demo);
  const hash = await digest(bytes);
  documents.set(`live/6258/snapshots/${hash}.json`, bytes);
  documents.set(
    "live/6258/latest.json",
    JSON.stringify({ key: `live/6258/snapshots/${hash}.json`, sha256: hash }),
  );
  expect((await worker.fetch(request(), env)).status).toBe(503);
});
it("recusa ponteiro nacional sem hash ou divergente da chave íntegra", async () => {
  const { env, documents, key, hash, bytes } = await fixture();
  for (const pointer of [
    { key },
    { key, sha256: "0".repeat(64) },
    { key, sha256: `${hash}/..` },
  ]) {
    documents.set("live/6258/latest.json", JSON.stringify(pointer));
    const response = await worker.fetch(request(), env);
    expect(response.status).toBe(503);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
  }
  // O objeto já endereçado pelo conteúdo independe de um ponteiro inválido.
  expect(
    await (await worker.fetch(request(`/api/snapshots/${hash}`), env)).text(),
  ).toBe(bytes);
});
it("limita objetos pelo tamanho informado e pelo conteúdo real em UTF-8", async () => {
  const { env, get, bytes } = await fixture();
  const text = vi.fn(async () => bytes);
  get.mockResolvedValueOnce({ size: 16 * 1024 * 1024 + 1, text });
  expect((await worker.fetch(request(), env)).status).toBe(503);
  expect(text).not.toHaveBeenCalled();
  get.mockResolvedValueOnce({
    text: async () => "é".repeat(8 * 1024 * 1024 + 1),
  });
  expect((await worker.fetch(request(), env)).status).toBe(503);
});
it("serve versões imutáveis e exportação por JSON", async () => {
  const { env, hash, bytes } = await fixture();
  const immutable = await worker.fetch(request(`/api/snapshots/${hash}`), env);
  expect(immutable.headers.get("Cache-Control")).toContain("immutable");
  expect(await immutable.text()).toBe(bytes);
  const exported = await worker.fetch(request("/api/export"), env);
  expect(exported.headers.get("Content-Disposition")).toContain("attachment;");
  expect(await exported.text()).toBe(bytes);
  expect(
    (await worker.fetch(request("/api/snapshots/invalid"), env)).status,
  ).toBe(404);
});
it("entrega feeds opcionais somente com hash e envelope válidos", async () => {
  const { env, documents, key } = await fixture();
  expect((await worker.fetch(request("/api/history"), env)).status).toBe(503);
  const refs: Record<string, { key: string; sha256: string }> = {};
  for (const kind of ["history", "municipalities"]) {
    const bytes = JSON.stringify({
      schema_version: 1,
      snapshot_id: demo.snapshot_id,
      election: "6258",
      [kind === "history" ? "points" : "items"]: [],
    });
    const sha256 = await digest(bytes);
    const feedKey = `live/6258/${kind}/${sha256}.json`;
    refs[kind] = { key: feedKey, sha256 };
    documents.set(feedKey, bytes);
  }
  documents.set("live/6258/latest.json", JSON.stringify({ key, ...refs }));
  for (const kind of ["history", "municipalities"]) {
    expect((await worker.fetch(request(`/api/${kind}`), env)).status).toBe(200);
  }
  documents.set(
    "live/6258/latest.json",
    JSON.stringify({
      key,
      history: { key: "private/secrets.json", sha256: "0".repeat(64) },
    }),
  );
  expect((await worker.fetch(request("/api/history"), env)).status).toBe(503);
});
it("armazena e consulta Cache API com TTL real sem fragmentar por query", async () => {
  const { env, get } = await fixture();
  const stored = new Map<string, Response>();
  const match = vi.fn(async (key: Request) => stored.get(key.url)?.clone());
  const put = vi.fn(async (key: Request, response: Response) => {
    stored.set(key.url, response.clone());
  });
  vi.stubGlobal("caches", { default: { match, put } });
  const first = await worker.fetch(request("/api/snapshot?foo=1"), env);
  expect(first.headers.get("Cache-Control")).toContain("max-age=0");
  expect(put).toHaveBeenCalledOnce();
  expect(
    stored
      .get("https://apurar.test/api/snapshot")
      ?.headers.get("Cache-Control"),
  ).toBe("public, max-age=10");
  const second = await worker.fetch(
    request("/api/snapshot?foo=2", "HEAD"),
    env,
  );
  expect(second.status).toBe(200);
  expect(await second.text()).toBe("");
  expect(get).toHaveBeenCalledTimes(2);
  expect(match).toHaveBeenCalledTimes(2);
});
it("não cacheia erros e tolera falha do serviço de cache", async () => {
  const { env } = await fixture();
  const put = vi.fn(async () => {
    throw new Error("cache indisponível");
  });
  vi.stubGlobal("caches", {
    default: {
      match: async () => {
        throw new Error("cache indisponível");
      },
      put,
    },
  });
  expect((await worker.fetch(request(), env)).status).toBe(200);
  const missing = { ...env, SNAPSHOTS: { get: async () => null } };
  expect((await worker.fetch(request(), missing)).status).toBe(503);
  expect(put).toHaveBeenCalledOnce();
});
it("fixa o lote pelo manifesto mesmo que o ponteiro avance entre as leituras", async () => {
  const { env, documents, key, hash } = await fixture();
  const refs: Record<string, { key: string; sha256: string }> = {};
  for (const kind of ["municipalities", "history"]) {
    const body = JSON.stringify({
      schema_version: 1,
      election: "6258",
      snapshot_id: demo.snapshot_id,
      [kind === "history" ? "points" : "items"]: [],
    });
    const sha256 = await digest(body);
    refs[kind] = { key: `live/6258/${kind}/${sha256}.json`, sha256 };
    documents.set(refs[kind]!.key, body);
  }
  documents.set(
    "live/6258/latest.json",
    JSON.stringify({
      schema_version: 1,
      snapshot_id: demo.snapshot_id,
      key,
      sha256: hash,
      ...refs,
    }),
  );
  const response = await worker.fetch(request("/api/manifest"), env);
  expect(response.status).toBe(200);
  const manifest = (await response.json()) as Record<string, string>;
  expect(manifest.snapshot_id).toBe(demo.snapshot_id);
  // A leitura de objetos já selecionados não consulta o ponteiro atualizado.
  documents.set("live/6258/latest.json", "{}");
  for (const kind of ["snapshots", "municipalities", "history"]) {
    const result = await worker.fetch(request(manifest[kind]!), env);
    expect(result.status).toBe(200);
    expect(result.headers.get("Cache-Control")).toContain("immutable");
    expect(((await result.json()) as Record<string, unknown>).snapshot_id).toBe(
      demo.snapshot_id,
    );
  }
  documents.set(refs.history!.key, "{}");
  expect((await worker.fetch(request(manifest.history!), env)).status).toBe(
    503,
  );
});
it("recusa manifesto com hash diferente da chave ou caminho privado", async () => {
  const { env, documents, key, hash } = await fixture();
  const pointer = {
    schema_version: 1,
    snapshot_id: demo.snapshot_id,
    key,
    sha256: hash,
    municipalities: { key: "private/file.json", sha256: hash },
    history: { key: `live/6258/history/${hash}.json`, sha256: hash },
  };
  documents.set("live/6258/latest.json", JSON.stringify(pointer));
  expect((await worker.fetch(request("/api/manifest"), env)).status).toBe(503);
});

it("expõe saúde separada no manifesto e preserva resultados se ela estiver inválida", async () => {
  const { env, documents, key, hash } = await fixture();
  const extra = {
    schema_version: 1,
    snapshot_id: "live-one",
    election: "6258",
    items: [],
  };
  const history = { ...extra, points: [] };
  const municipalBody = JSON.stringify(extra),
    historyBody = JSON.stringify(history);
  const municipalHash = await digest(municipalBody),
    historyHash = await digest(historyBody);
  documents.set(
    `live/6258/municipalities/${municipalHash}.json`,
    municipalBody,
  );
  documents.set(`live/6258/history/${historyHash}.json`, historyBody);
  documents.set(
    "live/6258/latest.json",
    JSON.stringify({
      schema_version: 1,
      snapshot_id: "live-one",
      key,
      sha256: hash,
      municipalities: {
        key: `live/6258/municipalities/${municipalHash}.json`,
        sha256: municipalHash,
      },
      history: {
        key: `live/6258/history/${historyHash}.json`,
        sha256: historyHash,
      },
    }),
  );
  const health = {
    schema_version: 1,
    election: "6258",
    checked_at: new Date().toISOString(),
    last_success_at: null,
    status: "awaiting",
    cycle_seconds: 1,
    pending_units: 0,
  };
  documents.set("live/6258/health.json", JSON.stringify(health));
  const response = await worker.fetch(request("/api/manifest"), env);
  expect(((await response.json()) as { health: unknown }).health).toEqual(
    health,
  );
  expect(response.headers.get("Cache-Control")).toContain("s-maxage=10");
  documents.set("live/6258/health.json", "{invalido");
  const preserved = await worker.fetch(request("/api/manifest"), env);
  expect(preserved.status).toBe(200);
  expect(((await preserved.json()) as { health: unknown }).health).toBeNull();
});
