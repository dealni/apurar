import { expect, it } from "vitest";
import {
  loadArchive,
  loadArchivedObservation,
  parseArchive,
  archiveCsv,
  filterArchiveRows,
  type ArchiveObservation,
} from "./archive-client";
import {
  supplementalFixture,
  legacySupplementalFixture,
} from "../../../../packages/contracts/supplemental-fixture";
const sha = "a".repeat(64);
const observation: ArchiveObservation = {
  id: `supplemental-${sha}`,
  family: "supplemental",
  observed_at: "2026-10-25T20:10:00Z",
  source_as_of: "2026-10-25T20:05:00Z",
  pointer: { key: `live/6258/supplemental/${sha}.json`, sha256: sha },
};
const index = () => ({
  schema_version: 1,
  election: "6258",
  mode: "live",
  started_at: observation.observed_at,
  updated_at: observation.observed_at,
  total_observations: 1,
  sampled: false,
  truncated: false,
  observations: [structuredClone(observation)],
});
it("carrega somente índice oficial e referências imutáveis selecionadas", async () => {
  const calls: string[] = [];
  const archive = await loadArchive(async (path) => {
    calls.push(path);
    return index();
  });
  const selected = archive.observations[0]!;
  const rows = await loadArchivedObservation(selected, async (path) => {
    calls.push(path);
    return supplementalFixture();
  });
  expect(calls).toEqual(["/api/archive", `/api/supplemental/${sha}`]);
  expect(rows.find((row) => row.office === "Governador")?.as_of).toBeNull();
  expect(
    rows.find((row) => row.name === "Cidade oficial de teste")?.as_of,
  ).toBe("2026-10-25T20:05:00Z");
  expect(selected.id).toBe(observation.id);
});
it("recusa índices incompatíveis, amostragem oculta e referência externa", () => {
  expect(() => parseArchive({ ...index(), mode: "demo" })).toThrow();
  expect(() => parseArchive({ ...index(), total_observations: 2 })).toThrow();
  const invalid = index();
  invalid.observations[0]!.pointer.key = "https://example.org/data";
  expect(() => parseArchive(invalid)).toThrow();
  const absent = index();
  absent.observations[0]!.source_as_of = null;
  expect(parseArchive(absent).observations[0]!.source_as_of).toBeNull();
});
it("recusa lote de outra família e mantém ausência no CSV", async () => {
  await expect(
    loadArchivedObservation({ ...observation, family: "core" }, async () =>
      supplementalFixture(),
    ),
  ).rejects.toThrow();
  const rows = await loadArchivedObservation(observation, async () =>
    supplementalFixture(),
  );
  const governor = filterArchiveRows(rows, "acre", "AC");
  expect(governor).toHaveLength(1);
  expect(archiveCsv(governor)).toContain('"false"');
  expect(archiveCsv(governor)).not.toContain('"0"');
});
it("consulta municípios no mesmo lote presidencial e recusa versões cruzadas", async () => {
  const { demo, demoMunicipalities } = await import("../demo");
  const stamp = new Date(Date.now() - 10000).toISOString();
  const snapshot = {
    ...structuredClone(demo),
    mode: "live",
    source: { ...demo.source, as_of: stamp, collected_at: stamp },
    published_at: stamp,
  };
  const cities = {
    schema_version: 1,
    election: "6258",
    snapshot_id: snapshot.snapshot_id,
    items: structuredClone(demoMunicipalities).map((city) => ({
      ...city,
      as_of: city.available ? stamp : null,
    })),
  };
  const selected: ArchiveObservation = {
    ...observation,
    family: "core",
    pointer: {
      key: `live/6258/snapshots/${sha}.json`,
      sha256: sha,
      snapshot_id: snapshot.snapshot_id,
      municipalities: {
        key: `live/6258/municipalities/${sha}.json`,
        sha256: sha,
      },
    },
  };
  const rows = await loadArchivedObservation(selected, async (path) =>
    path.includes("snapshots") ? snapshot : cities,
  );
  expect(rows[0]?.name).toBe("Brasil");
  expect(rows[0]?.source_url).toBe(snapshot.source.url);
  expect(archiveCsv(rows)).toContain(snapshot.source.url);
  expect(rows.length).toBe(cities.items.length + 1);
  await expect(
    loadArchivedObservation(selected, async (path) =>
      path.includes("snapshots")
        ? snapshot
        : { ...cities, snapshot_id: "outra-versao" },
    ),
  ).rejects.toThrow("incompatível");
});

it("arquivo legado preserva municípios e não apresenta nem exporta zonas", async () => {
  const legacy = legacySupplementalFixture();
  const rows = await loadArchivedObservation(observation, async () => legacy);
  expect(legacy.zones).toHaveLength(1);
  expect(rows.some((row) => row.id === legacy.zones[0]!.id)).toBe(false);
  expect(rows.some((row) => row.name === "Cidade oficial de teste")).toBe(true);
  expect(archiveCsv(rows)).not.toContain("Zona legada de teste");
  expect(JSON.stringify(rows)).not.toContain("SP:71072:0001");
});

it("contrato atual desativa zonas sem romper a leitura de observações legadas", async () => {
  const { parseSupplemental } = await import("./supplemental-data");
  const current = supplementalFixture();
  expect(parseSupplemental(current).zones).toEqual([]);
  expect(current.capabilities.zones).toBe(false);
  const legacy = legacySupplementalFixture();
  expect(parseSupplemental(legacy).zones).toHaveLength(1);
  expect(() =>
    parseSupplemental({
      ...legacy,
      capabilities: { ...legacy.capabilities, zones: false },
    }),
  ).toThrow("desativadas");
});

it("preserva cobertura parcial, fonte própria e dados anteriores nas exportações", async () => {
  const payload = supplementalFixture();
  const country = payload.exterior.countries[0]!;
  country.coverage = { available: 1, total: 3 };
  country.stale = true;
  const rows = await loadArchivedObservation(observation, async () => payload);
  const selected = filterArchiveRows(rows, "portugal", "ZZ");
  expect(selected[0]).toMatchObject({
    stale: true,
    coverage: { available: 1, total: 3 },
    as_of: country.as_of,
    source_url: country.source_url,
  });
  const csv = archiveCsv(selected);
  expect(csv).toContain(
    '"dados_anteriores";"cidades_disponiveis";"cidades_totais"',
  );
  expect(csv).toContain('"true";"1";"3"');
});

it("CSV neutraliza fórmulas de planilha sem perder aspas e separadores", async () => {
  const rows = await loadArchivedObservation(observation, async () =>
    supplementalFixture(),
  );
  rows[0]!.name = '=HYPERLINK("teste");';
  expect(archiveCsv(rows)).toContain('"\'=HYPERLINK(""teste"");"');
});
