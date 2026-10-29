import type { SupplementalResult } from "./supplemental-data";
export interface OfficialDetailRequest {
  tab: "governors" | "governorCities" | "countries" | "cities";
  query?: string;
  id?: string;
  election?: string;
  uf?: string;
  ibgeCode?: string;
  municipality_id?: string;
  label?: string;
}
export const officialDetailEvent = "apurar:official-detail";
export function openSupplementalDetail(request: OfficialDetailRequest) {
  window.dispatchEvent(
    new CustomEvent(officialDetailEvent, { detail: request }),
  );
}
export function matchesOfficialDetail(
  item: SupplementalResult,
  request: OfficialDetailRequest | null,
) {
  if (!request) return true;
  return [
    request.id === undefined || item.id === request.id,
    request.election === undefined || item.election === request.election,
    request.uf === undefined || item.uf === request.uf,
    request.ibgeCode === undefined ||
      String(item.ibge_code) === request.ibgeCode,
    request.municipality_id === undefined ||
      item.municipality_id === request.municipality_id,
  ].every(Boolean);
}
