import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { cpSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";

test("gate Python recusa suíte vazia e propaga resultado dos testes", () => {
  const directory = mkdtempSync(join(tmpdir(), "apurar-python-gate-"));
  try {
    mkdirSync(join(directory, "apurar_collector"));
    mkdirSync(join(directory, "tests"));
    writeFileSync(join(directory, "tests/__init__.py"), "");
    cpSync("services/collector/check.py", join(directory, "check.py"));
    const run = () =>
      spawnSync("python3", ["-B", "check.py"], {
        cwd: directory,
        encoding: "utf8",
      });
    const empty = run();
    assert.equal(empty.status, 1, empty.stderr);
    assert.match(empty.stderr, /Nenhum teste Python/u);
    const source =
      "import unittest\nclass Probe(unittest.TestCase):\n    def test_probe(self):\n        self.assertTrue(VALUE)\n";
    writeFileSync(
      join(directory, "tests/test_probe.py"),
      source.replace("VALUE", "True"),
    );
    const valid = run();
    assert.equal(valid.status, 0, valid.stderr);
    writeFileSync(
      join(directory, "tests/test_probe.py"),
      source.replace("VALUE", "False"),
    );
    assert.equal(run().status, 1);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});
