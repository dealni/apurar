import { parseSupplemental } from "../../../packages/contracts/supplemental";
import { digest, readJson, type Environment } from "./storage";

export async function loadSupplemental(
  env: Environment,
  immutableHash?: string,
  signal?: AbortSignal,
) {
  let hash = immutableHash;
  if (!hash) {
    const pointer = JSON.parse(
      await readJson(env, "live/6258/supplemental-latest.json", signal),
    );
    if (
      !pointer ||
      typeof pointer !== "object" ||
      Array.isArray(pointer) ||
      pointer.schema_version !== 1 ||
      typeof pointer.sha256 !== "string" ||
      pointer.key !== `live/6258/supplemental/${pointer.sha256}.json`
    )
      throw new Error("Ponteiro suplementar inválido.");
    hash = pointer.sha256;
  }
  if (!hash || !/^[a-f0-9]{64}$/u.test(hash))
    throw new Error("Hash suplementar inválido.");
  const bytes = await readJson(
    env,
    `live/6258/supplemental/${hash}.json`,
    signal,
  );
  if ((await digest(bytes)) !== hash) throw new Error("Suplemento divergente.");
  parseSupplemental(JSON.parse(bytes));
  return { bytes, hash };
}
