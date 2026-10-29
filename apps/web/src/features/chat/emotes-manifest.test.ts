import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { expect, it } from "vitest";
import manifest from "./emotes-manifest.json";

it("preserva 20 emotes WebP 4× locais com origem e integridade verificáveis", () => {
  expect(manifest).toHaveLength(20);
  expect(new Set(manifest.map((item) => item.name)).size).toBe(20);
  for (const item of manifest) {
    const bytes = readFileSync(
      new URL(`./assets/${item.file}`, import.meta.url),
    );
    expect(bytes.subarray(0, 4).toString()).toBe("RIFF");
    expect(bytes.subarray(8, 12).toString()).toBe("WEBP");
    expect(item.scale).toBe(4);
    expect(bytes.length).toBe(item.bytes);
    expect(createHash("sha256").update(bytes).digest("hex")).toBe(item.sha256);
    expect(new URL(item.source).hostname).toBe("www.frankerfacez.com");
    expect(item.name).toMatch(/^[A-Za-z0-9]+$/u);
    expect(item.label.length).toBeGreaterThan(0);
  }
});
