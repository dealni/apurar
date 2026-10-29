import assert from "node:assert/strict";
import { test } from "node:test";
import { validarLicencas } from "./check-licenses.mjs";

const lock = (name, license) => ({
  lockfileVersion: 3,
  packages: { "": {}, [`node_modules/${name}`]: { license } },
});
test("aceita licenças permissivas e alternativa permissiva explícita", () => {
  for (const license of ["MIT", "Apache-2.0", "MIT OR Apache-2.0"])
    assert.deepEqual(validarLicencas(lock("exemplo", license)), []);
});
test("rejeita licença ausente, forte ou expressão desconhecida", () => {
  for (const license of [
    undefined,
    "AGPL-3.0-only",
    "MIT AND GPL-3.0-only",
    "MIT OR GPL-3.0-only",
  ])
    assert.equal(validarLicencas(lock("exemplo", license)).length, 1);
});
test("exceções dependem do pacote e da licença exatos", () => {
  for (const [name, license] of [
    ["caniuse-lite", "CC-BY-4.0"],
    ["axe-core", "MPL-2.0"],
    ["lightningcss-darwin-arm64", "MPL-2.0"],
    ["@cloudflare/workerd-linux-64", "MPL-2.0"],
    ["@img/sharp-libvips-linux-x64", "LGPL-3.0-or-later"],
  ]) {
    assert.deepEqual(validarLicencas(lock(name, license)), []);
    assert.equal(validarLicencas(lock("outro", license)).length, 1);
    assert.equal(validarLicencas(lock(name, "AGPL-3.0-only")).length, 1);
  }
});
test("não deixa um alias ocultar a licença do pacote real", () => {
  const fixture = lock("caniuse-lite", "CC-BY-4.0");
  fixture.packages["node_modules/caniuse-lite"].name = "outro";
  assert.equal(validarLicencas(fixture).length, 1);
});
test("rejeita lock vazio ou malformado", () => {
  for (const fixture of [
    null,
    {},
    { lockfileVersion: 3, packages: [] },
    { lockfileVersion: 3, packages: { "": {} } },
    { lockfileVersion: 3, packages: { "node_modules/x": null } },
  ])
    assert.ok(validarLicencas(fixture).length);
});
