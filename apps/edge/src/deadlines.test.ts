import { afterEach, expect, it, vi } from "vitest";
import {
  cacheReadTimeoutMs,
  cacheWriteTimeoutMs,
  feedLoadTimeoutMs,
  healthLoadTimeoutMs,
  LoadDeadlineExceeded,
  withDeadline,
} from "./deadline";
import worker from "./worker";
import { digest } from "./storage";
import { supplementalFixture } from "../../../packages/contracts/supplemental-fixture";

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (cause: Error) => void;
  const promise = new Promise<T>((done, fail) => {
    resolve = done;
    reject = fail;
  });
  return { promise, resolve, reject };
}
async function fixture() {
  const bytes = JSON.stringify(supplementalFixture());
  const hash = await digest(bytes);
  const pointer = JSON.stringify({
    schema_version: 1,
    key: `live/6258/supplemental/${hash}.json`,
    sha256: hash,
  });
  const object = (key: string) => ({
    text: async () => (key.endsWith("latest.json") ? pointer : bytes),
  });
  const get = vi.fn(async (key: string) => object(key));
  return {
    bytes,
    object,
    get,
    env: {
      SNAPSHOTS: { get },
      ASSETS: { fetch: async () => new Response("asset") },
    },
  };
}
const request = () => new Request("https://apurar.test/api/supplemental");
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

it("cada prazo expira sua operação e trata rejeições posteriores", async () => {
  vi.useFakeTimers();
  const old = deferred<string>();
  let signal!: AbortSignal;
  const first = withDeadline((selected) => {
    signal = selected;
    return old.promise;
  }, 100);
  const expired = expect(first).rejects.toBeInstanceOf(LoadDeadlineExceeded);
  await vi.advanceTimersByTimeAsync(100);
  await expired;
  expect(signal.aborted).toBe(true);
  await expect(withDeadline(async () => "novo", 100)).resolves.toBe("novo");
  old.reject(new Error("falha tardia"));
  await vi.advanceTimersByTimeAsync(0);
  expect(vi.getTimerCount()).toBe(0);
});

it("prazo libera timers após exceção síncrona e rejeição", async () => {
  vi.useFakeTimers();
  await expect(
    withDeadline(() => {
      throw new Error("síncrona");
    }, 100),
  ).rejects.toThrow("síncrona");
  await expect(
    withDeadline(async () => {
      throw new Error("assíncrona");
    }, 100),
  ).rejects.toThrow("assíncrona");
  expect(vi.getTimerCount()).toBe(0);
});

it.each([false, true])(
  "consulta nova independe de R2 pendurado e cliente cancelado=%s",
  async (cancel) => {
    const { env, get, bytes } = await fixture();
    const stalled = deferred<Awaited<ReturnType<typeof get>>>();
    get.mockImplementationOnce(() => stalled.promise);
    vi.useFakeTimers();
    const controller = new AbortController();
    const first = worker.fetch(
      new Request(request(), { signal: controller.signal }),
      env,
    );
    await vi.advanceTimersByTimeAsync(0);
    expect(get).toHaveBeenCalledOnce();
    if (cancel) controller.abort();
    const second = await worker.fetch(request(), env);
    expect(second.status).toBe(200);
    expect(await second.text()).toBe(bytes);
    expect(get).toHaveBeenCalledTimes(3);
    // Vitest não encerra IoContext ao abortar; o runtime real pode eliminar esse timer.
    // A nova chamada já terminou antes desse prazo, sem depender do contexto anterior.
    await vi.advanceTimersByTimeAsync(feedLoadTimeoutMs);
    expect((await first).status).toBe(503);
    stalled.reject(new Error("R2 antigo encerrou"));
    await vi.advanceTimersByTimeAsync(0);
    expect(vi.getTimerCount()).toBe(0);
  },
);

it("cache.match travado usa o R2 após o orçamento curto", async () => {
  const { env, bytes, get } = await fixture();
  vi.useFakeTimers();
  const cache = deferred<Response | undefined>();
  vi.stubGlobal("caches", {
    default: { match: () => cache.promise, put: async () => undefined },
  });
  const response = worker.fetch(request(), env);
  await vi.advanceTimersByTimeAsync(cacheReadTimeoutMs - 1);
  expect(get).not.toHaveBeenCalled();
  await vi.advanceTimersByTimeAsync(1);
  expect(await (await response).text()).toBe(bytes);
  expect(get).toHaveBeenCalledTimes(2);
  // O cache tardio não substitui o conteúdo íntegro lido pelo R2.
  cache.resolve(new Response("cache antigo"));
  await vi.advanceTimersByTimeAsync(0);
  expect(vi.getTimerCount()).toBe(0);
});

