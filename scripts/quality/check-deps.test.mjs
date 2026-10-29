import assert from "node:assert/strict";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { test } from "node:test";
import { validarDependencias, versaoExata } from "./check-deps.mjs";

const npmrc =
  "save-exact=true\nsave-prefix=\nengine-strict=true\nstrict-allow-scripts=true\n";
function fixture() {
  const manifesto = {
    name: "teste",
    version: "1.0.0",
    packageManager: "npm@12.2.0",
    dependencies: { pacote: "1.2.3" },
    devDependencies: { alias: "npm:@escopo/original@2.0.0" },
    overrides: { pacote: { outro: "3.0.0", ".": "$pacote" } },
    allowScripts: { "pacote@1.2.3": false },
  };
  const lock = {
    lockfileVersion: 3,
    packages: {
      "": {
        name: "teste",
        version: "1.0.0",
        dependencies: manifesto.dependencies,
        devDependencies: manifesto.devDependencies,
      },
      "node_modules/pacote": { version: "1.2.3", hasInstallScript: true },
      "node_modules/alias": { name: "@escopo/original", version: "2.0.0" },
    },
  };
  return { manifesto, lock };
}

for (const valor of [
  "^1.2.3",
  "~1.2.3",
  "latest",
  "1.x",
  "*",
  "file:../outro",
  "01.2.3",
  "1.2.3-01",
  "npm:@escopo/pacote@^1.2.3",
  "npm:@1.2.3",
  null,
]) {
  test(`recusa versão não reproduzível ${String(valor)}`, () =>
    assert.equal(versaoExata(valor), false));
}
test("aceita versões e alias exatos, incluindo prerelease", () => {
  for (const valor of ["1.2.3", "1.2.3-rc.1", "npm:@escopo/pacote@1.2.3"])
    assert.equal(versaoExata(valor), true);
});
test("aceita decisão false explícita e referência de override fixada", () => {
  const { manifesto, lock } = fixture();
  assert.deepEqual(validarDependencias(manifesto, lock, npmrc), []);
});
test("opções comentadas ou sobrescritas não satisfazem política", () => {
  const { manifesto, lock } = fixture();
  assert.match(
    validarDependencias(
      manifesto,
      lock,
      `${npmrc}strict-allow-scripts=false\n`,
    ).join("\n"),
    /strict-allow-scripts/u,
  );
  assert.match(
    validarDependencias(
      manifesto,
      lock,
      npmrc.replace("save-exact=true", "# save-exact=true"),
    ).join("\n"),
    /save-exact/u,
  );
});
test("opções em seções não substituem a política global", () => {
  const { manifesto, lock } = fixture();
  for (const globais of [
    "",
    "save-exact=false\nsave-prefix=^\nengine-strict=false\nstrict-allow-scripts=false\n",
  ]) {
    const problemas = validarDependencias(
      manifesto,
      lock,
      `${globais}[outra]\n${npmrc}`,
    );
    for (const nome of [
      "save-exact",
      "save-prefix",
      "engine-strict",
      "strict-allow-scripts",
    ])
      assert.ok(
        problemas.some((erro) => erro.startsWith(`.npmrc exige ${nome}=`)),
      );
  }
  assert.deepEqual(
    validarDependencias(
      manifesto,
      lock,
      `${npmrc}[outra]\nsave-exact=false\nsave-prefix=^\nengine-strict=false\nstrict-allow-scripts=false\n`,
    ),
    [],
  );
});
test("política global respeita aspas, comentários e valores escalares INI", () => {
  const { manifesto, lock } = fixture();
  assert.deepEqual(
    validarDependencias(
      manifesto,
      lock,
      'save-exact="true"\nsave-prefix=""\nengine-strict=true ; comentário\nstrict-allow-scripts=true # comentário\n',
    ),
    [],
  );
  for (const nome of ["save-exact", "engine-strict", "strict-allow-scripts"])
    assert.ok(
      validarDependencias(
        manifesto,
        lock,
        npmrc.replace(`${nome}=true`, `${nome}[]=true`),
      ).some((erro) => erro.startsWith(`.npmrc exige ${nome}=`)),
    );
});
for (const [nome, alterar, padrao] of [
  [
    "manifesto flutuante",
    (m) => {
      m.dependencies.pacote = "^1.2.3";
    },
    /exige versão exata/u,
  ],
  [
    "override flutuante",
    (m) => {
      m.overrides.pacote.outro = "latest";
    },
    /overrides/u,
  ],
  [
    "referência ausente",
    (m) => {
      m.overrides.pacote["."] = "$ausente";
    },
    /referencia/u,
  ],
  [
    "npm sem versão",
    (m) => {
      m.packageManager = "npm@12";
    },
    /packageManager/u,
  ],
  [
    "mapa ausente",
    (m) => {
      delete m.allowScripts;
    },
    /mapa explícito/u,
  ],
  [
    "decisão não booleana",
    (m) => {
      m.allowScripts["pacote@1.2.3"] = "sim";
    },
    /booleano/u,
  ],
  [
    "autorização sem versão",
    (m) => {
      m.allowScripts.pacote = true;
    },
    /booleano/u,
  ],
  [
    "autorização defasada",
    (m) => {
      m.allowScripts = { "pacote@1.2.4": true };
    },
    /não existe no lock/u,
  ],
  [
    "script transitivo novo",
    (m, l) => {
      l.packages["node_modules/pacote/node_modules/transitivo"] = {
        version: "4.0.0",
        hasInstallScript: true,
      };
    },
    /lifecycle transitivo@4.0.0/u,
  ],
  [
    "lock com manifesto antigo",
    (m, l) => {
      l.packages[""].dependencies = { pacote: "1.2.2" };
    },
    /lock raiz diverge/u,
  ],
  [
    "lock resolve alias incorreto",
    (m, l) => {
      l.packages["node_modules/alias"].version = "2.1.0";
    },
    /devDependencies.alias/u,
  ],
  [
    "lock inválido",
    (m, l) => {
      l.lockfileVersion = 2;
    },
    /lockfileVersion/u,
  ],
]) {
  test(`reprova ${nome}`, () => {
    const { manifesto, lock } = fixture();
    alterar(manifesto, lock);
    assert.match(
      validarDependencias(manifesto, lock, npmrc).join("\n"),
      padrao,
    );
  });
}
test("CLI falha com configuração inválida e arquivo ausente", () => {
  const pasta = mkdtempSync(join(tmpdir(), "deps-portfolio-"));
  try {
    const { manifesto, lock } = fixture();
    writeFileSync(join(pasta, "package.json"), JSON.stringify(manifesto));
    writeFileSync(join(pasta, "package-lock.json"), JSON.stringify(lock));
    const executar = () =>
      spawnSync(
        process.execPath,
        [new URL("./check-deps.mjs", import.meta.url).pathname],
        { cwd: pasta, encoding: "utf8" },
      );
    assert.equal(executar().status, 1);
    writeFileSync(join(pasta, ".npmrc"), `${npmrc}save-exact=false\n`);
    const invalida = executar();
    assert.equal(invalida.status, 1);
    assert.match(invalida.stderr, /save-exact/u);
    writeFileSync(join(pasta, ".npmrc"), npmrc);
    assert.equal(executar().status, 0);
  } finally {
    rmSync(pasta, { recursive: true, force: true });
  }
});

