import { parseSnapshot } from "./snapshot";
import { count, record, timestamp } from "./validation";

export const municipalTotalFields = [
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
export type MunicipalTotals = {
  [Field in (typeof municipalTotalFields)[number]]: number | null;
};
export type Municipality = {
  scope: string;
  uf: string;
  name: string;
  unit_id: string;
  candidates: { id: string; votes: number; validity?: string }[];
  totals?: MunicipalTotals;
} & (
  | {
      available: true;
      sections: { counted: number; total: number };
      as_of: string;
    }
  | {
      available: false;
      sections: { counted: number | null; total: number | null };
      as_of: string | null;
    }
);

/** Aceita o feed legado sem totais; ausência dentro de totals exige null. */
export function validateMunicipality(value: unknown, now = Date.now()): void {
  const item = record(value);
  if (
    typeof item.unit_id !== "string" ||
    !/^[a-zA-Z0-9_:-]{1,100}$/.test(item.unit_id) ||
    typeof item.scope !== "string" ||
    !item.scope ||
    typeof item.uf !== "string" ||
    !/^[A-Z]{2}$/.test(item.uf) ||
    typeof item.name !== "string" ||
    !item.name.trim() ||
    typeof item.available !== "boolean"
  )
    throw new Error("Município inválido.");
  validateMunicipalTotals(item);
  if (item.available) validateResult(item, now);
  else validateUnavailable(item, now);
}

function validateMunicipalTotals(item: Record<string, unknown>): void {
  if (item.totals === undefined) return;
  const totals = record(item.totals);
  for (const field of municipalTotalFields) {
    if (totals[field] !== null) count(totals[field]);
    if (!item.available && totals[field] !== null)
      throw new Error("Total municipal indisponível deve ser nulo.");
  }
}

function validateResult(item: Record<string, unknown>, now: number): void {
  if (!Array.isArray(item.candidates)) throw new Error("Candidatos inválidos.");
  // Os totais oficiais são independentes dos votos por candidato: destinações
  // anuladas/sub judice são observações válidas, sem projeção municipal.
  parseSnapshot(
    {
      schema_version: 1,
      snapshot_id: "municipality",
      mode: "live",
      election: { id: "6258", year: 2026, round: 2, office: "Presidente" },
      source: {
        url: "https://resultados.tse.jus.br",
        as_of: item.as_of,
        collected_at: item.as_of,
      },
      published_at: item.as_of,
      sections: item.sections,
      candidates: item.candidates.map((candidate: unknown) => ({
        ...record(candidate),
        name: "Candidatura",
        party: "",
      })),
      projection: {
        available: false,
        model: "none",
        reason: "Sem projeção municipal.",
        shares: null,
      },
    },
    now,
  );
}

function validateUnavailable(item: Record<string, unknown>, now: number): void {
  if (!Array.isArray(item.candidates) || item.candidates.length !== 0)
    throw new Error("Resultado indisponível com votos.");
  const sections = record(item.sections);
  if (sections.counted !== null) count(sections.counted);
  if (sections.total !== null) count(sections.total);
  if (
    typeof sections.counted === "number" &&
    typeof sections.total === "number" &&
    sections.counted > sections.total
  )
    throw new Error("Seções incompatíveis.");
  if (item.as_of !== null) {
    timestamp(item.as_of);
    if (Date.parse(item.as_of as string) > now + 60000)
      throw new Error("Horário futuro.");
  }
}
