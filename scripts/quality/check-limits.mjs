import { readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import ts from "typescript";

const roots = ["apps", "packages", "scripts", "services", "e2e"];
const functionNode = (node) =>
  ts.isFunctionDeclaration(node) ||
  ts.isFunctionExpression(node) ||
  ts.isArrowFunction(node) ||
  ts.isMethodDeclaration(node) ||
  ts.isGetAccessor(node) ||
  ts.isSetAccessor(node) ||
  ts.isConstructorDeclaration(node);

function decisions(node) {
  const basic =
    ts.isIfStatement(node) ||
    ts.isConditionalExpression(node) ||
    ts.isForStatement(node) ||
    ts.isForInStatement(node) ||
    ts.isForOfStatement(node) ||
    ts.isWhileStatement(node) ||
    ts.isDoStatement(node) ||
    ts.isCaseClause(node) ||
    ts.isCatchClause(node);
  if (basic) return 1;
  if (ts.isBinaryExpression(node))
    return Number(
      [
        ts.SyntaxKind.AmpersandAmpersandToken,
        ts.SyntaxKind.BarBarToken,
        ts.SyntaxKind.QuestionQuestionToken,
      ].includes(node.operatorToken.kind),
    );
  return 0;
}

function measureFunction(node, source) {
  let complexity = 1;
  const lines = new Set();
  const countDecisions = (child) => {
    if (child !== node && functionNode(child)) return;
    complexity += decisions(child);
    ts.forEachChild(child, countDecisions);
  };
  const visitJsx = (child) => {
    if (ts.isJsxExpression(child) || ts.isJsxSpreadAttribute(child)) {
      if (child.expression) countLines(child.expression);
    } else ts.forEachChild(child, visitJsx);
  };
  const countLines = (child) => {
    if (child !== node && functionNode(child)) return;
    // JSX markup is presentation; expressions inside it remain code.
    if (
      ts.isJsxElement(child) ||
      ts.isJsxSelfClosingElement(child) ||
      ts.isJsxFragment(child)
    ) {
      visitJsx(child);
      return;
    }
    if (child.getChildCount(source) === 0) {
      const start = child.getStart(source);
      const first = source.getLineAndCharacterOfPosition(start).line;
      source.text
        .slice(start, child.end)
        .split(/\r?\n/u)
        .forEach((text, i) => {
          if (text.trim()) lines.add(first + i);
        });
    } else child.getChildren(source).forEach(countLines);
  };
  countDecisions(node);
  countLines(node);
  return { complexity, lines: lines.size };
}

export function inspectSource(path, text, checkFunctions = true) {
  const errors = [];
  const physicalLines = text.replace(/\n$/u, "").split("\n").length;
  if (physicalLines > 500)
    errors.push(`${path}: ${physicalLines} linhas físicas (máximo 500).`);
  if (!checkFunctions || !/\.[cm]?[jt]sx?$/u.test(path)) return errors;
  const source = ts.createSourceFile(path, text, ts.ScriptTarget.Latest, true);
  for (const diagnostic of source.parseDiagnostics)
    errors.push(
      `${path}: sintaxe inválida: ${ts.flattenDiagnosticMessageText(diagnostic.messageText, " ")}`,
    );
  const visit = (node) => {
    if (functionNode(node) && node.body) {
      const measured = measureFunction(node, source);
      const line =
        source.getLineAndCharacterOfPosition(node.getStart(source)).line + 1;
      if (measured.complexity > 15)
        errors.push(
          `${path}:${line}: complexidade ${measured.complexity} (máximo 15).`,
        );
      if (measured.lines > 150)
        errors.push(
          `${path}:${line}: função com ${measured.lines} linhas efetivas (máximo 150).`,
        );
    }
    ts.forEachChild(node, visit);
  };
  visit(source);
  return errors;
}

function files(path) {
  return readdirSync(path, { withFileTypes: true }).flatMap((entry) => {
    if (["node_modules", "__pycache__", ".venv"].includes(entry.name))
      return [];
    const file = join(path, entry.name);
    return entry.isDirectory() ? files(file) : [file];
  });
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href
) {
  const errors = roots
    .flatMap(files)
    .filter((file) => /\.(?:[cm]?[jt]sx?|css|py)$/u.test(file))
    .flatMap((file) =>
      inspectSource(
        file,
        readFileSync(file, "utf8"),
        /^(apps|packages)\//u.test(file),
      ),
    );
  if (errors.length) {
    console.error(errors.join("\n"));
    process.exitCode = 1;
  } else
    console.log(
      "Limites: 500 linhas por arquivo, complexidade 15 e 150 linhas por função JS/TS.",
    );
}
