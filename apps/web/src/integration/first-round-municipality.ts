export type FirstRoundMunicipality = {
  candidates: {
    id: string;
    name: string;
    votes: number;
    share: number | null;
  }[];
};
const finalists = [
  { id: "13", name: "Lula" },
  { id: "22", name: "Flávio Bolsonaro" },
];

export function firstRoundMunicipality(
  value: unknown,
  uf: string,
  ibge: string | number,
): FirstRoundMunicipality | null {
  if (!value || typeof value !== "object") return null;
  const data = value as Record<string, unknown>;
  if (data.uf !== uf || !Array.isArray(data.ibge)) return null;
  const indexes = data.ibge.flatMap((id, i) =>
    String(id) === String(ibge) ? [i] : [],
  );
  if (
    indexes.length !== 1 ||
    !data.votos ||
    typeof data.votos !== "object" ||
    Array.isArray(data.votos)
  )
    return null;
  const index = indexes[0]!;
  const votes = data.votos as Record<string, unknown>;
  const counts = Object.values(votes).map((row) =>
    Array.isArray(row) ? row[index] : null,
  );
  if (
    !counts.length ||
    counts.some((count) => !Number.isSafeInteger(count) || count < 0)
  )
    return null;
  const total = counts.reduce((sum: number, count: number) => sum + count, 0);
  if (!Number.isSafeInteger(total)) return null;
  const candidates = finalists.map((candidate) => {
    const row = votes[candidate.id];
    const count = Array.isArray(row) ? row[index] : undefined;
    return {
      ...candidate,
      votes: count as number,
      share: total > 0 ? count / total : null,
    };
  });
  if (candidates.some((candidate) => !Number.isSafeInteger(candidate.votes)))
    return null;
  return { candidates };
}

const stateFiles = new Map<string, Promise<unknown>>();
export async function loadFirstRoundMunicipality(
  uf: string,
  ibge: string | number,
) {
  if (!/^[A-Z]{2}$/.test(uf)) return null;
  let pending = stateFiles.get(uf);
  if (!pending) {
    pending = fetch(`/1turno/feed/uf/${uf.toLowerCase()}.json`, {
      signal: AbortSignal.timeout(8000),
    })
      .then((response) => {
        if (!response.ok)
          throw new Error("Arquivo do primeiro turno indisponível.");
        return response.json() as Promise<unknown>;
      })
      .catch((error: unknown) => {
        stateFiles.delete(uf);
        throw error;
      });
    stateFiles.set(uf, pending);
  }
  return firstRoundMunicipality(await pending, uf, ibge);
}
