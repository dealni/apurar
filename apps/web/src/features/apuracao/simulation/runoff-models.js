const RUNOFF_SWING = -0.023;
const percentage = (fraction) => Math.round(fraction * 1e4) / 100;

/** Atualiza participação e curvas antes de redistribuir os votos municipais. */
export function updateRunoffStates(
  {
    allStates,
    stateData,
    previousElection,
    previousFields,
    arrivalTimes,
    progressCurves,
    createProgressCurve,
    fullProgressLogits,
  },
  castVotes,
) {
  for (const state of allStates) {
    const data = stateData[state];
    const previous = previousElection && previousElection.uf[state];
    const cast = previous ? castVotes(previous) : 0;
    data.splice(2, 4, ...arrivalTimes[state].slice(2));
    progressCurves[state] = createProgressCurve(
      state,
      arrivalTimes[state],
      fullProgressLogits,
    );
    if (cast) {
      data[6] = percentage(1 - cast / previous[previousFields.aptos_2t]);
      data[7] = percentage(previous[previousFields.brancos_2t] / cast);
      data[8] = percentage(previous[previousFields.nulos_2t] / cast);
    }
  }
}

export function createStateRunoffShares(
  { previousElection, previousFields, allStates },
  firstIndex,
  secondIndex,
) {
  const shares = {};
  if (!previousElection || firstIndex < 0 || secondIndex < 0) return shares;
  for (const state of allStates) {
    const previous = previousElection.uf[state];
    if (!previous || !previous[previousFields.lula_2t]) continue;
    const result = [0, 0];
    result[firstIndex] =
      1 /
      (1 +
        (previous[previousFields.bolsonaro_2t] /
          previous[previousFields.lula_2t]) *
          Math.exp(-RUNOFF_SWING));
    result[secondIndex] = 1 - result[firstIndex];
    shares[state] = result;
  }
  return shares;
}

/** Mantém as duas chamadas de normalRandom na ordem Lula, Bolsonaro. */
export function createRegionalRunoffShares(
  { previousElection, previousFields, normalRandom },
  shares,
  firstIndex,
  secondIndex,
  validVotes,
) {
  return (firstVotes, secondVotes, state, weight, noise, random) => {
    const previous = previousElection.uf[state];
    const total = firstVotes + secondVotes;
    const previousValid = validVotes(previous);
    const adjustment = (votes, previousVotes) =>
      weight *
      Math.log(
        Math.max(0.001, votes / total / (previousVotes / previousValid)),
      );
    const first =
      Math.log(shares[state][firstIndex]) +
      adjustment(firstVotes, previous[previousFields.lula_2t]) +
      noise * normalRandom(random);
    const second =
      Math.log(shares[state][secondIndex]) +
      adjustment(secondVotes, previous[previousFields.bolsonaro_2t]) +
      noise * normalRandom(random);
    const result = [0, 0];
    result[firstIndex] = 1 / (1 + Math.exp(second - first));
    result[secondIndex] = 1 - result[firstIndex];
    return result;
  };
}

/** Três passagens de ponderação, com a mesma ordem de soma dos modelos. */
export function balanceRunoffShares(models, targetShares) {
  for (let pass = 0; pass < 3; pass++) {
    const votes = targetShares.map(() => 0);
    for (const model of models)
      model.share.forEach(
        (share, index) => (votes[index] += share * model.el * model.turnout),
      );
    const total = votes.reduce((sum, count) => sum + count, 0);
    for (const model of models) {
      const weighted = model.share.map(
        (share, index) =>
          (share * targetShares[index]) / (votes[index] / total),
      );
      const weightedTotal = weighted.reduce((sum, count) => sum + count, 0);
      model.share = weighted.map((share) => share / weightedTotal);
    }
  }
}
