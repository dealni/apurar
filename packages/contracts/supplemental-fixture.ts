import type { SupplementalPayload, SupplementalResult } from "./supplemental";
export function supplementalFixture(): SupplementalPayload {
  const row: SupplementalResult = {
    id: "AC:aggregate",
    name: "Acre",
    scope: "state",
    election: "6260",
    office: "governor",
    uf: "AC",
    status: "awaiting",
    stale: false,
    as_of: null,
    generated_at: null,
    sections: { counted: null, total: null },
    candidates: [],
    totals: {
      valid: null,
      blank: null,
      null: null,
      turnout: null,
      electorate: null,
      abstention: null,
    },
    source_url: null,
  };
  const city: SupplementalResult = {
    ...row,
    id: "ZZ:29955",
    name: "Cidade oficial de teste",
    scope: "city",
    election: "6258",
    office: "president",
    uf: "ZZ",
    tse_code: "29955",
    country_code: "PT",
    country: "Portugal",
    status: "available",
    as_of: "2026-10-25T20:05:00Z",
    generated_at: "2026-10-25T20:05:00Z",
    sections: { counted: 2, total: 10 },
    totals: { ...row.totals, valid: 100 },
    candidates: [
      {
        id: "11",
        name: "Candidatura oficial de teste",
        party: "TESTE",
        votes: 100,
        status: "",
        validity: "válidos",
      },
    ],
    source_url:
      "https://resultados.tse.jus.br/oficial/ele2026/6258/dados/zz/zz29955-c0001-e006258-u.json",
  };
  return {
    schema_version: 1,
    election: "6258",
    mode: "live",
    updated_at: "2026-10-25T20:10:00Z",
    governors: [row],
    exterior: {
      cities: [city],
      countries: [{ ...city, id: "PT", name: "Portugal", scope: "country" }],
    },
    zones: [],
    capabilities: {
      governor: true,
      exterior_city: true,
      exterior_country: true,
      zones: false,
      neighborhoods: false,
    },
    coverage: { pending: 1, errors: 0 },
  };
}

/** Observação anterior à remoção: somente para verificar leitura de arquivo legado. */
export function legacySupplementalFixture(): SupplementalPayload {
  const payload = supplementalFixture();
  payload.zones = [
    {
      ...payload.exterior.cities[0]!,
      id: "SP:71072:0001",
      name: "Zona legada de teste",
      uf: "SP",
      scope: "zone",
      kind: "zone",
      municipality_id: "SP:71072",
      ibge_code: "3550308",
      zone: "0001",
      source_url:
        "https://resultados.tse.jus.br/oficial/ele2026/6258/dados/sp/sp71072-z0001-c0001-e006258-u.json",
    },
  ];
  payload.capabilities.zones = true;
  return payload;
}
