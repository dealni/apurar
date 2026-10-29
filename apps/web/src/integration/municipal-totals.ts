import type {
  MunicipalTotals,
  Municipality,
} from "../../../../packages/contracts/municipality";
type Totals = Partial<MunicipalTotals>;
export function participationBase(totals: Totals = {}) {
  return (
    totals.electorate_installed ??
    (totals.turnout != null && totals.abstention != null
      ? totals.turnout + totals.abstention
      : null)
  );
}
export function destinationWarning(totals: Totals = {}, candidateSum: number) {
  return (
    totals.valid == null ||
    totals.valid !== candidateSum ||
    (totals.annulled ?? 0) > 0 ||
    (totals.sub_judice ?? 0) > 0
  );
}
export function municipalDetails(
  row: Municipality & { available: true },
  votes: number[],
  ids: string[],
) {
  const totals: Totals = row.totals ?? {};
  const base = votes.reduce((sum, vote) => sum + vote, 0);
  return {
    as_of: row.as_of,
    secoes: row.sections.total,
    totalizadas: row.sections.counted,
    eleitorado: totals.electorate ?? null,
    eleitoradoTotalizado: totals.electorate_totalized ?? null,
    apurado: participationBase(totals),
    comparecimento: totals.turnout ?? null,
    abstencao: totals.abstention ?? null,
    brancos: totals.blank ?? null,
    nulos: totals.null ?? null,
    computados: totals.computed ?? null,
    base,
    anulados: totals.annulled ?? null,
    subJudice: totals.sub_judice ?? null,
    totalVotos: totals.total ?? null,
    voteDestinationWarning: destinationWarning(totals, base),
    destinacoes: ids.map(
      (id) =>
        row.candidates.find((candidate) => candidate.id === id)?.validity ??
        null,
    ),
    votos: votes,
    validos: totals.valid ?? null,
  };
}
