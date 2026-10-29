import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";

const root = fileURLToPath(new URL("../../", import.meta.url));
const python = resolve(root, ".venv/bin/python");
const result = spawnSync(
  python,
  ["-m", "ruff", "check", "--config", "ruff.toml", "services", "scripts"],
  { cwd: root, stdio: "inherit" },
);
if (result.error || result.status !== 0) {
  console.error(
    "Lint Python falhou. Para preparar a versão fixada: npm run setup:python-quality.",
  );
  process.exitCode = 1;
}
