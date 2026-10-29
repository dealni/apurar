import type {
  SupplementalPayload,
  SupplementalResult,
} from "./supplemental-data";
export interface GovernorPlace {
  id: string | number;
  uf: string;
  name: string;
}
export function governorMunicipalities(
  payload: SupplementalPayload | null,
  places: GovernorPlace[],
) {
  const official = new Map(
    (payload?.governor_municipalities ?? []).map((item) => [
      item.uf + ":" + String(item.ibge_code),
      item,
    ]),
  );
  return places.map((place) => ({
    place,
    result: official.get(place.uf + ":" + String(place.id)) ?? null,
  }));
}
export function governorColor(
  item: SupplementalResult | null,
  statewide: SupplementalResult | null,
) {
  if (
    !item ||
    item.stale ||
    item.status !== "available" ||
    !item.sections.counted ||
    item.candidates.some((candidate) => candidate.votes === null)
  )
    return "#aeb8bd";
  const ranked = item.candidates
    .filter((candidate) => candidate.votes !== null)
    .slice()
    .sort((a, b) => (b.votes ?? 0) - (a.votes ?? 0));
  const leader = ranked[0];
  if (!leader?.votes || leader.votes === ranked[1]?.votes) return "#aeb8bd";
  const palette = statewide?.candidates.length
    ? statewide.candidates
    : item.candidates;
  const candidates = palette
    .map((candidate) => candidate.id)
    .slice()
    .sort();
  const index = candidates.indexOf(leader.id);
  return index < 0 ? "#aeb8bd" : ["#297da8", "#ce7843"][index % 2]!;
}
