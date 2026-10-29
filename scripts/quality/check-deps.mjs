import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { isDeepStrictEqual } from "node:util";
import { parse } from "ini";

const grupos = [
  "dependencies",
  "devDependencies",
  "optionalDependencies",
  "peerDependencies",
];
const semver = String.raw`(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)(?:-(?:0|[1-9]\d*|\d*[A-Za-z-][0-9A-Za-z-]*)(?:\.(?:0|[1-9]\d*|\d*[A-Za-z-][0-9A-Za-z-]*))*)?(?:\+[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?`;
const exata = new RegExp(`^${semver}$`, "u");
const pacoteVersionado = new RegExp(
  `^(?:@[^/@\\s]+/[^/@\\s]+|[^/@\\s]+)@${semver}$`,
  "u",
);
const objeto = (valor) =>
  valor !== null && typeof valor === "object" && !Array.isArray(valor);

export function versaoExata(valor) {
  if (typeof valor !== "string") return false;
  if (!valor.startsWith("npm:")) return exata.test(valor);
  return pacoteVersionado.test(valor.slice(4));
}

// npm 12 usa ini.parse, parse-field e nopt para esta opção booleana.
// ini 6 e 7 têm o mesmo parser: comentários, escapes, seções e duplicatas.
function permiteTodosOsScripts(npmrc) {
  let valor = false;
  for (const [chave, configurada] of Object.entries(parse(npmrc))) {
    // O npm interpola também as chaves. Uma chave dinâmica pode virar o
    // bypass; rejeitar a ambiguidade mantém o gate independente do shell.
    if (chave.includes("${")) return true;
    if (chave !== "dangerously-allow-all-scripts") continue;
    valor = configurada;
  }
  // nopt mantém arrays, inclusive [false]; o npm testa sua veracidade.
  if (Array.isArray(valor)) return true;
  if (typeof valor !== "string") return Boolean(valor);
  const texto = valor.trim();
  // parse-field trata valor vazio como true antes de interpolar ambiente.
  if (texto === "" || texto.includes("${")) return true;
  if (texto === "undefined") return false;
  if (!Number.isNaN(Number(texto))) return Boolean(Number(texto));
  return texto !== "null" && texto !== "false";
}

