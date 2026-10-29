import manifest from "../data/candidate-portraits.json";

type CandidateIdentity = {
  id?: string;
  n?: string | number;
  name?: string;
  nome?: string;
  party?: string;
  partido?: string;
  sq?: string;
};
type PortraitContext = { office: "president" | "governor"; uf?: string };
const normalize = (value: string) =>
  value.normalize("NFD").replace(/\p{M}/gu, "").trim().toUpperCase();

/** Número sozinho nunca identifica uma pessoa; nome e partido devem coincidir. */
export function candidatePortrait(
  candidate: CandidateIdentity,
  context?: PortraitContext,
): string | null {
  const name = normalize(candidate.name ?? candidate.nome ?? "");
  const party = normalize(candidate.party ?? candidate.partido ?? "");
  const number = String(candidate.n ?? candidate.id ?? "").replace(/^p/, "");
  const candidateUf =
    context?.office === "president" ? "BR" : context?.uf?.toUpperCase();
  const rows = manifest.candidates.filter((row) => {
    if (context && row.office !== context.office) return false;
    if (candidateUf && row.uf !== candidateUf) return false;
    if (normalize(row.name) !== name || normalize(row.party) !== party)
      return false;
    if (candidate.sq && row.sq !== candidate.sq) return false;
    return row.number === number;
  });
  return rows.length === 1 ? rows[0]!.path : null;
}
