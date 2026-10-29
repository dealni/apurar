import { timing, milliseconds } from "./timing";
import { record, count, timestamp } from "./validation";
export interface Snapshot {
  schema_version: 1;
  snapshot_id: string;
  mode: "live" | "demo";
  election: { id: "6258"; year: 2026; round: 2; office: "Presidente" };
  source: { url: string; as_of: string; collected_at: string };
  published_at: string;
  sections: { counted: number; total: number };
  candidates: {
    id: string;
    name: string;
    party: string;
    votes: number;
    validity?: string;
  }[];
  totals?: {
    valid: number;
    blank: number;
    null: number;
    turnout: number;
    electorate: number;
    electorate_totalized?: number;
    electorate_installed?: number;
    abstention?: number;
    computed?: number;
    annulled?: number;
    sub_judice?: number;
    total?: number;
  };
  projection: {
    available: boolean;
    model: string;
    reason: string;
    shares: Record<string, number> | null;
  };
}

export function parseSnapshot(input: unknown, now = Date.now()): Snapshot {
  const data = record(input);
  validateIdentity(data);
  validateSource(data, now);
  const sections = record(data.sections);
  if (count(sections.counted) > count(sections.total))
    throw new Error("Seções incompatíveis.");
  const ids = validateCandidates(data.candidates);
  const totalVotes = (data.candidates as unknown[]).reduce(
    (sum: number, item: unknown) => sum + count(record(item).votes),
    0,
  );
  if (
    !Number.isSafeInteger(totalVotes) ||
    (totalVotes > 0 && sections.counted === 0)
  )
    throw new Error("Votos sem seções ou total inválido.");
  validateProjection(data.projection, ids);
  validateOfficialTotals(data, totalVotes);
  return data as unknown as Snapshot;
}

function validateProjection(value: unknown, ids: Set<string>): void {
  const projection = record(value);
  if (
    typeof projection.available !== "boolean" ||
    typeof projection.model !== "string" ||
    typeof projection.reason !== "string"
  )
    throw new Error("Projeção inválida.");
  if (projection.available) {
    const shares = record(projection.shares);
    const values = Object.values(shares);
    if (
      Object.keys(shares).some((id) => !ids.has(id)) ||
      values.length !== 2 ||
      values.some(
        (v) => typeof v !== "number" || !Number.isFinite(v) || v < 0 || v > 100,
      )
    )
      throw new Error("Percentuais inválidos.");
    if (Math.abs((values as number[]).reduce((a, b) => a + b, 0) - 100) > 0.02)
      throw new Error("Soma inválida.");
  } else if (projection.shares !== null)
    throw new Error("Projeção indisponível deve ser nula.");
}

export function isStale(snapshot: Snapshot, now = Date.now()): boolean {
  const age = now - Date.parse(snapshot.source.as_of);
  return age > milliseconds(timing.sourceQuietSeconds) || age < -60000;
}

function validateIdentity(data: Record<string, unknown>): void {
  const election = record(data.election);
  if (
    data.schema_version !== 1 ||
    election.id !== "6258" ||
    election.year !== 2026 ||
    election.round !== 2 ||
    election.office !== "Presidente"
  )
    throw new Error("Contrato ou eleição incompatível.");
  if (data.mode !== "live" && data.mode !== "demo")
    throw new Error("Modo inválido.");
  if (
    typeof data.snapshot_id !== "string" ||
    !/^[a-zA-Z0-9_-]{1,100}$/.test(data.snapshot_id)
  )
    throw new Error("Versão inválida.");
}

function validateSource(data: Record<string, unknown>, now: number): void {
  const source = record(data.source);
  if (
    typeof source.url !== "string" ||
    new URL(source.url).origin !== "https://resultados.tse.jus.br"
  )
    throw new Error("Fonte inválida.");
  timestamp(source.as_of);
  timestamp(source.collected_at);
  timestamp(data.published_at);
  const times = [source.as_of, source.collected_at, data.published_at].map(
    (value) => Date.parse(value as string),
  );
  if (times[0]! > times[1]! || times[1]! > times[2]!)
    throw new Error("Ordem temporal inválida.");
  if (data.mode === "live" && times[2]! > now + 60000)
    throw new Error("Horário futuro.");
}

function validateCandidates(input: unknown): Set<string> {
  if (!Array.isArray(input) || input.length !== 2)
    throw new Error("Candidatos inválidos.");
  const ids = new Set<string>();
  for (const item of input) {
    const candidate = record(item);
    if (
      typeof candidate.id !== "string" ||
      !/^[0-9]{2}$/.test(candidate.id) ||
      ids.has(candidate.id)
    )
      throw new Error("Identidade inválida.");
    ids.add(candidate.id);
    if (
      typeof candidate.name !== "string" ||
      !candidate.name.trim() ||
      typeof candidate.party !== "string"
    )
      throw new Error("Nome inválido.");
    count(candidate.votes);
    if (
      candidate.validity !== undefined &&
      typeof candidate.validity !== "string"
    )
      throw new Error("Destinação inválida.");
  }
  return ids;
}

function validateOfficialTotals(
  data: Record<string, unknown>,
  candidateVotes: number,
): void {
  if (data.totals === undefined) return;
  const totals = record(data.totals);
  for (const field of ["valid", "blank", "null", "turnout", "electorate"])
    count(totals[field]);
  for (const field of [
    "computed",
    "annulled",
    "sub_judice",
    "total",
    "electorate_totalized",
    "electorate_installed",
    "abstention",
  ])
    if (totals[field] !== undefined) count(totals[field]);
  const incompatible =
    totals.valid !== candidateVotes ||
    (totals.computed !== undefined && totals.computed !== totals.valid) ||
    Number(totals.annulled ?? 0) > 0 ||
    Number(totals.sub_judice ?? 0) > 0;
  if (incompatible && record(data.projection).available)
    throw new Error("Projeção incompatível com destinação dos votos oficiais.");
}