for (const alvo of ["@escopo/original", "original"]) {
  test(`alias ${alvo} exige nome e versão do alvo no lock`, () => {
    const { manifesto, lock } = fixture();
    manifesto.devDependencies.alias = `npm:${alvo}@2.0.0`;
    const pacote = lock.packages["node_modules/alias"];
    pacote.name = alvo;
    assert.deepEqual(validarDependencias(manifesto, lock, npmrc), []);
    pacote.name = "@escopo/outro";
    assert.match(
      validarDependencias(manifesto, lock, npmrc).join("\n"),
      /pacote diferente para alias/u,
    );
    delete pacote.name;
    assert.match(
      validarDependencias(manifesto, lock, npmrc).join("\n"),
      /pacote diferente para alias/u,
    );
    pacote.name = alvo;
    pacote.version = "2.1.0";
    assert.match(
      validarDependencias(manifesto, lock, npmrc).join("\n"),
      /versão diferente/u,
    );
  });
}

const casosDoBypass = [
  ["padrão", "", false],
  ["true", "dangerously-allow-all-scripts=true", true],
  ["false", "dangerously-allow-all-scripts=false", false],
  ["sem valor", "dangerously-allow-all-scripts", true],
  ["vazio", "dangerously-allow-all-scripts=", true],
  [
    "chave JSON escapada",
    String.raw`"dangerously-allow-all-\u0073cripts"=true`,
    true,
  ],
  ["valor entre aspas", 'dangerously-allow-all-scripts="true"', true],
  ["comentário inline", "dangerously-allow-all-scripts=true # texto", true],
  [
    "comentário desativado",
    "dangerously-allow-all-scripts=false ; true",
    false,
  ],
  [
    "comentário de linha",
    "# dangerously-allow-all-scripts=true\n; dangerously-allow-all-scripts=true",
    false,
  ],
  [
    "duplicata ativa",
    "dangerously-allow-all-scripts=false\ndangerously-allow-all-scripts=true",
    true,
  ],
  [
    "duplicata desativada",
    "dangerously-allow-all-scripts=true\ndangerously-allow-all-scripts=false",
    false,
  ],
  ["lista falsa", "dangerously-allow-all-scripts[]=false", true],
  ["número um", "dangerously-allow-all-scripts=1", true],
  ["número zero", "dangerously-allow-all-scripts=0", false],
  ["null", "dangerously-allow-all-scripts=null", false],
  ["undefined", "dangerously-allow-all-scripts=undefined", false],
  ["string não vazia", "dangerously-allow-all-scripts=sim", true],
  ["ambiente no valor", "dangerously-allow-all-scripts=${BYPASS_TESTE}", true],
  ["ambiente opcional", "dangerously-allow-all-scripts=${BYPASS_TESTE?}", true],
  ["ambiente na chave", "${BYPASS_TESTE}=true", true],
  [
    "seção sem bypass global",
    "[outra]\ndangerously-allow-all-scripts=true",
    false,
  ],
];
for (const [nome, configuracao, proibido] of casosDoBypass) {
  test(`política de scripts: ${nome}`, () => {
    const { manifesto, lock } = fixture();
    const problemas = validarDependencias(
      manifesto,
      lock,
      npmrc + configuracao + "\n",
    );
    assert.equal(
      problemas.some((erro) => erro.includes("dangerously-allow-all-scripts")),
      proibido,
    );
  });
}
