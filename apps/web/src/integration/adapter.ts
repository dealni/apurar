import municipalityIds from "./municipality-ids.json";
import type { MunicipalTotals } from "../../../../packages/contracts/municipality";
import { participationBase, destinationWarning } from "./municipal-totals";
import type { Snapshot } from "../../../../packages/contracts/snapshot";
import type { Municipality, HistoryPoint } from "../feeds";

export type Place = { id: string | number; name: string; uf: string };
export type Candidate = {
  id: string;
  n: number;
  name: string;
  short: string;
  partido: string;
  sq: string;
  g: string;
  validity?: string;
};
export const electionStart = Date.parse("2026-10-25T00:00:00-03:00");
export const minuteOf = (time: number) => (time - electionStart) / 60000;
const ratio = (part: number, total: number | null) =>
  total ? part / total : 0;
export const placeKey = (uf: string, name: string) =>
  `${uf}:${name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]/g, "")
    .toUpperCase()}`;

type Totals = Partial<MunicipalTotals>;
export function resultRow(
  sections: { counted: number; total: number | null },
  votes: number[],
  uf: string,
  name: string,
  totals: Totals = {},
  available = true,
) {
  const valid = votes.reduce((sum, count) => sum + count, 0);
  return {
    uf,
    name,
    region: "",
    el: totals.electorate ?? null,
    sections: sections.total,
    secDone: sections.counted,
    elDone: participationBase(totals),
    abstention: totals.abstention ?? null,
    votes: totals.turnout ?? null,
    valid: totals.valid ?? null,
    base: valid,
    computed: totals.computed ?? valid,
    annulled: totals.annulled ?? null,
    subJudice: totals.sub_judice ?? null,
    totalVotes: totals.total ?? null,
    voteDestinationWarning: destinationWarning(totals, valid),
    blank: totals.blank ?? null,
    nul: totals.null ?? null,
    cand: votes,
    pst:
      sections.total == null ? null : ratio(sections.counted, sections.total),
    left: null,
    status: "apurando",
    definido: null,
    available,
    order: votes.map((_, index) => index).sort((a, b) => votes[b]! - votes[a]!),
    gov: [],
    sen: [],
    govStatus: null,
    senStatus: null,
  };
}
export function candidateMetadata(snapshot: Snapshot): Candidate[] {
  return snapshot.candidates.map((c) => ({
    id: `p${Number(c.id)}`,
    n: Number(c.id),
    name: c.name,
    short: c.name,
    partido: c.party,
    sq: "",
    g: "",
    ...(c.validity ? { validity: c.validity } : {}),
  }));
}
export function municipalIndex(rows: Municipality[], places: Place[]) {
  const unique = <T extends { uf: string; name: string }>(items: T[]) => {
    const map = new Map<string, T | undefined>();
    for (const item of items) {
      const key = placeKey(item.uf, item.name);
      map.set(key, map.has(key) ? undefined : item);
    }
    return map;
  };
  const byName = unique(rows);
  const geography = unique(places);
  const placeIds = new Map<string, number>();
  for (const place of places)
    placeIds.set(String(place.id), (placeIds.get(String(place.id)) ?? 0) + 1);
  const byId = new Map<string, Municipality | undefined>();
  for (const row of rows)
    byId.set(row.unit_id, byId.has(row.unit_id) ? undefined : row);
  return places.map((place) => {
    const id = String(place.id);
    if (placeIds.get(id) !== 1) return undefined;
    const unitId = (municipalityIds as Record<string, string>)[id];
    if (unitId) {
      const row = byId.get(unitId);
      return row?.uf === place.uf ? row : undefined;
    }
    if (/^[0-9]{7}$/.test(id)) return undefined;
    const key = placeKey(place.uf, place.name);
    return geography.get(key) ? byName.get(key) : undefined;
  });
}
function aggregateTotals(rows: Municipality[], complete: boolean): Totals {
  if (!complete) return {};
  const keys = [
    "electorate",
    "electorate_totalized",
    "electorate_installed",
    "turnout",
    "abstention",
    "valid",
    "computed",
    "blank",
    "null",
    "annulled",
    "sub_judice",
    "total",
  ] as const;
  return Object.fromEntries(
    keys.map((key) => {
      const values = rows.map((row) => row.totals?.[key]);
      return [
        key,
        values.every((value) => value != null)
          ? values.reduce<number>((sum, value) => sum + (value ?? 0), 0)
          : null,
      ];
    }),
  );
}
function aggregateState(
  state: string,
  municipalities: Municipality[],
  places: Place[],
  candidateIds: string[],
) {
  const rows = municipalities.filter((row) => row.uf === state);
  const identities = new Map<string, number>();
  for (const row of rows)
    identities.set(row.unit_id, (identities.get(row.unit_id) ?? 0) + 1);
  const available = rows.filter(
    (row): row is Municipality & { available: true } =>
      row.available && identities.get(row.unit_id) === 1,
  );
  const expectedIds = new Set(
    Object.values(municipalityIds).filter((id) => id.startsWith(`${state}:`)),
  );
  const observedIds = new Set(available.map((row) => row.unit_id));
  const geography = places.filter((place) => place.uf === state);
  const expected = Math.max(
    expectedIds.size,
    geography.length,
    identities.size,
  );
  const complete =
    expected > 0 &&
    available.length === expected &&
    [...expectedIds].every((id) => observedIds.has(id)) &&
    municipalIndex(available, geography).every((row) => row?.available);
  const counted = available.reduce((sum, row) => sum + row.sections.counted, 0);
  const total = complete
    ? available.reduce((sum, row) => sum + row.sections.total, 0)
    : null;
  const votes = candidateIds.map((id) =>
    available.reduce(
      (sum, row) => sum + (row.candidates.find((c) => c.id === id)?.votes ?? 0),
      0,
    ),
  );
  return {
    ...resultRow(
      { counted, total },
      votes,
      state,
      state,
      aggregateTotals(available, complete),
      available.length > 0,
    ),
    as_of_min: available.map((row) => row.as_of).sort()[0] ?? null,
    as_of_max:
      available
        .map((row) => row.as_of)
        .sort()
        .at(-1) ?? null,
    aggregation: "municipal",
    coverageComplete: complete,
    coverage: { available: available.length, expected },
  };
}
export function adaptSnapshot(
  snapshot: Snapshot,
  municipalities: Municipality[],
  places: Place[],
  states: string[],
  exteriorCount = 0,
) {
  const ids = snapshot.candidates.map((c) => c.id);
  const votesOf = (row: Municipality) =>
    ids.map((id) => row.candidates.find((c) => c.id === id)?.votes ?? 0);
  const matched = municipalIndex(municipalities, places);
  const packed = new Float32Array(places.length * 4);
  matched.forEach((row, index) => {
    if (!row?.available) return;
    const votes = votesOf(row),
      total = votes.reduce((a, b) => a + b, 0);
    const leader = votes[1]! > votes[0]! ? 1 : 0;
    packed.set(
      [
        ratio(row.sections.counted, row.sections.total),
        leader,
        ratio(Math.abs(votes[0]! - votes[1]!), total),
        total,
      ],
      index * 4,
    );
  });
  const uf = Object.fromEntries(
    states.map((state) => [
      state,
      aggregateState(state, municipalities, places, ids),
    ]),
  );
  const totals = (snapshot as Snapshot & { totals?: Totals }).totals;
  const nat = resultRow(
    snapshot.sections,
    snapshot.candidates.map((c) => c.votes),
    "BR",
    "Brasil",
    totals,
  );
  const time = minuteOf(Date.parse(snapshot.source.as_of));
  return {
    t: time,
    at: time,
    seq: snapshot.snapshot_id,
    museq: snapshot.snapshot_id,
    rev: snapshot.snapshot_id,
    gerado: Date.parse(snapshot.source.as_of),
    nat,
    uf,
    muni: packed,
    zz: new Float32Array(exteriorCount * 4),
    pres: candidateMetadata(snapshot),
    towns: municipalities.some((row) => row.available),
    municipalityAvailable: matched.map((row) => !!row?.available),
    live: true,
    empty: false,
    mode: snapshot.mode,
    source: snapshot.source,
    projection: snapshot.projection,
    proj:
      snapshot.projection.available && snapshot.projection.shares
        ? {
            p: ratio(snapshot.sections.counted, snapshot.sections.total),
            by: Object.fromEntries(
              Object.entries(snapshot.projection.shares).map(([id, share]) => [
                Number(id),
                share / 100,
              ]),
            ),
            band: null,
            band90: null,
            drift: null,
            call: null,
            experimental: snapshot.projection.model !== "official_final",
            model: snapshot.projection.model,
            pre_count: snapshot.sections.counted === 0,
            source_as_of: snapshot.source.as_of,
            reason: snapshot.projection.reason,
          }
        : null,
  };
}
export function adaptHistory(points: HistoryPoint[], snapshot: Snapshot) {
  return points.map((point) => {
    const votes = snapshot.candidates.map(
      (c) => point.candidates.find((v) => v.id === c.id)?.votes ?? 0,
    );
    const total = votes.reduce((a, b) => a + b, 0);
    return {
      seq: point.snapshot_id,
      t: minuteOf(Date.parse(point.as_of)),
      pst: ratio(point.sections.counted, point.sections.total),
      sh: votes.map((vote) => ratio(vote, total)),
      status: "apurando",
    };
  });
}
