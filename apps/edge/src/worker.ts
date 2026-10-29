import { loadArchive } from "./archive";
import { fetchChat } from "./chat-route";
import type { ChatEnvironment } from "./chat-types";
export { ChatRoom } from "./chat-room";
import {
  cacheReadTimeoutMs,
  cacheWriteTimeoutMs,
  feedLoadTimeoutMs,
  withDeadline,
} from "./deadline";
import { loadSupplemental } from "./supplemental";
import {
  FeedUnavailable,
  loadFeed,
  loadManifest,
  type Environment,
} from "./storage";

import { timing } from "../../../packages/contracts/timing";

interface Context {
  waitUntil(promise: Promise<unknown>): void;
}
interface Route {
  kind: string;
  immutableHash?: string;
  attachment?: boolean;
}
const shortCache = `public, max-age=0, s-maxage=${timing.cacheSeconds}, must-revalidate`;
const immutableCache = "public, max-age=31536000, immutable";
function route(path: string): Route | null {
  if (path === "/api/archive") return { kind: "archive" };
  if (path === "/api/supplemental") return { kind: "supplemental" };
  if (path === "/api/manifest") return { kind: "manifest" };
  if (path === "/api/snapshot") return { kind: "snapshots" };
  if (path === "/api/export") return { kind: "snapshots", attachment: true };
  if (path === "/api/history") return { kind: "history" };
  if (path === "/api/municipalities") return { kind: "municipalities" };
  const match =
    /^\/api\/(snapshots|municipalities|history|supplemental|archive)\/([a-f0-9]{64})$/.exec(
      path,
    );
  return match?.[1] && match[2]
    ? { kind: match[1], immutableHash: match[2] }
    : null;
}
function error(code: string, status: number): Response {
  return Response.json(
    { error: code },
    {
      status,
      headers: {
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
      },
    },
  );
}
function conditional(response: Response, request: Request): Response {
  const tag = response.headers.get("ETag");
  const tags = request.headers
    .get("If-None-Match")
    ?.split(",")
    .map((value) => value.trim().replace(/^W\//, ""));
  if (
    response.ok &&
    tag &&
    tags?.some((value) => value === tag || value === "*")
  )
    return new Response(null, { status: 304, headers: response.headers });
  return request.method === "HEAD"
    ? new Response(null, { status: response.status, headers: response.headers })
    : response;
}
async function selectedFeed(
  env: Environment,
  selected: Route,
  signal: AbortSignal,
) {
  if (selected.kind === "archive")
    return loadArchive(env, selected.immutableHash, signal);
  if (selected.kind === "manifest") return loadManifest(env, signal);
  if (selected.kind === "supplemental")
    return loadSupplemental(env, selected.immutableHash, signal);
  return loadFeed(env, selected.kind, selected.immutableHash, signal);
}
function feedResponse(
  { bytes, hash }: { bytes: string; hash: string },
  selected: Route,
  cacheControl: string,
): Response {
  const headers = new Headers({
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": cacheControl,
    ETag: `"${hash}"`,
    "X-Content-Type-Options": "nosniff",
  });
  if (selected.attachment)
    headers.set(
      "Content-Disposition",
      `attachment; filename="apurar-6258-${hash}.json"`,
    );
  return new Response(bytes, { headers });
}
async function storeCached(cache: Cache, key: Request, response: Response) {
  try {
    await withDeadline(() => cache.put(key, response), cacheWriteTimeoutMs);
  } catch {
    /* Falha de cache não derruba o feed. */
  }
}
async function fetchFeed(
  request: Request,
  env: Environment,
  ctx?: Context,
): Promise<Response> {
  const url = new URL(request.url);
  const selected = route(url.pathname);
  if (!selected) return error("not_found", 404);
  // Canonicalizar queries evita fragmentar o cache público por parâmetros arbitrários.
  const cacheKey = new Request(`${url.origin}${url.pathname}`);
  const cache =
    typeof caches === "undefined"
      ? undefined
      : (caches as CacheStorage & { default: Cache }).default;
  let cached: Response | undefined;
  try {
    if (cache)
      cached = await withDeadline(
        () => cache.match(cacheKey),
        cacheReadTimeoutMs,
      );
  } catch {
    /* Falha de cache não derruba o feed. */
  }
  const cacheControl = selected.immutableHash ? immutableCache : shortCache;
  if (cached) {
    const headers = new Headers(cached.headers);
    headers.set("Cache-Control", cacheControl);
    return new Response(cached.body, { headers });
  }
  try {
    const result = await withDeadline(async (signal) => {
      const loaded = await selectedFeed(env, selected, signal);
      signal.throwIfAborted();
      if (cache) {
        const stored = feedResponse(loaded, selected, cacheControl);
        // Cache API usa max-age; s-maxage isolado não armazena no Worker.
        stored.headers.set(
          "Cache-Control",
          selected.immutableHash
            ? immutableCache
            : `public, max-age=${timing.cacheSeconds}`,
        );
        const write = storeCached(cache, cacheKey, stored);
        if (ctx) ctx.waitUntil(write);
      }
      return loaded;
    }, feedLoadTimeoutMs);
    // Cada consumidor recebe seu próprio body, inclusive GETs junto de HEAD/304.
    return feedResponse(result, selected, cacheControl);
  } catch (cause) {
    return error(
      cause instanceof FeedUnavailable
        ? "feed_unavailable"
        : "invalid_or_unavailable_snapshot",
      503,
    );
  }
}
export default {
  async fetch(
    request: Request,
    env: Environment & ChatEnvironment,
    ctx?: Context,
  ): Promise<Response> {
    const path = new URL(request.url).pathname;
    if (path === "/api/chat/socket") return fetchChat(request, env);
    if (path !== "/api" && !path.startsWith("/api/"))
      return env.ASSETS.fetch(request);
    if (request.method !== "GET" && request.method !== "HEAD")
      return new Response(null, {
        status: 405,
        headers: { Allow: "GET, HEAD", "Cache-Control": "no-store" },
      });
    return conditional(await fetchFeed(request, env, ctx), request);
  },
};
