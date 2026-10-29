import { parseArchive } from "../../../packages/contracts/archive";
import { digest, readJson, type Environment } from "./storage";

const hashPattern = /^[a-f0-9]{64}$/u;

function archiveHash(value: unknown): string {
  if (typeof value !== "string" || !hashPattern.test(value))
    throw new Error("Hash histórico inválido.");
  return value;
}

export async function loadArchive(
  env: Environment,
  immutableHash?: string,
  signal?: AbortSignal,
) {
  let hash: string;
  if (immutableHash !== undefined) hash = archiveHash(immutableHash);
  else {
    const pointer: unknown = JSON.parse(
      await readJson(env, "live/6258/archive-latest.json", signal),
    );
    if (
      !pointer ||
      typeof pointer !== "object" ||
      Array.isArray(pointer) ||
      !("schema_version" in pointer) ||
      pointer.schema_version !== 1 ||
      !("sha256" in pointer) ||
      !("key" in pointer)
    )
      throw new Error("Ponteiro histórico inválido.");
    hash = archiveHash(pointer.sha256);
    if (pointer.key !== `live/6258/archive/${hash}.json`)
      throw new Error("Ponteiro histórico inválido.");
  }
  const bytes = await readJson(env, `live/6258/archive/${hash}.json`, signal);
  if ((await digest(bytes)) !== hash) throw new Error("Arquivo divergente.");
  parseArchive(JSON.parse(bytes));
  return { bytes, hash };
}