export function validarDependencias(manifesto, lock, npmrc) {
  const erros = [];
  if (!objeto(manifesto)) return ["package.json precisa ser um objeto"];
  if (permiteTodosOsScripts(npmrc))
    erros.push(".npmrc não permite dangerously-allow-all-scripts ativo");
  const opcoes = parse(npmrc);
  for (const [nome, valor] of Object.entries({
    "save-exact": true,
    "save-prefix": "",
    "engine-strict": true,
    "strict-allow-scripts": true,
  })) {
    if (opcoes[nome] !== valor) erros.push(`.npmrc exige ${nome}=${valor}`);
  }
  if (
    !/^npm@12\.(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)$/u.test(manifesto.packageManager)
  )
    erros.push("packageManager exige npm 12 com versão exata");

  for (const grupo of grupos) {
    const deps = manifesto[grupo];
    if (deps === undefined) continue;
    if (!objeto(deps)) {
      erros.push(`${grupo} precisa ser um objeto`);
      continue;
    }
    for (const [nome, versao] of Object.entries(deps)) {
      if (!versaoExata(versao))
        erros.push(`${grupo}.${nome} exige versão exata`);
    }
  }
  function validarOverrides(valor, caminho) {
    if (!objeto(valor)) {
      erros.push(`${caminho} precisa ser um objeto`);
      return;
    }
    for (const [nome, decisao] of Object.entries(valor)) {
      const atual = `${caminho}.${nome}`;
      if (objeto(decisao)) validarOverrides(decisao, atual);
      else if (typeof decisao === "string" && decisao.startsWith("$")) {
        const referida = decisao.slice(1);
        if (!grupos.some((grupo) => versaoExata(manifesto[grupo]?.[referida])))
          erros.push(`${atual} referencia dependência sem versão exata`);
      } else if (!versaoExata(decisao))
        erros.push(`${atual} exige versão exata`);
    }
  }
  if (manifesto.overrides !== undefined)
    validarOverrides(manifesto.overrides, "overrides");

  const decisoes = manifesto.allowScripts;
  if (!objeto(decisoes)) erros.push("allowScripts exige um mapa explícito");
  else {
    for (const [pacote, decisao] of Object.entries(decisoes)) {
      if (!pacoteVersionado.test(pacote) || typeof decisao !== "boolean")
        erros.push(
          `allowScripts.${pacote} exige pacote@versão exata e booleano`,
        );
    }
  }
  if (!objeto(lock) || lock.lockfileVersion !== 3 || !objeto(lock.packages)) {
    erros.push("package-lock.json exige lockfileVersion 3 e packages");
    return erros;
  }
  const raiz = lock.packages[""];
  if (!objeto(raiz)) erros.push("lock sem manifesto raiz");
  else {
    for (const campo of ["name", "version", "engines", ...grupos]) {
      if (!isDeepStrictEqual(manifesto[campo], raiz[campo]))
        erros.push(`lock raiz diverge de package.json em ${campo}`);
    }
  }
  for (const grupo of grupos.filter((campo) => campo !== "peerDependencies")) {
    if (!objeto(manifesto[grupo])) continue;
    for (const [nome, declarada] of Object.entries(manifesto[grupo])) {
      if (!versaoExata(declarada)) continue;
      const alias = declarada.startsWith("npm:");
      const corte = declarada.lastIndexOf("@");
      const esperada = alias ? declarada.slice(corte + 1) : declarada;
      const resolvida = lock.packages[`node_modules/${nome}`];
      if (resolvida?.version !== esperada)
        erros.push(`lock resolve versão diferente para ${grupo}.${nome}`);
      if (alias && resolvida?.name !== declarada.slice(4, corte))
        erros.push(`lock resolve pacote diferente para alias ${grupo}.${nome}`);
    }
  }
  for (const [caminho, dados] of Object.entries(lock.packages)) {
    if (!objeto(dados) || !dados.hasInstallScript) continue;
    const nome =
      dados.name ?? caminho.slice(caminho.lastIndexOf("node_modules/") + 13);
    const chave = `${nome}@${dados.version}`;
    if (!objeto(decisoes) || typeof decisoes[chave] !== "boolean")
      erros.push(`lifecycle ${chave} exige decisão explícita em allowScripts`);
  }
  if (objeto(decisoes)) {
    for (const chave of Object.keys(decisoes)) {
      if (!pacoteVersionado.test(chave)) continue;
      const corte = chave.lastIndexOf("@");
      const nome = chave.slice(0, corte);
      const versao = chave.slice(corte + 1);
      const presente = Object.entries(lock.packages).some(
        ([caminho, dados]) => {
          if (!objeto(dados)) return false;
          const nomeNoLock =
            dados.name ??
            caminho.slice(caminho.lastIndexOf("node_modules/") + 13);
          return nomeNoLock === nome && dados.version === versao;
        },
      );
      if (!presente) erros.push(`allowScripts.${chave} não existe no lock`);
    }
  }
  return erros;
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href
) {
  try {
    const erros = validarDependencias(
      JSON.parse(readFileSync("package.json", "utf8")),
      JSON.parse(readFileSync("package-lock.json", "utf8")),
      readFileSync(".npmrc", "utf8"),
    );
    if (erros.length) {
      console.error(erros.join("\n"));
      process.exitCode = 1;
    } else console.log("Dependências, lock e política de scripts conferidos.");
  } catch (erro) {
    console.error(`Não foi possível verificar dependências: ${erro.message}`);
    process.exitCode = 1;
  }
}
