import { record, timestamp } from "./validation";
export interface ArchiveReference {
  key: string;
  sha256: string;
}
export interface ArchivePointer extends ArchiveReference {
  snapshot_id?: string;
  municipalities?: ArchiveReference;
  history?: ArchiveReference;
}
export interface ArchiveObservation {
  id: string;
  family: "core" | "supplemental";
  observed_at: string;
  source_as_of: string | null;
  pointer: ArchivePointer;
}
export interface ArchiveIndex {
  schema_version: 1;
  election: "6258";
  mode: "live";
  started_at: string;
  updated_at: string;
  total_observations: number;
  sampled: boolean;
  truncated: boolean;
  observations: ArchiveObservation[];
}
function reference(input: unknown, kind: string) {
  const value = record(input);
  if (
    typeof value.sha256 !== "string" ||
    !/^[a-f0-9]{64}$/.test(value.sha256) ||
    value.key !== `live/6258/${kind}/${value.sha256}.json`
  )
    throw new Error("Referência do arquivo inválida.");
}
function validateIndex(value: Record<string, unknown>) {
  if (
    value.schema_version !== 1 ||
    value.election !== "6258" ||
    value.mode !== "live" ||
    !Number.isSafeInteger(value.total_observations) ||
    Number(value.total_observations) < 1 ||
    typeof value.sampled !== "boolean" ||
    typeof value.truncated !== "boolean" ||
    !Array.isArray(value.observations) ||
    !value.observations.length ||
    value.observations.length > 500 ||
    value.observations.length > Number(value.total_observations)
  )
    throw new Error("Índice de arquivo incompatível.");
  timestamp(value.started_at);
  timestamp(value.updated_at);
}
function validateObservations(observations: unknown[]) {
  const ids = new Set<string>();
  for (const inputObservation of observations) {
    const observation = record(inputObservation);
    if (typeof observation.id !== "string" || ids.has(observation.id))
      throw new Error("Observação de arquivo inválida.");
    ids.add(observation.id);
    timestamp(observation.observed_at);
    if (observation.source_as_of !== null) timestamp(observation.source_as_of);
    const pointer = record(observation.pointer);
    if (observation.family === "core") {
      timestamp(observation.source_as_of);
      reference(pointer, "snapshots");
      reference(pointer.municipalities, "municipalities");
      reference(pointer.history, "history");
      if (typeof pointer.snapshot_id !== "string" || !pointer.snapshot_id)
        throw new Error("Identidade do arquivo inválida.");
    } else if (observation.family === "supplemental")
      reference(pointer, "supplemental");
    else throw new Error("Família de arquivo inválida.");
  }
}
export function parseArchive(input: unknown): ArchiveIndex {
  const value = record(input);
  validateIndex(value);
  const observations = value.observations as unknown[];
  validateObservations(observations);
  if (
    value.started_at !== record(observations[0]).observed_at ||
    value.updated_at !== record(observations.at(-1)).observed_at
  )
    throw new Error("Extremos temporais do arquivo incompatíveis.");
  if (
    value.sampled !== Number(value.total_observations) > observations.length ||
    value.truncated !== value.sampled
  )
    throw new Error("Amostragem de arquivo incompatível.");
  return value as unknown as ArchiveIndex;
}
