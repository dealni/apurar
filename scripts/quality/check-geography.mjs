import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

const read = (path) => JSON.parse(readFileSync(path, "utf8"));
function inspectGeometry(geometry, arcs, identities, seen) {
  const errors = [];
  const { id, uf } = geometry.properties ?? {};
  if (!identities[id]?.startsWith(`${uf}:`))
    errors.push(`Geometria sem identidade oficial: ${id}/${uf}.`);
  if (seen.has(id)) errors.push(`Geometria duplicada: ${id}.`);
  seen.add(id);
  const polygons =
    geometry.type === "Polygon" ? [geometry.arcs] : geometry.arcs;
  if (!["Polygon", "MultiPolygon"].includes(geometry.type) || !polygons?.length)
    return [...errors, `Geometria vazia ou incompatível: ${id}.`];
  for (const polygon of polygons) {
    if (!Array.isArray(polygon) || !polygon.length) {
      errors.push(`Polígono vazio: ${id}.`);
      continue;
    }
    for (const ring of polygon) {
      if (!Array.isArray(ring) || !ring.length) {
        errors.push(`Anel vazio: ${id}.`);
        continue;
      }
      for (const index of ring) {
        const normalized = index < 0 ? ~index : index;
        if (!Number.isInteger(index) || !arcs[normalized])
          errors.push(`Arco inexistente: ${id}/${index}.`);
      }
    }
  }
  return errors;
}
export function inspectTopology(header, arcs, geometries, identities) {
  const errors = [];
  const transform = header.transform;
  if (
    header.type !== "Topology" ||
    ![transform?.scale, transform?.translate].every(
      (pair) =>
        Array.isArray(pair) && pair.length === 2 && pair.every(Number.isFinite),
    ) ||
    !transform?.scale.every((value) => value > 0)
  )
    errors.push("Transformação geográfica inválida.");
  for (const arc of arcs)
    if (
      !Array.isArray(arc) ||
      arc.length < 2 ||
      !arc.every(
        (point) =>
          Array.isArray(point) &&
          point.length === 2 &&
          point.every(Number.isSafeInteger),
      )
    )
      errors.push("Arco vazio ou coordenada inválida.");
  const seen = new Set();
  for (const geometry of geometries)
    errors.push(...inspectGeometry(geometry, arcs, identities, seen));
  for (const id of Object.keys(identities))
    if (!seen.has(id)) errors.push(`Localidade oficial sem geometria: ${id}.`);
  return errors;
}
export function inspectOfficialGeography() {
  const root = "apps/web/src/data/official-geography-2025/geography";
  const files = (folder) =>
    readdirSync(`${root}/${folder}`)
      .filter((name) => name.endsWith(".json"))
      .sort();
  const arcs = files("arcs").flatMap((name) => read(`${root}/arcs/${name}`));
  const geometries = files("municipalities").flatMap((name) =>
    read(`${root}/municipalities/${name}`),
  );
  const identities = read("apps/web/src/integration/municipality-ids.json");
  const errors = inspectTopology(
    read(`${root}/brasil.json`),
    arcs,
    geometries,
    identities,
  );
  if (geometries.length !== 5571 || Object.keys(identities).length !== 5571)
    errors.push("A malha deve cobrir as 5.571 localidades IBGE/TSE revisadas.");
  return { errors, municipalities: geometries.length, arcs: arcs.length };
}
if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href
) {
  const result = inspectOfficialGeography();
  if (result.errors.length) {
    console.error(result.errors.join("\n"));
    process.exitCode = 1;
  } else
    console.log(
      `Malha oficial: ${result.municipalities} localidades, ${result.arcs} arcos e correspondência integral IBGE/TSE.`,
    );
}
