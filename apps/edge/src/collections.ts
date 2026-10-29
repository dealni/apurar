import { parseSnapshot } from "../../../packages/contracts/snapshot";
import { validateMunicipality } from "../../../packages/contracts/municipality";

function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new Error("Objeto inválido.");
  return value as Record<string, unknown>;
}
function identifier(value: unknown, municipality = false): string {
  const pattern = municipality
    ? /^[a-zA-Z0-9_:-]{1,100}$/
    : /^[a-zA-Z0-9_-]{1,100}$/;
  if (typeof value !== "string" || !pattern.test(value))
    throw new Error("Identificador inválido.");
  return value;
}
function validateResult(
  item: Record<string, unknown>,
  id: string,
  projection: unknown,
): void {
  if (!Array.isArray(item.candidates)) throw new Error("Candidatos inválidos.");
  parseSnapshot({
    schema_version: 1,
    snapshot_id: id,
    mode: "live",
    election: { id: "6258", year: 2026, round: 2, office: "Presidente" },
    source: {
      url: "https://resultados.tse.jus.br",
      as_of: item.as_of,
      collected_at: item.as_of,
    },
    published_at: item.as_of,
    sections: item.sections,
    totals: item.totals,
    candidates: item.candidates.map((candidate: unknown) => ({
      ...record(candidate),
      name: "Candidatura",
      party: "",
    })),
    projection,
  });
}
export function validateCollection(value: unknown, kind: string): void {
  const document = record(value);
  if (document.schema_version !== 1 || document.election !== "6258")
    throw new Error("Feed inválido.");
  identifier(document.snapshot_id);
  const items = document[kind === "history" ? "points" : "items"];
  if (!Array.isArray(items)) throw new Error("Itens inválidos.");
  const seen = new Set<string>();
  let previousTime = -Infinity;
  for (const value of items) {
    const item = record(value);
    const id = identifier(
      kind === "history" ? item.snapshot_id : item.unit_id,
      kind !== "history",
    );
    const identity = kind === "history" ? id : `${String(item.uf)}:${id}`;
    if (seen.has(identity)) throw new Error("Item duplicado.");
    seen.add(identity);
    if (kind === "history") {
      validateResult(item, id, item.projection);
      const time = Date.parse(item.as_of as string);
      if (time < previousTime) throw new Error("Histórico fora de ordem.");
      previousTime = time;
    } else validateMunicipality(item);
  }
}
