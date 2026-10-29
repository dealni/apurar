import {
  parseArchive,
  type ArchiveObservation,
  type ArchiveIndex,
  type ArchiveReference,
} from "../../../../packages/contracts/archive";
import { parseSnapshot } from "../../../../packages/contracts/snapshot";
import { parseMunicipalities } from "../feeds";
import {
  parseSupplemental,
  type SupplementalResult,
} from "./supplemental-data";
import { timing, milliseconds } from "../../../../packages/contracts/timing";
export { parseArchive };
export type { ArchiveIndex, ArchiveObservation };
export interface ArchivedRow {
  id: string;
  name: string;
  uf: string;
  office: string;
  scope: string;
  as_of: string | null;
  available: boolean;
  stale?: boolean;
  coverage?: { available: number; total: number };
  source_url?: string | null;
  sections: { counted: number | null; total: number | null };
  candidates: { id: string; name: string; votes: number | null }[];
  totals: Record<string, number | null>;
}
async function request(path: string): Promise<unknown> {
  const response = await fetch(path, {
    cache: "no-cache",
    signal: AbortSignal.timeout(milliseconds(timing.requestTimeoutSeconds)),
  });
  if (!response.ok)
    throw new Error(`Arquivo indisponível (${response.status}).`);
  return response.json();
}
export async function loadArchive(get = request) {
  return parseArchive(await get("/api/archive"));
}
function path(reference: ArchiveReference, kind: string) {
  if (
    reference.key !== `live/6258/${kind}/${reference.sha256}.json` ||
    !/^[a-f0-9]{64}$/.test(reference.sha256)
  )
    throw new Error("Referência imutável inválida.");
  return `/api/${kind}/${reference.sha256}`;
}
function supplementalRow(item: SupplementalResult): ArchivedRow {
  return {
    id: item.id,
    name: item.name,
    uf: item.uf,
    office: item.office === "governor" ? "Governador" : "Presidente",
    scope: item.scope,
    as_of: item.as_of,
    available: item.status === "available",
    stale: item.stale,
    ...(item.coverage ? { coverage: item.coverage } : {}),
    source_url: item.source_url,
    sections: item.sections,
    candidates: item.candidates,
    totals: item.totals,
  };
}
export async function loadArchivedObservation(
  observation: ArchiveObservation,
  get = request,
): Promise<ArchivedRow[]> {
  const pointer = observation.pointer;
  if (observation.family === "supplemental") {
    const payload = parseSupplemental(await get(path(pointer, "supplemental")));
    return [
      ...payload.governors,
      ...(payload.governor_municipalities || []),
      ...payload.exterior.countries,
      ...payload.exterior.cities,
    ]
      .filter(
        (item) =>
          item.kind !== "zone" &&
          item.scope !== "zone" &&
          item.zone === undefined,
      )
      .map(supplementalRow);
  }
  if (!pointer.municipalities)
    throw new Error("Municípios arquivados indisponíveis.");
  const [rawSnapshot, rawCities] = await Promise.all([
    get(path(pointer, "snapshots")),
    get(path(pointer.municipalities, "municipalities")),
  ]);
  const snapshot = parseSnapshot(rawSnapshot);
  if (
    snapshot.mode !== "live" ||
    snapshot.snapshot_id !== pointer.snapshot_id ||
    (rawCities as { snapshot_id?: string })?.snapshot_id !==
      snapshot.snapshot_id
  )
    throw new Error("Lote arquivado incompatível.");
  const names = new Map(
    snapshot.candidates.map((candidate) => [candidate.id, candidate.name]),
  );
  const cities = parseMunicipalities(rawCities, snapshot);
  return [
    {
      id: snapshot.snapshot_id,
      name: "Brasil",
      uf: "BR",
      office: "Presidente",
      scope: "national",
      available: true,
      as_of: snapshot.source.as_of,
      source_url: snapshot.source.url,
      sections: snapshot.sections,
      candidates: snapshot.candidates,
      totals: snapshot.totals || {},
    },
    ...cities.map((city) => ({
      id: city.unit_id,
      name: city.name,
      uf: city.uf,
      scope: city.scope,
      office: "Presidente",
      available: city.available,
      as_of: city.as_of,
      sections: city.sections,
      totals: city.totals || {},
      candidates: city.candidates.map((candidate) => ({
        ...candidate,
        name: names.get(candidate.id) || candidate.id,
      })),
    })),
  ];
}
const scopeSearchLabels: Record<string, string> = {
  national: "Nacional",
  state: "Estado",
  municipality: "Município",
  municipal: "Município",
  country: "País",
  city: "Cidade",
};
export function filterArchiveRows(
  rows: ArchivedRow[],
  query: string,
  uf: string,
) {
  const normalize = (value: string) =>
    value.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
  return rows.filter(
    (row) =>
      (!uf || row.uf === uf) &&
      normalize(
        `${row.name} ${row.uf} ${row.id} ${row.office} ${row.scope} ${scopeSearchLabels[row.scope] || ""}`,
      ).includes(normalize(query.trim())),
  );
}
export function archiveCsv(rows: ArchivedRow[]) {
  const cell = (value: unknown) => {
    const text = String(value ?? "");
    const safe = /^[=+@\-\t\r\n]/u.test(text) ? "'" + text : text;
    return `"${safe.replaceAll('"', '""')}"`;
  };
  const lines = [
    [
      "local",
      "uf",
      "cargo",
      "escopo",
      "fonte",
      "disponivel",
      "candidato",
      "votos",
      "secoes_totalizadas",
      "secoes_totais",
      "dados_anteriores",
      "cidades_disponiveis",
      "cidades_totais",
      "arquivo_fonte",
    ],
  ];
  for (const row of rows)
    for (const candidate of row.candidates.length
      ? row.candidates
      : [{ name: "", votes: null }])
      lines.push([
        row.name,
        row.uf,
        row.office,
        row.scope,
        row.as_of || "",
        String(row.available),
        candidate.name,
        String(candidate.votes ?? ""),
        String(row.sections.counted ?? ""),
        String(row.sections.total ?? ""),
        row.stale === undefined ? "" : String(row.stale),
        String(row.coverage?.available ?? ""),
        String(row.coverage?.total ?? ""),
        row.source_url ?? "",
      ]);
  return "\uFEFF" + lines.map((line) => line.map(cell).join(";")).join("\r\n");
}
