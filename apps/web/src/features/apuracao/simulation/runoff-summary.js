import { Fe, We } from '../object-helpers.js';

export const validCandidates = (candidates) =>
  candidates.filter((candidate) => !candidate.anulado);

function withVoteShares(candidates) {
  const votes = candidates.reduce((sum, candidate) => sum + candidate.votes, 0);
  return candidates.map((candidate) =>
    We(Fe({}, candidate), { share: votes ? candidate.votes / votes : 0 }),
  );
}

/** A fotografia do primeiro turno é calculada antes das mutações do segundo. */
export function summarizeFirstRound(snapshot, presidentialCandidates, states) {
  const summary = { pres: [], gov: {}, sen: {} };
  if (!snapshot) return summary;
  summary.pres = snapshot.nat.order.map((index) =>
    We(Fe({}, presidentialCandidates[index]), {
      votes: snapshot.nat.cand[index],
      share: snapshot.nat.cand[index] / snapshot.nat.valid,
    }),
  );
  for (const state of states) {
    const result = snapshot.uf[state];
    summary.gov[state] = {
      status: result.govStatus,
      top: withVoteShares(validCandidates(result.gov)).slice(0, 2),
    };
    summary.sen[state] = withVoteShares(validCandidates(result.sen)).slice(
      0,
      2,
    );
  }
  return summary;
}

export function presidentialFinalists(snapshot, candidates) {
  return (snapshot ? snapshot.nat.order.slice(0, 2) : [0, 1]).sort(
    (left, right) => candidates[left].n - candidates[right].n,
  );
}

export function normalizeFinalistShares(shares, finalists) {
  const first = shares[finalists[0]] || 0;
  const second = shares[finalists[1]] || 0;
  return first + second > 0
    ? [first / (first + second), second / (first + second)]
    : [0.5, 0.5];
}
