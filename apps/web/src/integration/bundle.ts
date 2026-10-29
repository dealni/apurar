import {
  parseHealth,
  type CollectorHealth,
} from "../../../../packages/contracts/health";
import {
  parseSnapshot,
  type Snapshot,
} from "../../../../packages/contracts/snapshot";
import { validatePublication } from "./publication";

type RequestJson = (path: string) => Promise<unknown>;
function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new Error("Manifesto inválido.");
  return value as Record<string, unknown>;
}
function version(value: unknown, expected: string) {
  if (record(value).snapshot_id !== expected)
    throw new Error("Dados complementares aguardam sincronização.");
  return value;
}
export async function requestBundle(
  request: RequestJson,
  previous?: Snapshot | null,
  cached?: Awaited<ReturnType<typeof loadObjects>> | null,
) {
  const manifest = record(await request("/api/manifest"));
  if (manifest.schema_version !== 1 || typeof manifest.snapshot_id !== "string")
    throw new Error("Manifesto inválido.");
  const paths = ["snapshots", "municipalities", "history"].map((kind) => {
    const path = manifest[kind];
    if (
      typeof path !== "string" ||
      !new RegExp(`^/api/${kind}/[a-f0-9]{64}$`).test(path)
    )
      throw new Error("Referência imutável inválida.");
    return path;
  });
  let health: CollectorHealth | null = null;
  try {
    if (manifest.health) health = parseHealth(manifest.health);
  } catch {
    /* Votos continuam disponíveis. */
  }
  if (
    cached &&
    cached.snapshot.snapshot_id === manifest.snapshot_id &&
    paths.every((path, index) => path === cached.paths[index])
  ) {
    // A mesma geração também precisa continuar válida após ajuste do relógio.
    parseSnapshot(cached.snapshot);
    return { ...cached, health };
  }
  return loadObjects(request, paths, manifest.snapshot_id, previous, health);
}
async function loadObjects(
  request: RequestJson,
  paths: string[],
  id: string,
  previous?: Snapshot | null,
  health: CollectorHealth | null = null,
) {
  const values = await Promise.all(paths.map(request));
  const snapshot = parseSnapshot(version(values[0], id));
  if (snapshot.mode !== "live")
    throw new Error("Feed ao vivo recusou dados de demonstração.");
  validatePublication(snapshot, previous);
  return {
    paths,
    health,
    snapshot,
    municipalities: version(values[1], snapshot.snapshot_id),
    history: version(values[2], snapshot.snapshot_id),
  };
}
