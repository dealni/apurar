import { parseHealth } from "../../../packages/contracts/health";
import { validateCollection } from "./collections";
import { parseSnapshot } from "../../../packages/contracts/snapshot";
import { healthLoadTimeoutMs, withDeadline } from "./deadline";

interface ObjectBody {
  size?: number;
  text(): Promise<string>;
}
export interface Environment {
  SNAPSHOTS: { get(key: string): Promise<ObjectBody | null> };
  ASSETS: { fetch(request: Request): Promise<Response> };
}
const prefix = "live/6258/";
const maximumBytes = 16 * 1024 * 1024;
export class FeedUnavailable extends Error {}
export async function readJson(
  env: Environment,
  key: string,
  signal?: AbortSignal,
): Promise<string> {
  signal?.throwIfAborted();
  const object = await env.SNAPSHOTS.get(key);
  signal?.throwIfAborted();
  if (!object) throw new FeedUnavailable("Objeto ausente.");
  if (object.size !== undefined && object.size > maximumBytes)
    throw new Error("Objeto excede limite.");
  const bytes = await object.text();
  signal?.throwIfAborted();
  if (new TextEncoder().encode(bytes).length > maximumBytes)
    throw new Error("Objeto excede limite.");
  return bytes;
}
export async function digest(bytes: string): Promise<string> {
  const hash = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(bytes),
  );
  return [...new Uint8Array(hash)]
    .map((value) => value.toString(16).padStart(2, "0"))
    .join("");
}
function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new Error("Objeto inválido.");
  return value as Record<string, unknown>;
}
function validateFeed(bytes: string, kind: string): void {
  const data: unknown = JSON.parse(bytes);
  if (kind === "snapshots") {
    if (parseSnapshot(data).mode !== "live") throw new Error("Modo inválido.");
    return;
  }
  validateCollection(data, kind);
}
export async function loadFeed(
  env: Environment,
  kind: string,
  immutableHash?: string,
  signal?: AbortSignal,
): Promise<{ bytes: string; hash: string }> {
  let key: string;
  if (immutableHash) key = `${prefix}${kind}/${immutableHash}.json`;
  else {
    const manifest = record(
      JSON.parse(await readJson(env, `${prefix}latest.json`, signal)),
    );
    if (kind !== "snapshots" && manifest[kind] === undefined)
      throw new FeedUnavailable("Feed ausente.");
    const reference = kind === "snapshots" ? manifest : record(manifest[kind]);
    if (
      typeof reference.key !== "string" ||
      typeof reference.sha256 !== "string" ||
      !/^[a-f0-9]{64}$/.test(reference.sha256) ||
      reference.key !== `${prefix}${kind}/${reference.sha256}.json`
    )
      throw new Error("Referência inválida.");
    key = reference.key;
  }
  if (!new RegExp(`^${prefix}${kind}/[a-f0-9]{64}\\.json$`).test(key))
    throw new Error("Chave inválida.");
  const bytes = await readJson(env, key, signal);
  const hash = await digest(bytes);
  if (!key.endsWith(`/${hash}.json`)) throw new Error("Hash inválido.");
  validateFeed(bytes, kind);
  return { bytes, hash };
}

// O ponteiro é lido uma vez; os três objetos permanecem endereçados pelo conteúdo.
export async function loadManifest(env: Environment, signal?: AbortSignal) {
  const value = record(
    JSON.parse(await readJson(env, `${prefix}latest.json`, signal)),
  );
  if (
    value.schema_version !== 1 ||
    typeof value.snapshot_id !== "string" ||
    !/^[a-zA-Z0-9_-]{1,100}$/.test(value.snapshot_id)
  )
    throw new Error("Manifesto inválido.");
  const urls: Record<string, string> = {};
  for (const kind of ["snapshots", "municipalities", "history"]) {
    const ref = kind === "snapshots" ? value : record(value[kind]);
    const hash = ref.sha256;
    if (
      typeof hash !== "string" ||
      !/^[a-f0-9]{64}$/.test(hash) ||
      ref.key !== `${prefix}${kind}/${hash}.json`
    )
      throw new Error("Referência inválida.");
    urls[kind] = `/api/${kind}/${hash}`;
  }
  let health = null;
  try {
    health = await withDeadline(
      async (healthSignal) =>
        parseHealth(
          JSON.parse(
            await readJson(
              env,
              `${prefix}health.json`,
              signal ? AbortSignal.any([signal, healthSignal]) : healthSignal,
            ),
          ),
        ),
      healthLoadTimeoutMs,
    );
  } catch {
    // Saúde ausente ou inválida não bloqueia os votos oficiais.
  }
  const bytes = JSON.stringify({
    schema_version: 1,
    snapshot_id: value.snapshot_id,
    ...urls,
    health,
  });
  return { bytes, hash: await digest(bytes) };
}
