import type {
  Deputy,
  DeputySearchRow,
  MunicipalityResult,
  StateMunicipalityFeed,
  Votes,
} from "./types.ts";

export function normalizeDeputy(row: DeputySearchRow): Deputy {
  const [number, name, party, state, office, votes, elected, sequence] = row;
  return {
    number,
    name,
    party,
    state,
    office,
    votes,
    elected: elected === 1,
    sequence,
  };
}

/** Percentual indefinido é null, nunca um resultado eleitoral fabricado. */
export function percentage(part: number, total: number): number | null {
  if (
    !Number.isFinite(part) ||
    !Number.isFinite(total) ||
    total <= 0 ||
    part < 0
  )
    return null;
  return (part / total) * 100;
}

export function sumVotes(votes: Votes): number {
  return Object.values(votes).reduce((total, count) => total + count, 0);
}

const fields = [
  "secoes",
  "totalizadas",
  "eleitorado",
  "apurado",
  "comparecimento",
  "brancos",
  "nulos",
] as const;

/** Os arrays do feed são paralelos a ibge; falhas são explícitas para evitar deslocar resultados. */
export function normalizeMunicipalities(
  feed: StateMunicipalityFeed,
): MunicipalityResult[] {
  const count = feed.ibge.length;
  for (const field of fields) {
    if (feed[field].length !== count)
      throw new Error(`Array municipal desalinhado: ${field}`);
  }
  for (const [candidate, votes] of Object.entries(feed.votos)) {
    if (votes.length !== count)
      throw new Error(`Array municipal desalinhado: votos.${candidate}`);
  }
  return feed.ibge.map((ibge, index) => ({
    ibge,
    uf: feed.uf,
    secoes: feed.secoes[index]!,
    totalizadas: feed.totalizadas[index]!,
    eleitorado: feed.eleitorado[index]!,
    apurado: feed.apurado[index]!,
    comparecimento: feed.comparecimento[index]!,
    brancos: feed.brancos[index]!,
    nulos: feed.nulos[index]!,
    votos: Object.fromEntries(
      Object.entries(feed.votos).map(([candidate, values]) => [
        candidate,
        values[index]!,
      ]),
    ),
  }));
}

export function searchDeputies(
  deputies: readonly Deputy[],
  query: string,
): Deputy[] {
  const normalize = (value: string) =>
    value
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLocaleLowerCase("pt-BR");
  const needle = normalize(query.trim());
  return deputies.filter((deputy) =>
    normalize(
      `${deputy.name} ${deputy.number} ${deputy.party} ${deputy.state}`,
    ).includes(needle),
  );
}