it.each(["get", "text"])(
  "R2 %s travado retorna 503 sem cache e permite recuperar",
  async (stage) => {
    const { env, get, object, bytes } = await fixture();
    const gate = deferred<ReturnType<typeof object>>();
    const text = deferred<string>();
    if (stage === "get") get.mockImplementationOnce(() => gate.promise);
    else get.mockResolvedValueOnce({ text: () => text.promise });
    vi.useFakeTimers();
    const put = vi.fn(async () => undefined);
    vi.stubGlobal("caches", {
      default: { match: async () => undefined, put },
    });
    const pending = worker.fetch(request(), env);
    await vi.advanceTimersByTimeAsync(feedLoadTimeoutMs);
    const failed = await pending;
    expect(failed.status).toBe(503);
    expect(failed.headers.get("Cache-Control")).toBe("no-store");
    expect(get).toHaveBeenCalledOnce();
    expect(put).not.toHaveBeenCalled();
    const recovered = await worker.fetch(request(), env);
    expect(recovered.status).toBe(200);
    expect(await recovered.text()).toBe(bytes);
    expect(put).toHaveBeenCalledOnce();
    // A primeira leitura pode terminar, mas seu prazo impede escrita atrasada.
    gate.resolve(object("live/6258/supplemental/latest.json"));
    text.resolve(await object("live/6258/supplemental/latest.json").text());
    await vi.advanceTimersByTimeAsync(0);
    expect(get).toHaveBeenCalledTimes(3);
    expect(put).toHaveBeenCalledOnce();
    expect(vi.getTimerCount()).toBe(0);
  },
);

it.each(["get", "text"])(
  "saúde opcional com %s travado preserva manifesto e encerra sua leitura tardia",
  async (stage) => {
    const hash = "a".repeat(64);
    const reference = (kind: string) => ({
      key: `live/6258/${kind}/${hash}.json`,
      sha256: hash,
    });
    const pointer = JSON.stringify({
      schema_version: 1,
      snapshot_id: "preservado",
      ...reference("snapshots"),
      history: reference("history"),
      municipalities: reference("municipalities"),
    });
    const text = vi.fn(async () => "{}");
    const gate = deferred<{ text(): Promise<string> }>();
    const body = deferred<string>();
    const get = vi.fn(async (key: string) => {
      if (key.endsWith("health.json"))
        return stage === "get" ? gate.promise : { text: () => body.promise };
      return { text: async () => pointer };
    });
    vi.useFakeTimers();
    const response = worker.fetch(
      new Request("https://apurar.test/api/manifest"),
      { SNAPSHOTS: { get }, ASSETS: { fetch: async () => new Response() } },
    );
    await vi.advanceTimersByTimeAsync(healthLoadTimeoutMs);
    const preserved = await response;
    expect(preserved.status).toBe(200);
    expect(await preserved.json()).toMatchObject({
      snapshot_id: "preservado",
      health: null,
      snapshots: `/api/snapshots/${hash}`,
    });
    gate.resolve({ text });
    body.resolve("{}");
    await vi.advanceTimersByTimeAsync(0);
    expect(text).not.toHaveBeenCalled();
    expect(get).toHaveBeenCalledTimes(2);
    expect(vi.getTimerCount()).toBe(0);
  },
);

it("cache.put travado não atrasa feed nem deixa waitUntil pendente indefinidamente", async () => {
  const { env, bytes } = await fixture();
  vi.useFakeTimers();
  const write = deferred<void>();
  const background: Promise<unknown>[] = [];
  vi.stubGlobal("caches", {
    default: { match: async () => undefined, put: () => write.promise },
  });
  const response = await worker.fetch(request(), env, {
    waitUntil: (promise) => background.push(promise),
  });
  expect(await response.text()).toBe(bytes);
  expect(background).toHaveLength(1);
  await vi.advanceTimersByTimeAsync(cacheWriteTimeoutMs);
  await expect(background[0]).resolves.toBeUndefined();
  write.reject(new Error("cache falhou depois do prazo"));
  await vi.advanceTimersByTimeAsync(0);
  expect(vi.getTimerCount()).toBe(0);
});
