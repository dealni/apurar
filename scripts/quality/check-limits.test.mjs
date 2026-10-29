import assert from "node:assert/strict";
import { test } from "node:test";
import { inspectSource } from "./check-limits.mjs";

test("recusa arquivos acima do limite físico", () => {
  assert.match(inspectSource("style.css", "x\n".repeat(501))[0], /máximo 500/u);
  assert.deepEqual(inspectSource("style.css", "x\n".repeat(500)), []);
});

test("mede decisões na AST e separa funções aninhadas", () => {
  const decisions = Array.from(
    { length: 15 },
    (_, i) => `if (x === ${i}) x++;`,
  ).join("\n");
  assert.match(
    inspectSource("logic.ts", `function run(x: number) { ${decisions} }`)[0],
    /complexidade 16/u,
  );
  assert.deepEqual(
    inspectSource(
      "logic.ts",
      `function outer() { function nested() { ${decisions.replace("if (x === 14) x++;", "")} } }`,
    ),
    [],
  );
  assert.deepEqual(
    inspectSource("logic.ts", `const text = 'if while && ||'; // if if if\n`),
    [],
  );
});

test("recusa funções longas e desconsidera comentários", () => {
  assert.match(
    inspectSource(
      "logic.ts",
      `function run() {\n${"work();\n".repeat(151)}}`,
    )[0],
    /linhas efetivas/u,
  );
  assert.deepEqual(
    inspectSource(
      "logic.ts",
      `function run() {\n${"// comentário\n".repeat(151)}}`,
    ),
    [],
  );
});

test("JSX literal não conta como lógica, expressões continuam medidas", () => {
  assert.deepEqual(
    inspectSource(
      "component.tsx",
      `function Render() { return <div>\n${"<span>Texto</span>\n".repeat(151)}</div>; }`,
    ),
    [],
  );
  const decisions = Array.from(
    { length: 15 },
    (_, i) => `{flag ? ${i} : null}`,
  ).join("\n");
  assert.match(
    inspectSource(
      "component.tsx",
      `function Render() { return <div>${decisions}</div>; }`,
    )[0],
    /complexidade 16/u,
  );
});

test("fontes JavaScript recuperadas passam por validação sintática sem tipagem estrita", () => {
  assert.match(
    inspectSource("legacy.js", "export const broken = ;")[0],
    /sintaxe inválida/u,
  );
});
