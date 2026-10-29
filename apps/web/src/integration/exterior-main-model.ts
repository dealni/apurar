import type {
  SupplementalPayload,
  SupplementalResult,
} from "./supplemental-data";
import { officialExterior } from "./exterior-view";

export interface ExteriorMainPlace {
  cd: string | number;
  iso: string;
  name: string;
}
export interface ExteriorMainModel {
  cities: (SupplementalResult | null)[];
  countries: Record<string, SupplementalResult>;
  candidateIds: string[];
  candidates: { id: string; name: string; party: string; color: string }[];
  zz: Float32Array;
  catalogError: string | null;
}
function valid(row: SupplementalResult) {
  return (
    row.office === "president" && row.election === "6258" && row.uf === "ZZ"
  );
}
function exteriorCandidates(
  rows: SupplementalResult[],
  preferredIds: string[],
) {
  const byId = new Map<string, { id: string; name: string; party: string }>();
  for (const row of rows) {
    for (const candidate of row.candidates) {
      if (!byId.has(candidate.id))
        byId.set(candidate.id, {
          id: candidate.id,
          name: candidate.name,
          party: candidate.party,
        });
    }
  }
  const ids = [...byId.keys()].sort((a, b) =>
    a.localeCompare(b, "pt-BR", { numeric: true }),
  );
  const orderedIds =
    preferredIds.length === ids.length &&
    new Set(preferredIds).size === ids.length &&
    preferredIds.every((id) => byId.has(id))
      ? preferredIds
      : ids;
  return orderedIds.map((id, index) => ({
    ...byId.get(id)!,
    color: ids.length === 2 ? ["#e7ad78", "#8db9d9"][index]! : "#aeb8bd",
  }));
}
/** O total nacional presidencial nunca participa do recorte exterior. */
export function createExteriorMainModel(
  payload: SupplementalPayload | null,
  places: ExteriorMainPlace[],
  preferredIds: string[] = [],
): ExteriorMainModel {
  const cityRows = new Map<string, SupplementalResult | null>();
  for (const row of payload?.exterior.cities ?? []) {
    if (!valid(row) || !row.tse_code) continue;
    const key = String(row.tse_code).padStart(5, "0");
    cityRows.set(key, cityRows.has(key) ? null : row);
  }
  const cities = places.map((place) => {
    const row = cityRows.get(String(place.cd).padStart(5, "0"));
    return row?.country_code === place.iso ? row : null;
  });
  const countries: Record<string, SupplementalResult> = {};
  const duplicateCountries = new Set<string>();
  for (const row of payload?.exterior.countries ?? []) {
    if (!valid(row) || !row.country_code) continue;
    if (countries[row.country_code]) duplicateCountries.add(row.country_code);
    countries[row.country_code] = row;
  }
  for (const key of duplicateCountries) delete countries[key];
  const candidates = exteriorCandidates(
    [
      ...cities.filter((row): row is SupplementalResult => row !== null),
      ...Object.values(countries),
    ],
    preferredIds,
  );
  const candidateIds = candidates.map((candidate) => candidate.id);
  const safePayload = payload
    ? {
        ...payload,
        exterior: {
          ...payload.exterior,
          cities: cities.filter(
            (row): row is SupplementalResult => row !== null,
          ),
        },
      }
    : null;
  const { zz } = officialExterior(
    { zz: new Float32Array(places.length * 4) },
    safePayload,
    places,
    candidateIds,
  );
  return {
    cities,
    countries,
    candidateIds,
    candidates,
    zz,
    catalogError: payload?.coverage.catalog_error ?? null,
  };
}
