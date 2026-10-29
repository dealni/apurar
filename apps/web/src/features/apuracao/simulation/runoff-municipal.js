import { Geo } from '../geography.js';
import { balanceRunoffShares } from './runoff-models.js';

export function updateRunoffMunicipalities(
  { municipalModels, previousElection, previousFields, createRandom, states },
  shares,
  regionalShares,
  normalizeShares,
  validVotes,
  castVotes,
) {
  Geo.munis.forEach((municipality, index) => {
    const model = municipalModels[index];
    const previous = previousElection && previousElection.m[municipality.id];
    if (previous && previous[previousFields.aptos_2t])
      model.turnout = Math.min(
        0.95,
        Math.max(0.5, castVotes(previous) / previous[previousFields.aptos_2t]),
      );
    model.share =
      shares[model.uf] && previous && validVotes(previous)
        ? regionalShares(
            previous[previousFields.lula_2t],
            previous[previousFields.bolsonaro_2t],
            model.uf,
            1,
            0.06,
            createRandom(model.i * 31 + 11),
          )
        : normalizeShares(model.share);
  });
  for (const state of states)
    if (shares[state])
      balanceRunoffShares(
        municipalModels.filter((model) => model.uf === state),
        shares[state],
      );
}

export function updateRunoffExterior(
  {
    exteriorModels,
    exteriorData,
    exteriorFields,
    createRandom,
    exteriorModel,
    stateData,
  },
  shares,
  regionalShares,
  normalizeShares,
) {
  exteriorModels.forEach((model, index) => {
    const previous = exteriorData.cidades[index][exteriorFields.r22b];
    const valid = previous ? previous[1] + previous[2] : 0;
    if (previous && previous[0])
      model.turnout = Math.min(
        0.9,
        Math.max(0.12, (valid + previous[3] + previous[4]) / previous[0]),
      );
    model.share =
      shares.ZZ && valid
        ? regionalShares(
            previous[1],
            previous[2],
            'ZZ',
            valid / (valid + 300),
            0.05,
            createRandom(index * 53 + 13),
          )
        : normalizeShares(model.share);
  });
  if (shares.ZZ && exteriorModels.length)
    balanceRunoffShares(exteriorModels, shares.ZZ);
  exteriorModel.share = shares.ZZ || normalizeShares(exteriorModel.share);
  exteriorModel.turnout = 1 - stateData.ZZ[6] / 100;
}

function exteriorArrivalMinute(
  fraction,
  curve,
  openingMinute,
  closingMinute,
  initialProgress,
) {
  if (fraction <= initialProgress) return openingMinute;
  let lower = openingMinute;
  let upper = closingMinute;
  for (let iteration = 0; iteration < 26; iteration++) {
    const middle = (lower + upper) / 2;
    if (curve(middle) >= fraction) upper = middle;
    else lower = middle;
  }
  return upper;
}

export function updateRunoffExteriorArrivals({
  exteriorModels,
  progressCurves,
  openingMinute,
  parseClock,
  arrivalTimes,
}) {
  const initialProgress = progressCurves.ZZ(openingMinute);
  const closingMinute = parseClock(arrivalTimes.ZZ[5]);
  const arrivals = [];
  exteriorModels.forEach((model) =>
    model.arrive.forEach((minute, index) =>
      arrivals.push([minute, model.i, index]),
    ),
  );
  arrivals
    .sort(
      (left, right) =>
        left[0] - right[0] || left[1] - right[1] || left[2] - right[2],
    )
    .forEach(([, modelIndex, arrivalIndex], order) => {
      exteriorModels[modelIndex].arrive[arrivalIndex] = exteriorArrivalMinute(
        (order + 1) / arrivals.length,
        progressCurves.ZZ,
        openingMinute,
        closingMinute,
        initialProgress,
      );
    });
}
