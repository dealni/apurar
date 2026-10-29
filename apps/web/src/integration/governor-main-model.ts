import { resultRow, type Place } from "./adapter";
import { governorColor } from "./governor-map";
import {
  resultStatus,
  type SupplementalPayload,
  type SupplementalResult,
} from "./supplemental-data";

export const GOVERNOR_STATES = ["AC", "AM", "DF", "ES", "RN", "TO"] as const;
const neutral = "#aeb8bd";
export interface GovernorMainCandidate {
  id: string;
  n: number;
  name: string;
  short: string;
  partido: string;
  sq: string;
  g: string;
  validity: string;
  k: number;
  color: string;
  votes: number | null;
  share: number | null;
}
export interface GovernorMainPlace {
  inRace: boolean;
  result: SupplementalResult | null;
  row: ReturnType<typeof resultRow> | null;
  candidates: GovernorMainCandidate[];
  available: boolean;
  color: string;
  asOf: string | null;
  status: string;
}
export interface GovernorMainModel {
  states: Record<string, GovernorMainPlace>;
  municipalities: GovernorMainPlace[];
  races: Record<string, GovernorMainCandidate[]>;
  catalogAvailable: boolean;
}
function uniqueIndex(
  rows: SupplementalResult[],
  key: (row: SupplementalResult) => string,
) {
  const indexed = new Map<string, SupplementalResult | null>();
  for (const row of rows) {
    const id = key(row);
    indexed.set(id, indexed.has(id) ? null : row);
  }
  return indexed;
}
function validGovernor(row: SupplementalResult) {
  return (
    row.office === "governor" &&
    row.election === "6260" &&
    GOVERNOR_STATES.includes(row.uf as (typeof GOVERNOR_STATES)[number])
  );
}
function metadata(rows: SupplementalResult[]) {
  const candidates = new Map<
    string,
    SupplementalResult["candidates"][number]
  >();
  for (const row of rows)
    for (const candidate of row.candidates) {
      if (!candidates.has(candidate.id))
        candidates.set(candidate.id, candidate);
    }
  return [...candidates.values()].sort((a, b) => a.id.localeCompare(b.id));
}
function resultAvailable(
  result: SupplementalResult | null,
  palette: SupplementalResult["candidates"],
  catalogAvailable: boolean,
): result is SupplementalResult {
  return (
    catalogAvailable &&
    !!result &&
    result.status === "available" &&
    !result.stale &&
    !!result.as_of &&
    result.sections.counted !== null &&
    result.sections.total !== null &&
    palette.length === 2 &&
    result.candidates.length === palette.length &&
    palette.every((candidate) =>
      result.candidates.some((value) => value.id === candidate.id),
    ) &&
    result.candidates.every((candidate) => candidate.votes !== null) &&
    new Set(result.candidates.map((candidate) => candidate.id)).size ===
      result.candidates.length
  );
}
function placeModel(
  result: SupplementalResult | null,
  uf: string,
  palette: SupplementalResult["candidates"],
  catalogAvailable: boolean,
): GovernorMainPlace {
  const inRace = GOVERNOR_STATES.includes(
    uf as (typeof GOVERNOR_STATES)[number],
  );
  const available = resultAvailable(result, palette, catalogAvailable);
  const observed = new Map(
    result?.candidates.map((candidate) => [candidate.id, candidate]) ?? [],
  );
  const total = available
    ? result.candidates.reduce((sum, candidate) => sum + candidate.votes!, 0)
    : null;
  const candidates = palette.map((candidate, k) => {
    const value = observed.get(candidate.id);
    const votes = available ? (value?.votes ?? null) : null;
    return {
      id: `g${uf}-${candidate.id}`,
      n: Number(candidate.id),
      name: candidate.name,
      short: candidate.name,
      partido: candidate.party,
      sq: "",
      g: "",
      validity: value?.validity ?? candidate.validity,
      k,
      color: ["#297da8", "#ce7843"][k % 2]!,
      votes,
      share: votes !== null && total ? votes / total : null,
    };
  });
  const row = available
    ? resultRow(
        { counted: result.sections.counted!, total: result.sections.total },
        candidates.map((candidate) => candidate.votes!),
        uf,
        result.name,
        result.totals,
      )
    : null;
  return {
    inRace,
    result,
    row,
    candidates,
    available,
    color: available
      ? governorColor(result, { ...result, candidates: palette })
      : neutral,
    asOf: result?.as_of ?? null,
    status: result
      ? resultStatus(result)
      : !inRace && catalogAvailable
        ? "Sem disputa de governador neste segundo turno"
        : "Aguardando publicação oficial de governador",
  };
}
/** Projeta apenas a estrutura visual; nunca estima votos nem usa o feed presidencial. */
export function createGovernorMainModel(
  payload: SupplementalPayload | null,
  places: Place[],
  states: string[],
): GovernorMainModel {
  const governors = (payload?.governors ?? []).filter((row) =>
    validGovernor(row),
  );
  const municipalities = (payload?.governor_municipalities ?? []).filter(
    (row) => validGovernor(row),
  );
  const byState = uniqueIndex(governors, (row) => row.uf);
  const byMunicipality = uniqueIndex(
    municipalities,
    (row) => `${row.uf}:${row.ibge_code}`,
  );
  const palettes = new Map(
    states.map((uf) => {
      const statewide = byState.get(uf);
      return [
        uf,
        metadata(
          statewide?.candidates.length
            ? [statewide]
            : municipalities.filter((row) => row.uf === uf),
        ),
      ];
    }),
  );
  const catalogAvailable = !!payload && !payload.coverage.catalog_error;
  const stateModels = Object.fromEntries(
    states.map((uf) => [
      uf,
      placeModel(
        byState.get(uf) ?? null,
        uf,
        palettes.get(uf) ?? [],
        catalogAvailable,
      ),
    ]),
  );
  return {
    states: stateModels,
    municipalities: places.map((place) =>
      placeModel(
        byMunicipality.get(`${place.uf}:${place.id}`) ?? null,
        place.uf,
        palettes.get(place.uf) ?? [],
        catalogAvailable,
      ),
    ),
    races: Object.fromEntries(
      states.map((uf) => [uf, stateModels[uf]!.candidates]),
    ),
    catalogAvailable,
  };
}
/** Adiciona o cargo preservando identidade e valores do modelo presidencial. */
export function applyGovernorMainModel<T extends object>(
  base: T,
  payload: SupplementalPayload | null,
  places: Place[],
  states: string[],
) {
  return {
    ...base,
    governor: createGovernorMainModel(payload, places, states),
  };
}
