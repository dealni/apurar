import { readFileSync } from "node:fs";

const permissivas = new Set([
  "MIT",
  "ISC",
  "Apache-2.0",
  "BSD-2-Clause",
  "BSD-3-Clause",
  "0BSD",
  "CC0-1.0",
  "BlueOak-1.0.0",
  "Python-2.0",
  "MIT OR Apache-2.0",
]);
// Ferramentas de build e acessibilidade: Lightning CSS, workerd e axe-core. A exceção não autoriza
// MPL em qualquer pacote novo, nem alterações na licença desses pacotes.
const ferramentasMpl =
  /^(?:lightningcss(?:-[a-z0-9-]+)?|workerd|axe-core|@cloudflare\/workerd-[a-z0-9-]+)$/u;
const sharpLgpl = new Set([
  "LGPL-3.0-or-later",
  "Apache-2.0 AND LGPL-3.0-or-later",
  "Apache-2.0 AND LGPL-3.0-or-later AND MIT",
]);
const objeto = (value) =>
  value !== null && typeof value === "object" && !Array.isArray(value);

export function validarLicencas(lock) {
  if (!objeto(lock) || lock.lockfileVersion !== 3 || !objeto(lock.packages)) {
    return ["Lockfile inválido: esperado formato 3 com packages."];
  }
  const entradas = Object.entries(lock.packages).filter(
    ([path]) => path !== "",
  );
  if (entradas.length === 0) return ["Lockfile sem dependências para auditar."];
  const erros = [];
  for (const [path, pacote] of entradas) {
    if (!objeto(pacote) || typeof pacote.license !== "string") {
      erros.push(`${path}: licença não declarada.`);
      continue;
    }
    const nome = pacote.name ?? path.split("node_modules/").at(-1);
    const licenca = pacote.license;
    // caniuse-lite contém dados de compatibilidade, não código do produto.
    // libvips é carregado dinamicamente por sharp no build das imagens. Uma
    // mudança para distribuição de binários exige revisar seus avisos LGPL.
    const revisada =
      (nome === "caniuse-lite" && licenca === "CC-BY-4.0") ||
      (ferramentasMpl.test(nome) && licenca === "MPL-2.0") ||
      (/^@img\/sharp-(?:libvips-[a-z0-9-]+|wasm32|win32-[a-z0-9-]+)$/u.test(
        nome,
      ) &&
        sharpLgpl.has(licenca));
    if (!permissivas.has(licenca) && !revisada)
      erros.push(`${path}: licença fora da política (${licenca}).`);
  }
  return erros;
}

if (import.meta.main) {
  try {
    const lock = JSON.parse(readFileSync("package-lock.json", "utf8"));
    const erros = validarLicencas(lock);
    if (erros.length) throw new Error(erros.join("\n"));
    console.log(
      `Licenças verificadas: ${Object.keys(lock.packages).length - 1} dependências.`,
    );
  } catch (erro) {
    console.error(erro instanceof Error ? erro.message : String(erro));
    process.exitCode = 1;
  }
}
