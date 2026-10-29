/** Totais de uma unidade, antes da acumulação em ordem dos modelos. */
export function emptyTotals(uf, name, candidates, region) {
  return {
    uf,
    name,
    ...(region === undefined ? {} : { region }),
    el: 0,
    sections: 0,
    secDone: 0,
    elDone: 0,
    votes: 0,
    valid: 0,
    blank: 0,
    nul: 0,
    cand: candidates.map(() => 0),
  };
}

export function accumulateModel(totals, model, fraction, stateData) {
  const blankShare = stateData[model.uf][7] / 100;
  const nullShare = stateData[model.uf][8] / 100;
  const votes = model.el * model.turnout * fraction;
  const valid = votes * (1 - blankShare - nullShare);
  totals.el += model.el;
  totals.sections += model.sections;
  totals.secDone += fraction * model.sections;
  totals.elDone += fraction * model.el;
  totals.votes += votes;
  totals.valid += valid;
  totals.blank += votes * blankShare;
  totals.nul += votes * nullShare;
  for (let index = 0; index < model.share.length; index++)
    totals.cand[index] += valid * model.share[index];
}

export function accumulateState(national, state) {
  for (const field of [
    'el',
    'sections',
    'secDone',
    'elDone',
    'votes',
    'valid',
    'blank',
    'nul',
  ])
    national[field] += state[field];
  state.cand.forEach((votes, index) => (national.cand[index] += votes));
  finalizeProgress(state);
}

export function finalizeProgress(totals) {
  totals.pst = totals.secDone / totals.sections;
  totals.left = totals.el - totals.elDone;
}

/** Quatro posições por local: progresso, líder, margem e margem em votos. */
export function recordLocalSnapshot(buffer, model, fraction, stateData, uf) {
  let first = 0;
  let second = 0;
  let leader = 0;
  model.share.forEach((share, index) => {
    if (share > first) {
      second = first;
      first = share;
      leader = index;
    } else if (share > second) second = share;
  });
  const offset = model.i * 4;
  buffer[offset] = fraction;
  buffer[offset + 1] = leader;
  buffer[offset + 2] = first - second;
  buffer[offset + 3] =
    (first - second) *
    model.el *
    model.turnout *
    fraction *
    (1 - stateData[uf][7] / 100 - stateData[uf][8] / 100);
}
