import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import {
  mkdtempSync,
  writeFileSync,
  rmSync,
  readFileSync,
  existsSync,
  mkdirSync,
  chmodSync,
  statSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";

const helper = fileURLToPath(new URL("./pre-push.mjs", import.meta.url));
const zero = "0".repeat(40);
const ambiente = Object.fromEntries(
  Object.entries(process.env).filter(([nome]) => !nome.startsWith("GIT_")),
);

function fixture(t) {
  const raiz = mkdtempSync(path.join(tmpdir(), "pre-push-"));
  const repo = path.join(raiz, "repo");
  const git = (...args) =>
    execFileSync("git", ["-C", repo, ...args], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
      env: ambiente,
    }).trim();
  execFileSync("git", ["init", "--quiet", repo], { env: ambiente });
  t.after(() => rmSync(raiz, { recursive: true, force: true }));
  git("config", "user.name", "Fixture");
  git("config", "user.email", "fixture@example.invalid");
  git("config", "core.hooksPath", "/dev/null");
  git("config", "commit.gpgsign", "false");
  writeFileSync(path.join(repo, "arquivo.txt"), "inicial\n");
  git("add", ".");
  git("commit", "--quiet", "-m", "fixture inicial");
  const head = git("rev-parse", "HEAD");
  const marcador = path.join(raiz, "gate.txt");
  const gate = [
    process.execPath,
    "-e",
    `require('node:fs').appendFileSync(${JSON.stringify(marcador)}, process.env.CI)`,
  ];
  const linha = (
    sha = head,
    local = "refs/heads/main",
    remoto = "refs/heads/main",
  ) => `${local} ${sha} ${remoto} ${zero}\n`;
  const run = (stdin = linha(), comandos = gate) =>
    spawnSync(process.execPath, [helper, ...comandos], {
      cwd: repo,
      input: stdin,
      encoding: "utf8",
      env: ambiente,
    });
  return { repo, git, head, marcador, gate, linha, run };
}

test("checkout limpo valida HEAD uma vez com CI=1 e múltiplas refs", (t) => {
  const f = fixture(t);
  const resultado = f.run(
    f.linha() + f.linha(f.head, "refs/heads/outra", "refs/heads/outra"),
  );
  assert.equal(resultado.status, 0, resultado.stderr);
  assert.equal(readFileSync(f.marcador, "utf8"), "1");
});

test("tags leves e anotadas apontando HEAD são validadas", (t) => {
  const f = fixture(t);
  f.git("tag", "leve");
  f.git("tag", "-a", "anotada", "-m", "fixture tag");
  for (const nome of ["leve", "anotada"]) {
    const resultado = f.run(
      f.linha(
        f.git("rev-parse", nome),
        `refs/tags/${nome}`,
        `refs/tags/${nome}`,
      ),
    );
    assert.equal(resultado.status, 0, resultado.stderr);
  }
  assert.equal(readFileSync(f.marcador, "utf8"), "11");
});

test("ref diferente de HEAD é rejeitada antes do gate", (t) => {
  const f = fixture(t);
  writeFileSync(path.join(f.repo, "arquivo.txt"), "segundo\n");
  f.git("commit", "--quiet", "-am", "fixture seguinte");
  const resultado = f.run(f.linha());
  assert.equal(resultado.status, 1);
  assert.match(resultado.stderr, /HEAD/u);
  assert.equal(existsSync(f.marcador), false);
});

for (const estado of [
  "working tree",
  "índice",
  "novo",
  "assume-unchanged",
  "skip-worktree",
]) {
  test(`rejeita ${estado} antes de executar o gate`, (t) => {
    const f = fixture(t);
    if (estado === "novo") writeFileSync(path.join(f.repo, "novo.txt"), "novo");
    else if (estado === "assume-unchanged" || estado === "skip-worktree") {
      f.git("update-index", `--${estado}`, "arquivo.txt");
      writeFileSync(path.join(f.repo, "arquivo.txt"), "oculto\n");
    } else {
      writeFileSync(path.join(f.repo, "arquivo.txt"), "alterado\n");
      if (estado === "índice") f.git("add", "arquivo.txt");
    }
    assert.equal(f.run().status, 1);
    assert.equal(existsSync(f.marcador), false);
  });
}

test("exclusão isolada dispensa gate e exclusão junto de envio valida", (t) => {
  const f = fixture(t);
  const exclusao = f.linha(zero, "(delete)");
  assert.equal(f.run(exclusao).status, 0);
  assert.equal(existsSync(f.marcador), false);
  assert.equal(f.run(exclusao + f.linha()).status, 0);
  assert.equal(readFileSync(f.marcador, "utf8"), "1");
});

for (const entrada of [
  "",
  "refs/heads/main invalido refs/heads/main invalido\n",
  `(delete) ${zero} refs/notes/test ${zero}\n`,
  `refs/heads/main ${zero} refs/heads/main ${zero}\n`,
]) {
  test("stdin ausente ou inválido bloqueia o envio", (t) => {
    const f = fixture(t);
    assert.equal(f.run(entrada).status, 1);
    assert.equal(existsSync(f.marcador), false);
  });
}

