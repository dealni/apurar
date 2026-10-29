#!/usr/bin/env node
/** Valida no checkout limpo exatamente o commit anunciado pelo protocolo pre-push. */
import { execFileSync, spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";

function falhar(mensagem) {
  throw new Error(`pre-push: ${mensagem}`);
}

function git(...argumentos) {
  return execFileSync("git", argumentos, {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  }).trimEnd();
}

function conferirCheckout(head) {
  if (git("rev-parse", "HEAD") !== head)
    falhar("HEAD mudou durante a validação; execute o push novamente.");
  // Flags locais podem esconder conteúdo diferente do commit nos gates.
  const flags = git("ls-files", "-v", "-z").split("\0");
  if (flags.some((arquivo) => /^[a-zS] /u.test(arquivo)))
    falhar("remova assume-unchanged/skip-worktree antes de validar o envio.");
  if (
    git(
      "status",
      "--porcelain=v1",
      "--untracked-files=all",
      "--ignore-submodules=none",
    ) !== "" ||
    git("write-tree") !== git("rev-parse", `${head}^{tree}`)
  )
    falhar(
      "índice e working tree devem estar limpos, incluindo arquivos novos; finalize ou guarde as alterações antes do push.",
    );
}

function conferirProtocolo(entrada, head) {
  const linhas = entrada.trim().split("\n");
  if (!entrada.trim())
    falhar("stdin do Git ausente; execute pelo hook pre-push com use_stdin.");
  let envia = false;
  for (const linha of linhas) {
    const campos = linha.trim().split(/\s+/u);
    const [local, sha, remoto, anterior] = campos;
    if (
      campos.length !== 4 ||
      !/^(?:[a-f0-9]{40}|[a-f0-9]{64})$/u.test(sha) ||
      !/^(?:[a-f0-9]{40}|[a-f0-9]{64})$/u.test(anterior) ||
      sha.length !== anterior.length ||
      !/^refs\/(?:heads|tags)\//u.test(remoto)
    )
      falhar("protocolo de refs inválido ou destino não suportado.");
    git("check-ref-format", remoto);
    if (/^0+$/u.test(sha)) {
      if (local !== "(delete)") falhar("exclusão com protocolo inválido.");
      continue;
    }
    const origemHead = ["HEAD", head].includes(local);
    if (!origemHead && !/^refs\/(?:heads|tags)\//u.test(local))
      falhar("origem não suportada; envie uma branch ou tag apontando HEAD.");
    if (!origemHead) git("check-ref-format", local);
    const commit = local.startsWith("refs/tags/")
      ? git("rev-parse", "--verify", `${sha}^{commit}`)
      : sha;
    if (commit !== head)
      falhar(
        "cada ref enviada deve apontar o commit HEAD; faça checkout do commit pretendido e valide novamente.",
      );
    envia = true;
  }
  return envia;
}

function main() {
  const entrada = readFileSync(0, "utf8");
  const head = git("rev-parse", "HEAD");
  if (!conferirProtocolo(entrada, head)) return;
  const comandos = [[]];
  for (const argumento of process.argv.slice(2)) {
    if (argumento === "--next") comandos.push([]);
    else comandos.at(-1).push(argumento);
  }
  if (comandos.some((comando) => comando.length === 0))
    falhar("informe os gates completos a executar.");
  conferirCheckout(head);
  for (const [comando, ...argumentos] of comandos) {
    const resultado = spawnSync(comando, argumentos, {
      stdio: ["ignore", "inherit", "inherit"],
      env: { ...process.env, CI: "1" },
    });
    if (resultado.error || resultado.status !== 0)
      falhar(
        "gate local reprovou ou não pôde executar; corrija antes do push.",
      );
    conferirCheckout(head);
  }
}

try {
  main();
} catch (erro) {
  console.error(
    erro instanceof Error && erro.message.startsWith("pre-push:")
      ? erro.message
      : "pre-push: não foi possível conferir as refs e o checkout; envio bloqueado.",
  );
  process.exitCode = 1;
}
