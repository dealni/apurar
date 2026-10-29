import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { brotliDecompressSync } from "node:zlib";
import type { Page } from "@playwright/test";
import { parseArchive } from "../packages/contracts/archive";
import { parseSnapshot } from "../packages/contracts/snapshot";
import { parseHistory, parseMunicipalities } from "../apps/web/src/feeds";
import provenance from "./fixtures/replay-real/provenance.json" with { type: "json" };
import pack from "./fixtures/replay-real/capture-pack.json" with { type: "json" };

type ObjectName = keyof typeof provenance.objects;
const fixtureDirectory = resolve("e2e/fixtures/replay-real");
let unpacked: Buffer | undefined;

function verify(bytes: Buffer, expected: { bytes: number; sha256: string }) {
  if (
    bytes.length !== expected.bytes ||
    createHash("sha256").update(bytes).digest("hex") !== expected.sha256
  )
    throw new Error(`Captura real alterada: ${expected.sha256}.`);
}

function readPacked(sha256: string): string {
  if (!unpacked) {
    const compressed = readFileSync(resolve(fixtureDirectory, pack.file));
    verify(compressed, pack);
    unpacked = brotliDecompressSync(compressed);
    verify(unpacked, {
      bytes: pack.uncompressed_bytes,
      sha256: pack.uncompressed_sha256,
    });
  }
  const entry = (
    pack.objects as Record<string, { offset: number; bytes: number }>
  )[sha256];
  if (!entry) throw new Error(`Objeto ausente da captura real: ${sha256}.`);
  const bytes = unpacked.subarray(entry.offset, entry.offset + entry.bytes);
  verify(bytes, { bytes: entry.bytes, sha256 });
  return bytes.toString("utf8");
}

function readVerified(name: ObjectName): string {
  const object = provenance.objects[name];
  if (object.storage === "packed") return readPacked(object.sha256);
  const bytes = readFileSync(resolve(fixtureDirectory, object.file));
  verify(bytes, object);
  return bytes.toString("utf8");
}

// Cada item é uma publicação integral real referenciada pelo arquivo público.
// O manifesto é somente a projeção de transporte do ponteiro do arquivo;
// os três corpos imutáveis mantêm os bytes e IDs originais.
export function loadRealPresidentialPublications() {
  const archive = parseArchive(JSON.parse(readVerified("archive")));
  return archive.observations
    .filter((observation) => observation.family === "core")
    .map((observation) => {
      const pointer = observation.pointer;
      const snapshotBody = readPacked(pointer.sha256);
      const historyBody = readPacked(pointer.history!.sha256);
      const municipalitiesBody = readPacked(pointer.municipalities!.sha256);
      const snapshot = parseSnapshot(JSON.parse(snapshotBody));
      const history = JSON.parse(historyBody);
      const municipalities = JSON.parse(municipalitiesBody);
      history.points = parseHistory(history, snapshot);
      municipalities.items = parseMunicipalities(municipalities, snapshot);
      return {
        observation,
        manifest: {
          schema_version: 1,
          snapshot_id: pointer.snapshot_id!,
          snapshots: `/api/snapshots/${pointer.sha256}`,
          history: `/api/history/${pointer.history!.sha256}`,
          municipalities: `/api/municipalities/${pointer.municipalities!.sha256}`,
        },
        snapshot,
        history: history as ReturnType<
          typeof loadRealPresidentialReplay
        >["history"],
        municipalities: municipalities as ReturnType<
          typeof loadRealPresidentialReplay
        >["municipalities"],
        bodies: {
          snapshots: snapshotBody,
          history: historyBody,
          municipalities: municipalitiesBody,
        },
      };
    });
}

export function loadCorePublication(indexOrId: number | string) {
  const publications = loadRealPresidentialPublications();
  const publication =
    typeof indexOrId === "number"
      ? publications[indexOrId]
      : publications.find((item) => item.observation.id === indexOrId);
  if (!publication)
    throw new Error(`Publicação real não encontrada: ${indexOrId}.`);
  return publication;
}

// Valida as cópias sem substituir IDs, horários, votos, projeções ou municípios.
export function loadRealPresidentialReplay() {
  const bodies = Object.fromEntries(
    (Object.keys(provenance.objects) as ObjectName[]).map((name) => [
      name,
      readVerified(name),
    ]),
  ) as Record<ObjectName, string>;
  const snapshot = parseSnapshot(JSON.parse(bodies.snapshots));
  const historyEnvelope = JSON.parse(bodies.history);
  const municipalEnvelope = JSON.parse(bodies.municipalities);
  const history = {
    ...historyEnvelope,
    points: parseHistory(historyEnvelope, snapshot),
  };
  const municipalities = {
    ...municipalEnvelope,
    items: parseMunicipalities(municipalEnvelope, snapshot),
  };
  return {
    manifest: JSON.parse(bodies.manifest) as {
      snapshot_id: string;
      snapshots: string;
      history: string;
      municipalities: string;
    },
    snapshot,
    history: history as {
      election: string;
      snapshot_id: string;
      points: ReturnType<typeof parseHistory>;
    },
    municipalities: municipalities as {
      election: string;
      snapshot_id: string;
      items: ReturnType<typeof parseMunicipalities>;
    },
    provenance,
    release: provenance.release,
    bodies,
  };
}

// As respostas públicas capturadas são servidas apenas por interceptação local.
// Qualquer consulta de API não prevista falha explicitamente, sem sair à rede.
export async function mockRealPresidentialReplay(page: Page) {
  const fixture = loadRealPresidentialReplay();
  const requests: string[] = [];
  const routes = new Map(
    (Object.keys(provenance.objects) as ObjectName[]).map((name) => [
      new URL(provenance.objects[name].url).pathname,
      fixture.bodies[name],
    ]),
  );
  await page.route("**/api/**", (route) => {
    const path = new URL(route.request().url()).pathname;
    requests.push(path);
    const body = routes.get(path);
    return body === undefined
      ? route.fulfill({
          status: 404,
          json: { error: "Fora da captura local." },
        })
      : route.fulfill({ contentType: "application/json", body });
  });
  return { ...fixture, requests };
}
