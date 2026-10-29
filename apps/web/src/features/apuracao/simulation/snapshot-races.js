import { Fe, We } from '../object-helpers.js';
import { presidentialStatus, raceStatus } from './snapshot-status.js';

function driftShares(candidates, drift, progress) {
  const weights = candidates.map(
    (candidate, index) =>
      candidate.w *
      (1 +
        drift *
          (index === 0 ? progress - 0.5 : index === 1 ? 0.5 - progress : 0)),
  );
  const total = weights.reduce((sum, weight) => sum + weight, 0);
  return weights.map((weight) => weight / total);
}

function rankedVotes(candidates, shares, votes) {
  return candidates
    .map((candidate, index) =>
      We(Fe({}, candidate), { votes: votes * shares[index] }),
    )
    .sort((left, right) => right.votes - left.votes);
}

function validCandidates(candidates) {
  const eligible = candidates.filter((candidate) => !candidate.anulado);
  return {
    votes: eligible.map((candidate) => candidate.votes),
    total: eligible.reduce((sum, candidate) => sum + candidate.votes, 0),
  };
}

/** Atualiza disputas estaduais após a soma dos modelos, sem copiar as corridas. */
export function finalizeStateRaces(state, race, stateData, round) {
  const progress = state.pst;
  const governorShares = driftShares(race.gov, race.drift, progress);
  const senateShares = driftShares(race.sen, race.drift * 0.6, progress);
  state.gov = rankedVotes(race.gov, governorShares, state.valid);
  state.sen = rankedVotes(race.sen, senateShares, state.valid * 1.9);
  const finalValid =
    state.el *
    (1 - stateData[state.uf][6] / 100) *
    (1 - stateData[state.uf][7] / 100 - stateData[state.uf][8] / 100);
  const governor = validCandidates(state.gov);
  const senate = validCandidates(state.sen);
  state.govStatus = governor.votes.length
    ? presidentialStatus(
        governor.votes,
        governor.total,
        state.left,
        progress,
        round,
      )
    : null;
  state.senStatus = senateStatus(senate, state.left, progress);
  state.finalValid = finalValid;
}

function senateStatus(senate, remaining, progress) {
  if (!senate.votes.length) return null;
  return progress >= 1
    ? 'eleitos'
    : raceStatus(senate.votes, senate.total, remaining, 2);
}

export function finalizeNationalRace(national, round) {
  const ranked = national.cand
    .map((votes, index) => [votes, index])
    .sort((left, right) => right[0] - left[0]);
  national.order = ranked.map((candidate) => candidate[1]);
  national.status = presidentialStatus(
    ranked.map((candidate) => candidate[0]),
    national.valid,
    national.left,
    national.pst,
    round,
  );
}
