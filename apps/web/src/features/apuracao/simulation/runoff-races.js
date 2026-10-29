import { Fe, We, ei } from '../object-helpers.js';
import { validCandidates } from './runoff-summary.js';

const stateSeed = (state) =>
  state.charCodeAt(0) * 131 + state.charCodeAt(1) * 7;

function governorFinalists(
  state,
  hasSecondRoundCandidates,
  candidateData,
  snapshot,
) {
  if (hasSecondRoundCandidates)
    return ((candidateData.governador || {})[state] || [])
      .filter((candidate) => candidate.valido !== false)
      .slice(0, 2)
      .map((candidate) => ({
        id: state + candidate.n,
        sq: candidate.sq,
        n: candidate.n,
        name: candidate.exib || candidate.nome,
        partido: candidate.partido,
        g: candidate.g || '',
      }));
  if (snapshot.uf[state].govStatus !== 'segundo-turno') return [];
  return validCandidates(snapshot.uf[state].gov)
    .slice(0, 2)
    .map((candidate) => ei(candidate, ['votes']));
}

/** A ordem e os curtos-circuitos destas chamadas preservam a sequência PRNG. */
function governorRace(candidates, position, rankedCount, random, lean) {
  const margin =
    position < 2
      ? 0.006 + 0.03 * random()
      : 0.02 +
        0.17 *
          Math.pow(
            (position - 2 + random()) / Math.max(1, rankedCount - 2),
            1.4,
          );
  const direction = random() < 0.7 ? 1 : -1;
  const close = position < 2 || (margin < 0.08 && random() < 0.25);
  const drift =
    direction *
    (close
      ? Math.min(0.14, margin / (0.55 - 0.45 * random()))
      : Math.max(-0.12, Math.min(0.12, margin * (1.5 * random() - 0.9))));
  const share = 0.5 + (direction * margin) / 2;
  return {
    gov: [
      We(Fe({}, candidates[0]), { w: share / (1 + drift / 2) }),
      We(Fe({}, candidates[1]), { w: (1 - share) / (1 - drift / 2) }),
    ],
    sen: [],
    drift,
    lean,
  };
}

export function updateRunoffRaces(
  { states, candidateData, seededFraction, createRandom, races },
  hasSecondRoundCandidates,
  snapshot,
  runoffRaces,
) {
  const finalists = {};
  for (const state of states) {
    const candidates = governorFinalists(
      state,
      hasSecondRoundCandidates,
      candidateData,
      snapshot,
    );
    if (candidates.length === 2) {
      finalists[state] = candidates;
      runoffRaces.push(state);
    }
  }
  const ranked = runoffRaces
    .map((state) => [seededFraction(stateSeed(state), 3), state])
    .sort((left, right) => left[0] - right[0])
    .map((entry) => entry[1]);
  for (const state of states) {
    const candidates = finalists[state];
    const position = ranked.indexOf(state);
    const random = createRandom(stateSeed(state) + 2026);
    races[state] = candidates
      ? governorRace(
          candidates,
          position,
          ranked.length,
          random,
          races[state].lean,
        )
      : { gov: [], sen: [], drift: 0, lean: races[state].lean };
  }
}
