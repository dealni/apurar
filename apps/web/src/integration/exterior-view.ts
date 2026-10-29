import type {
  SupplementalPayload,
  SupplementalResult,
} from "../../../../packages/contracts/supplemental";
export interface ExteriorPlace {
  cd: string | number;
}
// Dados cartográficos nunca fornecem votos: a identidade é o código TSE da cidade.
export function officialExterior<T extends { zz: Float32Array }>(
  view: T,
  payload: SupplementalPayload | null,
  places: ExteriorPlace[],
  candidateIds: string[],
): T {
  if (!payload) return { ...view, zz: new Float32Array(places.length * 4) };
  const validCandidates =
    candidateIds.length === 2 && new Set(candidateIds).size === 2;
  const rows = new Map<string, SupplementalResult | null>();
  for (const row of payload.exterior.cities) {
    if (
      row.office !== "president" ||
      row.election !== "6258" ||
      row.uf !== "ZZ" ||
      (row.kind !== undefined && row.kind !== "city") ||
      !row.tse_code
    )
      continue;
    const key = String(row.tse_code).padStart(5, "0");
    rows.set(key, rows.has(key) ? null : row);
  }
  const zz = new Float32Array(places.length * 4);
  places.forEach((place, index) => {
    const row = rows.get(String(place.cd).padStart(5, "0"));
    if (!validCandidates || row?.status !== "available" || row.stale) return;
    if (
      row.candidates.length !== candidateIds.length ||
      !candidateIds.every((id) =>
        row.candidates.some(
          (candidate) => candidate.id === id && candidate.votes !== null,
        ),
      )
    )
      return;
    const votes = candidateIds.map(
      (id) =>
        row.candidates.find((candidate) => candidate.id === id)?.votes ?? 0,
    );
    const total = votes.reduce((sum, vote) => sum + vote, 0);
    const leader = votes[1]! > votes[0]! ? 1 : 0;
    const sections = row.sections.total;
    zz.set(
      [
        sections ? (row.sections.counted ?? 0) / sections : 0,
        leader,
        total ? Math.abs(votes[0]! - votes[1]!) / total : 0,
        total,
      ],
      index * 4,
    );
  });
  return { ...view, zz };
}
