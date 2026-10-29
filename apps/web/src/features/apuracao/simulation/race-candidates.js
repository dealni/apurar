import { partyScale } from './race-parties.js';

function rankCandidates(candidates, state, random) {
  return candidates
    .filter((candidate) => candidate.valido !== !1)
    .map((candidate) => ({
      id: state + candidate.n,
      sq: candidate.sq,
      n: candidate.n,
      name: candidate.exib || candidate.nome,
      partido: candidate.partido,
      g: candidate.g || '',
      w: partyScale(candidate.partido) * (0.5 + random()),
    }))
    .sort((left, right) => right.w - left.w);
}

function adjustGovernorWeights(governors, random) {
  if (governors.length <= 1) return;
  if (random() < 0.42) governors[0].w *= 2.1 + random();
  else {
    governors[1].w = Math.max(
      governors[1].w,
      governors[0].w * (0.82 + 0.15 * random()),
    );
  }
}

export function createDeclaredRace(candidateData, state, random) {
  const gov = rankCandidates(candidateData.governador[state], state, random);
  const sen = rankCandidates(candidateData.senador[state], state, random);
  adjustGovernorWeights(gov, random);
  if (sen.length > 2) {
    sen[2].w = Math.max(sen[2].w, sen[1].w * (0.7 + 0.25 * random()));
  }
  return { gov, sen };
}
