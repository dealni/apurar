import { isTimestamp } from "./validation";

export interface SupplementalCandidate {
  id: string;
  name: string;
  party: string;
  votes: number | null;
  status: string;
  validity: string;
}
export interface SupplementalResult {
  id: string;
  name: string;
  scope: string;
  kind?: string;
  coverage?: { available: number; total: number };
  election: string;
  office: "governor" | "president";
  uf: string;
  tse_code?: string;
  ibge_code?: string | number | null;
  /** Compatibilidade somente leitura de observações imutáveis antigas. */
  municipality_id?: string;
  zone?: string;
  country_code?: string;
  country?: string;
  status: "available" | "awaiting" | "error" | "backoff" | "withheld";
  stale: boolean;
  as_of: string | null;
  generated_at: string | null;
  sections: { counted: number | null; total: number | null };
  candidates: SupplementalCandidate[];
  totals: Record<
    "valid" | "blank" | "null" | "turnout" | "electorate" | "abstention",
    number | null
  >;
  source_url: string | null;
}
export interface SupplementalPayload {
  schema_version: 1;
  election: "6258";
  mode: "live";
  updated_at: string;
  governors: SupplementalResult[];
  governor_municipalities?: SupplementalResult[];
  exterior: { cities: SupplementalResult[]; countries: SupplementalResult[] };
  /** Legado: a publicação atual mantém array vazio e capabilities.zones=false. */
  zones: SupplementalResult[];
  capabilities: Record<string, boolean>;
  coverage: {
    pending: number;
    errors: number;
    catalog_error?: string | null;
    total?: number;
    available?: number;
  };
}
const record = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);
const count = (value: unknown) =>
  value === null || (Number.isSafeInteger(value) && Number(value) >= 0);
const timestamp = (value: unknown) => value === null || isTimestamp(value);
function candidate(value: unknown) {
  return (
    record(value) &&
    typeof value.id === "string" &&
    typeof value.name === "string" &&
    typeof value.party === "string" &&
    count(value.votes) &&
    typeof value.status === "string" &&
    typeof value.validity === "string"
  );
}
function sourceUrl(value: unknown) {
  return (
    value === null ||
    (typeof value === "string" &&
      /^https:\/\/resultados\.tse\.jus\.br\//u.test(value))
  );
}
function ibgeCode(value: unknown) {
  return (
    value === undefined ||
    value === null ||
    /^(?:[0-9]{7})$/.test(String(value))
  );
}
function metadata(value: Record<string, unknown>) {
  if (!ibgeCode(value.ibge_code)) return false;
  const optionalStrings = [
    "kind",
    "tse_code",
    "municipality_id",
    "zone",
    "country_code",
    "country",
  ];
  if (
    !optionalStrings.every(
      (key) => value[key] === undefined || typeof value[key] === "string",
    )
  )
    return false;
  if (value.coverage === undefined) return true;
  return (
    record(value.coverage) &&
    Number.isSafeInteger(value.coverage.available) &&
    Number.isSafeInteger(value.coverage.total) &&
    Number(value.coverage.available) >= 0 &&
    Number(value.coverage.available) <= Number(value.coverage.total)
  );
}
function candidateList(value: unknown) {
  if (!Array.isArray(value) || !value.every(candidate)) return false;
  return new Set(value.map((item) => item.id)).size === value.length;
}
function sections(value: Record<string, unknown>) {
  if (!count(value.counted) || !count(value.total)) return false;
  return (
    value.counted === null ||
    value.total === null ||
    Number(value.counted) <= Number(value.total)
  );
}
function result(value: unknown): boolean {
  if (!record(value) || !record(value.sections) || !record(value.totals))
    return false;
  const fields = ["id", "name", "scope", "election", "uf"];
  if (!fields.every((key) => typeof value[key] === "string")) return false;
  if (!["governor", "president"].includes(String(value.office))) return false;
  if (
    !["available", "awaiting", "error", "backoff", "withheld"].includes(
      String(value.status),
    )
  )
    return false;
  if (
    typeof value.stale !== "boolean" ||
    !timestamp(value.as_of) ||
    !timestamp(value.generated_at)
  )
    return false;
  if (!sections(value.sections)) return false;
  const totals = value.totals;
  if (
    !["valid", "blank", "null", "turnout", "electorate", "abstention"].every(
      (key) => count(totals[key]),
    )
  )
    return false;
  if (!candidateList(value.candidates)) return false;
  if (!availableResult(value)) return false;
  return sourceUrl(value.source_url) && metadata(value);
}
function availableResult(value: Record<string, unknown>) {
  if (value.status !== "available") return true;
  const sections = value.sections as Record<string, unknown>;
  // Disponibilidade é distinta de zero e de divulgação suspensa. O produtor
  // sempre fornece geração, seções e votos para resultados disponíveis,
  // inclusive países agregados e observações imutáveis de zonas antigas.
  return (
    value.generated_at !== null &&
    sections.counted !== null &&
    sections.total !== null &&
    (value.candidates as SupplementalCandidate[]).every(
      (item) => item.votes !== null,
    )
  );
}
function coverage(value: unknown) {
  if (!record(value)) return false;
  if (
    !["pending", "errors"].every(
      (key) => Number.isSafeInteger(value[key]) && Number(value[key]) >= 0,
    )
  )
    return false;
  for (const key of ["total", "available"])
    if (
      value[key] !== undefined &&
      (!Number.isSafeInteger(value[key]) || Number(value[key]) < 0)
    )
      return false;
  if (
    typeof value.available === "number" &&
    typeof value.total === "number" &&
    value.available > value.total
  )
    return false;
  return (
    value.catalog_error === undefined ||
    value.catalog_error === null ||
    typeof value.catalog_error === "string"
  );
}
export function parseSupplemental(value: unknown): SupplementalPayload {
  if (
    !record(value) ||
    value.schema_version !== 1 ||
    value.election !== "6258" ||
    value.mode !== "live"
  )
    throw new Error(
      "Dados suplementares incompatíveis com o segundo turno ao vivo.",
    );
  if (
    typeof value.updated_at !== "string" ||
    !timestamp(value.updated_at) ||
    !record(value.exterior)
  )
    throw new Error("Metadados suplementares inválidos.");
  const lists = [
    value.governors,
    value.zones,
    value.exterior.cities,
    value.exterior.countries,
  ];
  if (value.governor_municipalities !== undefined)
    lists.push(value.governor_municipalities);
  if (!lists.every((list) => Array.isArray(list) && list.every(result)))
    throw new Error("Resultados suplementares inválidos.");
  if (
    !record(value.capabilities) ||
    !Object.values(value.capabilities).every(
      (entry) => typeof entry === "boolean",
    )
  )
    throw new Error("Cobertura suplementar inválida.");
  if (
    value.capabilities.zones === false &&
    (value.zones as unknown[]).length > 0
  )
    throw new Error("Zonas desativadas não podem conter resultados.");
  if (!coverage(value.coverage))
    throw new Error("Estado suplementar inválido.");
  return value as unknown as SupplementalPayload;
}
export function resultStatus(item: SupplementalResult) {
  if (item.stale) return "Último resultado preservado · atualização pendente";
  switch (item.status) {
    case "available":
      return "Resultado oficial";
    case "awaiting":
      return "Aguardando publicação oficial";
    case "backoff":
      return "Fonte temporariamente bloqueada";
    case "withheld":
      return "Resultado não divulgado pela fonte";
    default:
      return "Falha na consulta oficial";
  }
}
