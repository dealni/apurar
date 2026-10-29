import { describe, expect, it } from "vitest";
import { parseArchive, type ArchiveIndex } from "./archive";

function fixture(sampled = false): ArchiveIndex {
  const sha = "a".repeat(64);
  const reference = (kind: string) => ({
    key: `live/6258/${kind}/${sha}.json`,
    sha256: sha,
  });
  const first = "2026-10-25T20:00:00+00:00";
  const last = "2026-10-25T20:10:00+00:00";
  return {
    schema_version: 1,
    election: "6258",
    mode: "live",
    started_at: first,
    updated_at: last,
    total_observations: sampled ? 501 : 2,
    sampled,
    truncated: sampled,
    observations: [
      {
        id: `core-${sha}`,
        family: "core",
        observed_at: first,
        source_as_of: first,
        pointer: {
          ...reference("snapshots"),
          snapshot_id: "first",
          municipalities: reference("municipalities"),
          history: reference("history"),
        },
      },
      {
        id: `supplemental-${sha}`,
        family: "supplemental",
        observed_at: last,
        source_as_of: null,
        pointer: reference("supplemental"),
      },
    ],
  };
}

describe("extremos e origem do arquivo oficial", () => {
  it.each([false, true])(
    "aceita extremos preservados pelo produtor, amostragem=%s",
    (sampled) => {
      const index = fixture(sampled);
      expect(parseArchive(index)).toEqual(index);
      expect(index.observations[1]!.source_as_of).toBeNull();
    },
  );
  it.each(["started_at", "updated_at"] as const)(
    "recusa %s divergente da observação extrema",
    (field) => {
      const index = fixture(true);
      index[field] = "2026-10-25T20:05:00+00:00";
      expect(() => parseArchive(index)).toThrow("Extremos temporais");
    },
  );
  it("recusa inversão das observações com os extremos originais", () => {
    const index = fixture();
    index.observations.reverse();
    expect(() => parseArchive(index)).toThrow("Extremos temporais");
  });
  it("exige horário da fonte presidencial sem inventar horário do suplemento", () => {
    const index = fixture();
    index.observations[0]!.source_as_of = null;
    expect(() => parseArchive(index)).toThrow("Horário inválido");
  });
});
