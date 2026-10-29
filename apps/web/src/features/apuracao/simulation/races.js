/* Montagem das disputas estaduais com a mesma ordem de sorteios da captura. */
import { createDeclaredRace } from './race-candidates.js';
import { createFallbackRace } from './race-fallback.js';
import { createCandidateNames } from './race-names.js';

const excludedCandidates = new Set(['PR:sen:300']);

function hasDeclaredRace(candidateData, state) {
  return (
    candidateData &&
    (candidateData.governador || {})[state] &&
    (candidateData.senador || {})[state]
  );
}

function markExcluded(candidates, state, office) {
  for (const candidate of candidates) {
    if (excludedCandidates.has(state + ':' + office + ':' + candidate.n)) {
      candidate.anulado = !0;
    }
  }
}

export function createRaces({
  candidateData,
  createRandom,
  plIndex,
  presidentialShares,
  ptIndex,
  states,
}) {
  const nextCandidateName = createCandidateNames();
  const races = {};
  for (const state of states) {
    const random = createRandom(
      state.charCodeAt(0) * 131 + state.charCodeAt(1) * 7,
    );
    const lean =
      presidentialShares(state)[ptIndex < 0 ? 0 : ptIndex] >
      presidentialShares(state)[plIndex < 0 ? 1 : plIndex]
        ? 0
        : 1;
    const { gov, sen } = hasDeclaredRace(candidateData, state)
      ? createDeclaredRace(candidateData, state, random)
      : createFallbackRace(state, random, nextCandidateName);
    markExcluded(gov, state, 'gov');
    markExcluded(sen, state, 'sen');
    races[state] = {
      gov,
      sen,
      drift: (random() - 0.5) * 0.5,
      lean,
    };
  }
  return { races };
}
