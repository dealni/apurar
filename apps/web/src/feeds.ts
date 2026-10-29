import {
  parseSnapshot,
  type Snapshot,
} from "../../../packages/contracts/snapshot";

import {
  validateMunicipality,
  type Municipality,
} from "../../../packages/contracts/municipality";
export type { Municipality } from "../../../packages/contracts/municipality";
export interface HistoryPoint {
  snapshot_id: string;
  as_of: string;
  sections: { counted: number; total: number };
  candidates: { id: string; votes: number; validity?: string }[];
  projection?: Snapshot["projection"];
}
function auxiliary(input: unknown, key: "items" | "points"): unknown[] {
  if (!input || typeof input !== "object")
    throw new Error("Feed complementar inválido.");
  const value = input as Record<string, unknown>;
  if (
    value.schema_version !== 1 ||
    value.election !== "6258" ||
    !Array.isArray(value[key])
  )
    throw new Error("Feed complementar incompatível.");
  return value[key] as unknown[];
}
function validCounts(value: unknown): boolean {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 0;
}
function validRow(input: unknown): boolean {
  if (!input || typeof input !== "object") return false;
  const row = input as Municipality;
  return (
    !!row.sections &&
    validCounts(row.sections.counted) &&
    validCounts(row.sections.total) &&
    (row.sections.counted ?? 0) <= (row.sections.total ?? 0) &&
    Array.isArray(row.candidates) &&
    row.candidates.every(
      (c) =>
        !!c &&
        typeof c === "object" &&
        typeof c.id === "string" &&
        validCounts(c.votes) &&
        (c.validity === undefined || typeof c.validity === "string"),
    ) &&
    typeof row.as_of === "string" &&
    Number.isFinite(Date.parse(row.as_of))
  );
}
export function parseMunicipalities(
  input: unknown,
  snapshot?: Snapshot,
): Municipality[] {
  const rows = auxiliary(input, "items");
  for (const row of rows) validateMunicipality(row);
  if (
    snapshot &&
    rows.some(
      (row) =>
        (row as Municipality).available &&
        !matchingCandidates((row as Municipality).candidates, snapshot),
    )
  )
    throw new Error("Candidatos municipais incompatíveis.");
  return rows as Municipality[];
}
function matchingCandidates(
  candidates: { id: string; votes: number }[],
  snapshot: Snapshot,
): boolean {
  return (
    candidates.length === 2 &&
    new Set(candidates.map((c) => c.id)).size === 2 &&
    snapshot.candidates.every((c) =>
      candidates.some((item) => item.id === c.id),
    )
  );
}
export function parseHistory(
  input: unknown,
  snapshot?: Snapshot,
): HistoryPoint[] {
  const rows = auxiliary(input, "points");
  if (
    !rows.every(
      (row) =>
        validRow(row) && typeof (row as HistoryPoint).snapshot_id === "string",
    )
  )
    throw new Error("Histórico inválido.");
  if (snapshot)
    for (const point of rows as HistoryPoint[]) {
      if (!matchingCandidates(point.candidates, snapshot))
        throw new Error("Candidatos históricos incompatíveis.");
      // Cada observação tem seus próprios votos e destinações; o histórico não
      // publica totais oficiais e nunca deve herdar os totais do lote atual.
      parseSnapshot({
        ...snapshot,
        source: { ...snapshot.source, as_of: point.as_of },
        sections: point.sections,
        candidates: snapshot.candidates.map((identity) => {
          const observed = point.candidates.find(
            (candidate) => candidate.id === identity.id,
          )!;
          return { ...identity, ...observed, validity: observed.validity };
        }),
        totals: undefined,
        projection: point.projection ?? {
          available: false,
          model: "none",
          reason: "Sem projeção histórica.",
          shares: null,
        },
      });
    }
  return (rows as HistoryPoint[]).sort(
    (a, b) => Date.parse(a.as_of) - Date.parse(b.as_of),
  );
}
