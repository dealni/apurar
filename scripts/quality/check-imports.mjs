import { createHash } from "node:crypto";
import { readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

export const sha256 = (content) =>
  createHash("sha256").update(content).digest("hex");

export function importedFiles(directory, prefix = "") {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const relative = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.isSymbolicLink())
      throw new Error(`Importação não permite symlink: ${relative}`);
    return entry.isDirectory()
      ? importedFiles(`${directory}/${entry.name}`, relative)
      : [
          {
            path: relative,
            content: readFileSync(`${directory}/${entry.name}`),
          },
        ];
  });
}

export function groupDigest(files, sourcePrefix) {
  const ordered = files.map((file) => ({
    ...file,
    sourcePath: `${sourcePrefix}/${file.path}`,
  }));
  // O inventário de origem ordenou pathlib.Path: comparação por componente.
  ordered.sort((left, right) => {
    const a = left.sourcePath.split("/");
    const b = right.sourcePath.split("/");
    for (let i = 0; i < Math.min(a.length, b.length); i++) {
      if (a[i] !== b[i]) return a[i] < b[i] ? -1 : 1;
    }
    return a.length - b.length;
  });
  const rows = ordered
    .map((file) => `${file.sourcePath}\0${sha256(file.content)}\n`)
    .join("");
  return {
    sha256: sha256(rows),
    files: files.length,
    bytes: files.reduce((total, file) => total + file.content.length, 0),
  };
}

export function inspectGroup(group, files) {
  const actual = groupDigest(files, group.source);
  const errors = ["sha256", "files", "bytes"]
    .filter((key) => actual[key] !== group[key])
    .map((key) => `${group.path}: ${key} diverge do inventário da origem.`);
  for (const file of files) {
    if (file.path.endsWith(".json")) {
      try {
        JSON.parse(file.content.toString("utf8"));
      } catch {
        errors.push(`${group.path}/${file.path}: JSON de dados inválido.`);
      }
    }
  }
  return errors;
}

export function inspectSingleton(entry, content) {
  const errors = [];
  if (sha256(content) !== entry.sha256 || content.length !== entry.bytes)
    errors.push(`${entry.path}: hash ou bytes divergem da fonte documentada.`);
  if (entry.kind === "captured-source") return errors;
  try {
    const parsed = JSON.parse(content.toString("utf8"));
    const entries = Object.entries(parsed);
    if (entries.length !== entry.records)
      errors.push(`${entry.path}: contagem de registros diverge da fonte.`);
    if (new Set(entries.map(([, value]) => value)).size !== entries.length)
      errors.push(`${entry.path}: identidades de destino duplicadas.`);
    if (
      entry.kind === "municipality-id-map" &&
      !entries.every(
        ([ibge, official]) =>
          /^\d{7}$/u.test(ibge) && /^[A-Z]{2}:\d{5}$/u.test(official),
      )
    )
      errors.push(`${entry.path}: mapeamento IBGE/TSE inválido.`);
  } catch {
    errors.push(`${entry.path}: dados JSON inválidos.`);
  }
  return errors;
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href
) {
  const manifest = JSON.parse(
    readFileSync("scripts/quality/imported-assets.json", "utf8"),
  );
  const errors = [
    ...manifest.groups.flatMap((group) =>
      inspectGroup(
        group,
        importedFiles(group.path).filter(
          (file) => !(group.exclusions ?? []).includes(file.path),
        ),
      ),
    ),
    ...(manifest.singleFiles ?? []).flatMap((entry) =>
      inspectSingleton(entry, readFileSync(entry.path)),
    ),
  ];
  if (errors.length) {
    console.error(errors.join("\n"));
    process.exitCode = 1;
  } else
    console.log(
      "Integridade de assets capturados e dados serializados conferida por hash, contagem e bytes.",
    );
}
