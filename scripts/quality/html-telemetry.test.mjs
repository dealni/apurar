import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const source = readFileSync("apps/web/public/_headers", "utf8");
const rules = new Map();
let current;
for (const line of source.split("\n")) {
  if (!line.trim()) continue;
  if (!line.startsWith(" ")) {
    current = new Map();
    rules.set(line, current);
    continue;
  }
  const colon = line.indexOf(":");
  current.set(
    line.slice(0, colon).trim().toLowerCase(),
    line.slice(colon + 1).trim(),
  );
}

test("entradas HTML impedem injeção do beacon sem ampliar cache ou CSP", () => {
  for (const route of [
    "/",
    "/index.html",
    "/apurar",
    "/apurar/",
    "/apurar/index.html",
    "/1turno",
    "/1turno/",
    "/1turno/index.html",
  ]) {
    const cache = rules.get(route)?.get("cache-control");
    assert.ok(cache, `Cabeçalho ausente para ${route}`);
    const directives = new Set(cache.split(",").map((part) => part.trim()));
    for (const directive of [
      "public",
      "max-age=0",
      "must-revalidate",
      "no-transform",
    ])
      assert.ok(directives.has(directive), `${route} exige ${directive}`);
  }
  const csp = rules.get("/*").get("content-security-policy");
  assert.match(csp, /(?:^|;)\s*script-src 'self';/u);
  assert.match(csp, /(?:^|;)\s*connect-src 'self';/u);
  assert.doesNotMatch(csp, /cloudflareinsights|https:|\*/u);
});

test("política de HTML preserva assets imutáveis e não alcança a API", () => {
  assert.equal(
    rules.get("/assets/*").get("cache-control"),
    "public, max-age=31536000, immutable",
  );
  assert.equal(rules.get("/*").has("cache-control"), false);
  for (const [route, headers] of rules) {
    if (headers.get("cache-control")?.includes("no-transform")) {
      assert.ok(!route.includes("*"), "no-transform deve ter escopo exato");
      assert.ok(!route.startsWith("/api"), "não alterar API");
    }
  }
});
