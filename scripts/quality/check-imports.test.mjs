import assert from "node:assert/strict";
import { test } from "node:test";
import {
  groupDigest,
  inspectGroup,
  inspectSingleton,
  sha256,
} from "./check-imports.mjs";

const files = [{ path: "data.json", content: Buffer.from('{"value":1}') }];
const group = {
  path: "example",
  source: "src/data",
  ...groupDigest(files, "src/data"),
};

test("inventário confere conteúdo, contagem e bytes", () => {
  assert.deepEqual(inspectGroup(group, files), []);
  assert.match(
    inspectGroup(group, [
      { ...files[0], content: Buffer.from('{"value":2}') },
    ])[0],
    /sha256/u,
  );
  assert.equal(inspectGroup(group, []).length, 3);
});

test("dados JSON inválidos falham mesmo se hash for atualizado", () => {
  const invalid = [{ path: "bad.json", content: Buffer.from("{") }];
  assert.match(
    inspectGroup(
      { ...group, ...groupDigest(invalid, group.source) },
      invalid,
    )[0],
    /JSON de dados inválido/u,
  );
});

test("ordenação por componentes reproduz pathlib e independe da travessia", () => {
  const entries = [
    { path: "nested.js", content: Buffer.from("a") },
    { path: "nested/a.json", content: Buffer.from("{}") },
  ];
  assert.deepEqual(
    groupDigest(entries, "src"),
    groupDigest(entries.toReversed(), "src"),
  );
  assert.equal(
    groupDigest(entries, "src").sha256,
    sha256(
      `src/nested/a.json\0${sha256("{}")}\nsrc/nested.js\0${sha256("a")}\n`,
    ),
  );
});

test("mapa oficial confere hash, contagem e formato IBGE/TSE", () => {
  const content = Buffer.from('{"1100015":"RO:00310"}');
  const entry = {
    path: "map.json",
    kind: "municipality-id-map",
    sha256: sha256(content),
    bytes: content.length,
    records: 1,
  };
  assert.deepEqual(inspectSingleton(entry, content), []);
  assert.match(
    inspectSingleton({ ...entry, records: 2 }, content)[0],
    /contagem/u,
  );
  const duplicate = Buffer.from('{"1100015":"RO:00310","1100023":"RO:00310"}');
  assert.match(
    inspectSingleton(
      {
        ...entry,
        sha256: sha256(duplicate),
        bytes: duplicate.length,
        records: 2,
      },
      duplicate,
    )[0],
    /duplicadas/u,
  );
  const invalid = Buffer.from('{"1100015":"RO:invalid"}');
  assert.match(
    inspectSingleton(
      { ...entry, sha256: sha256(invalid), bytes: invalid.length },
      invalid,
    )[0],
    /mapeamento/u,
  );
});

test("fonte capturada preserva bytes sem exigir formato JSON", () => {
  const content = Buffer.from("export const preserved = true;\n");
  const entry = {
    path: "captured.js",
    kind: "captured-source",
    sha256: sha256(content),
    bytes: content.length,
  };
  assert.deepEqual(inspectSingleton(entry, content), []);
  assert.match(
    inspectSingleton(entry, Buffer.from("changed"))[0],
    /hash ou bytes/u,
  );
});