test("falha do gate bloqueia o envio e não executa o seguinte", (t) => {
  const f = fixture(t);
  assert.equal(
    f.run(f.linha(), [
      process.execPath,
      "-e",
      "process.exit(7)",
      "--next",
      ...f.gate,
    ]).status,
    1,
  );
  assert.equal(existsSync(f.marcador), false);
});

test("gates adicionais executam sequencialmente", (t) => {
  const f = fixture(t);
  assert.equal(f.run(f.linha(), [...f.gate, "--next", ...f.gate]).status, 0);
  assert.equal(readFileSync(f.marcador, "utf8"), "11");
});

for (const alteracao of ["working tree", "índice", "HEAD"]) {
  test(`gate que muda ${alteracao} bloqueia o envio`, (t) => {
    const f = fixture(t);
    const codigo =
      alteracao === "HEAD"
        ? "require('node:child_process').execFileSync('git',['commit','--allow-empty','--quiet','-m','fixture corrida'])"
        : `require('node:fs').writeFileSync('arquivo.txt','alterado');${alteracao === "índice" ? "require('node:child_process').execFileSync('git',['add','arquivo.txt'])" : ""}`;
    assert.equal(f.run(f.linha(), [process.execPath, "-e", codigo]).status, 1);
  });
}

for (const falhaGate of [false, true]) {
  test(`Lefthook real com tracking=HEAD executa script e propaga ${falhaGate ? "falha" : "sucesso"} do gate`, (t) => {
    const f = fixture(t);
    const raiz = new URL("../../", import.meta.url);
    const binario = fileURLToPath(new URL("node_modules/.bin/lefthook", raiz));
    const ler = (arquivo) => readFileSync(new URL(arquivo, raiz), "utf8");
    const script = ler(".lefthook/pre-push/qualidade.sh");
    const bin = path.join(path.dirname(f.repo), "bin");
    mkdirSync(bin);
    for (const comando of ["npm"]) {
      writeFileSync(
        path.join(bin, comando),
        '#!/bin/sh\nprintf \'%s %s\\n\' "$CI" "$*" >> "$PUSH_TEST_MARKER"\nexit "${PUSH_TEST_GATE_STATUS:-0}"\n',
        { mode: 0o755 },
      );
    }
    mkdirSync(path.join(f.repo, ".lefthook/pre-push"), { recursive: true });
    mkdirSync(path.join(f.repo, "scripts/quality"), { recursive: true });
    writeFileSync(path.join(f.repo, "lefthook.yml"), ler("lefthook.yml"));
    const destinoScript = path.join(f.repo, ".lefthook/pre-push/qualidade.sh");
    writeFileSync(destinoScript, script);
    // O Lefthook ajusta permissões antes de executar: preservar o modo real
    // permite detectar quando esse ajuste torna o checkout sujo.
    chmodSync(
      destinoScript,
      statSync(new URL(".lefthook/pre-push/qualidade.sh", raiz)).mode & 0o777,
    );
    writeFileSync(
      path.join(f.repo, "scripts/quality/pre-push.mjs"),
      ler("scripts/quality/pre-push.mjs"),
    );
    f.git("add", ".");
    f.git("commit", "--quiet", "-m", "fixture lefthook");
    f.git("branch", "-M", "main");
    f.git("remote", "add", "origin", ".");
    f.git("update-ref", "refs/remotes/origin/main", "HEAD");
    f.git("branch", "--set-upstream-to=origin/main", "main");
    assert.equal(f.git("diff", "--name-only", "HEAD", "origin/main"), "");
    const head = f.git("rev-parse", "HEAD");
    const resultado = spawnSync(binario, ["run", "pre-push"], {
      cwd: f.repo,
      input: f.linha(head).replace(`${zero}\n`, `${f.head}\n`),
      encoding: "utf8",
      env: {
        ...ambiente,
        PATH: `${bin}${path.delimiter}${ambiente.PATH}`,
        PUSH_TEST_MARKER: f.marcador,
        PUSH_TEST_GATE_STATUS: falhaGate ? "7" : "0",
      },
    });
    assert.equal(
      resultado.status,
      falhaGate ? 1 : 0,
      resultado.stderr + resultado.stdout,
    );
    assert.equal(readFileSync(f.marcador, "utf8"), "1 run check:ci-local\n");
    assert.doesNotMatch(
      resultado.stdout + resultado.stderr,
      /no matching push files/u,
    );
  });
}

test("origem SHA literal igual HEAD pode ser enviada", (t) => {
  const f = fixture(t);
  const resultado = f.run(f.linha(f.head, f.head));
  assert.equal(resultado.status, 0, resultado.stderr);
  assert.equal(readFileSync(f.marcador, "utf8"), "1");
});
