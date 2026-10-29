import type { Snapshot } from "../../../packages/contracts/snapshot";
import type { Municipality, HistoryPoint } from "./feeds";
// Fixtures sintéticas; nunca usadas como fallback do modo ao vivo.
export const demo: Snapshot = {
  schema_version: 1,
  snapshot_id: "demo-001",
  mode: "demo",
  election: { id: "6258", year: 2026, round: 2, office: "Presidente" },
  source: {
    url: "https://resultados.tse.jus.br/oficial/app/index.html",
    as_of: "2026-10-25T18:00:00-03:00",
    collected_at: "2026-10-25T18:00:10-03:00",
  },
  published_at: "2026-10-25T18:00:12-03:00",
  sections: { counted: 12500, total: 50000 },
  candidates: [
    { id: "01", name: "Candidatura A", party: "Demonstração", votes: 2400000 },
    { id: "02", name: "Candidatura B", party: "Demonstração", votes: 2100000 },
  ],
  projection: {
    available: true,
    model: "synthetic-example",
    reason:
      "Exemplo inventado para explorar a interface. Não é uma estimativa eleitoral.",
    shares: { "01": 51.2, "02": 48.8 },
  },
};
export const demoMunicipalities: Municipality[] = [
  {
    scope: "municipality",
    uf: "SP",
    name: "Município Alfa (fictício)",
    unit_id: "demo-sp",
    sections: { counted: 80, total: 100 },
    candidates: [
      { id: "01", votes: 5200 },
      { id: "02", votes: 4800 },
    ],
    available: true,
    as_of: demo.source.as_of,
  },
  {
    scope: "municipality",
    uf: "RJ",
    name: "Município Beta (fictício)",
    unit_id: "demo-rj",
    sections: { counted: 30, total: 100 },
    candidates: [
      { id: "01", votes: 1400 },
      { id: "02", votes: 1600 },
    ],
    available: true,
    as_of: demo.source.as_of,
  },
  {
    scope: "municipality",
    uf: "MG",
    name: "Município Gama (fictício)",
    unit_id: "demo-mg",
    sections: { counted: 0, total: 100 },
    candidates: [],
    available: false,
    as_of: demo.source.as_of,
  },
];
export const demoHistory: HistoryPoint[] = [0, 1, 2, 3, 4].map((index) => ({
  snapshot_id: `demo-${index}`,
  as_of: new Date(
    Date.parse(demo.source.as_of) - (4 - index) * 900000,
  ).toISOString(),
  sections: { counted: (index + 1) * 2500, total: 50000 },
  candidates: [
    { id: "01", votes: 480000 * (index + 1) },
    { id: "02", votes: 430000 * (index + 1) - index * 12500 },
  ],
  projection: demo.projection,
}));
