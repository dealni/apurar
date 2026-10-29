import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { expect, it } from "vitest";
import manifest from "./state-flags-manifest.json";
import { stateFlags } from "./state-flags";

it("disponibiliza bandeiras das 27 UFs com integridade e fallback para código desconhecido", () => {
  expect(manifest.flags).toHaveLength(27);
  expect(Object.keys(stateFlags).sort()).toEqual(
    manifest.flags.map((flag) => flag.uf).sort(),
  );
  expect(stateFlags.ZZ).toBeUndefined();
  for (const flag of manifest.flags) {
    const data = readFileSync(
      new URL(`./assets/flags/${flag.file}`, import.meta.url),
    );
    expect(createHash("sha256").update(data).digest("hex")).toBe(flag.sha256);
    expect(data.length).toBe(flag.bytes);
    expect(data.toString()).toContain("<svg");
    expect(data.toString()).not.toMatch(
      /<script|<foreignObject|\bonload\s*=/iu,
    );
  }
});
