import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { test } from "node:test";
import { ESLint } from "eslint";

const eslint = new ESLint();

for (const filePath of [
  "apps/web/src/features/apuracao/quality-probe.js",
  "apps/web/src/features/projetar/quality-probe.js",
  "apps/web/src/runtime/quality-probe.js",
]) {
  test(`lint alcança referências indefinidas em ${filePath}`, async () => {
    const [invalid] = await eslint.lintText(
      "export const value = missingName;",
      {
        filePath,
      },
    );
    assert.ok(
      invalid.messages.some((message) => message.ruleId === "no-undef"),
    );
    const [valid] = await eslint.lintText(
      "export const value = document.title;",
      {
        filePath,
      },
    );
    assert.equal(valid.errorCount, 0);
  });
}

test("lint TypeScript recusa any e aceita uma fronteira unknown", async () => {
  const filePath = "apps/web/src/integration/quality-probe.ts";
  const [invalid] = await eslint.lintText("export const value: any = 1;", {
    filePath,
  });
  assert.ok(
    invalid.messages.some(
      (message) => message.ruleId === "@typescript-eslint/no-explicit-any",
    ),
  );
  const [valid] = await eslint.lintText("export const value: unknown = 1;", {
    filePath,
  });
  assert.equal(valid.errorCount, 0);
});

test("scripts Node não herdam globais do navegador", async () => {
  const filePath = "scripts/quality/quality-probe.mjs";
  const [result] = await eslint.lintText(
    "console.log(process.version, document.title);",
    { filePath },
  );
  assert.equal(result.messages.length, 1);
  assert.equal(result.messages[0].ruleId, "no-undef");
  assert.match(result.messages[0].message, /document/u);
});

function pythonLint(source, extra = []) {
  return spawnSync(
    ".venv/bin/python",
    [
      "-m",
      "ruff",
      "check",
      "--config",
      "ruff.toml",
      "--no-cache",
      "--stdin-filename",
      "services/collector/apurar_collector/quality_probe.py",
      "--output-format",
      "json",
      ...extra,
      "-",
    ],
    { input: source, encoding: "utf8" },
  );
}

test("Ruff detecta nome indefinido e import não usado e aceita fonte válida", () => {
  const invalid = pythonLint("import os\nprint(missing_name)\n");
  assert.equal(invalid.status, 1, invalid.stderr);
  const codes = JSON.parse(invalid.stdout).map((item) => item.code);
  assert.ok(codes.includes("F401"));
  assert.ok(codes.includes("F821"));
  const valid = pythonLint("import os\nprint(os.name)\n");
  assert.equal(valid.status, 0, valid.stderr);
});

test("Ruff recusa versão diferente da exigida", () => {
  const result = pythonLint("value = 1\n", [
    "--config",
    'required-version = "==0.0.1"',
  ]);
  assert.equal(result.status, 2);
  assert.match(result.stderr, /Required version/u);
});
