import {
  summarizeFirstRound,
  presidentialFinalists,
  normalizeFinalistShares,
} from './runoff-summary.js';
import {
  updateRunoffStates,
  createStateRunoffShares,
  createRegionalRunoffShares,
} from './runoff-models.js';
import {
  updateRunoffMunicipalities,
  updateRunoffExterior,
  updateRunoffExteriorArrivals,
} from './runoff-municipal.js';
import { updateRunoffRaces } from './runoff-races.js';

/** Prepara o segundo turno na ordem de mutação da simulação original. */
export function createRunoff({
  round,
  candidateData,
  snapshotAt,
  presidentialCandidates,
  states,
  previousFields,
  simulationRound,
  allStates,
  stateData,
  previousElection,
  arrivalTimes,
  progressCurves,
  createProgressCurve,
  fullProgressLogits,
  normalRandom,
  municipalModels,
  createRandom,
  exteriorModels,
  exteriorData,
  exteriorFields,
  exteriorModel,
  openingMinute,
  parseClock,
  seededFraction,
  races,
}) {
  const runoffRaces = [];
  if (round !== 2) return { firstRoundSummary: null, runoffRaces };
  const hasSecondRoundCandidates = !!candidateData && candidateData.turno === 2;
  const snapshot = hasSecondRoundCandidates ? null : snapshotAt(1560);
  const firstRoundSummary = summarizeFirstRound(
    snapshot,
    presidentialCandidates,
    states,
  );
  const finalists = presidentialFinalists(snapshot, presidentialCandidates);
  const normalizeShares = (shares) =>
    normalizeFinalistShares(shares, finalists);
  const firstIndex = finalists.findIndex(
    (index) => presidentialCandidates[index].partido === 'PT',
  );
  const secondIndex = finalists.findIndex(
    (index) => presidentialCandidates[index].partido === 'PL',
  );
  const validVotes = (previous) =>
    previous[previousFields.lula_2t] + previous[previousFields.bolsonaro_2t];
  const castVotes = (previous) =>
    validVotes(previous) +
    previous[previousFields.brancos_2t] +
    previous[previousFields.nulos_2t];
  updateRunoffStates(
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
  );
  const shares = createStateRunoffShares(
    { previousElection, previousFields, allStates },
    firstIndex,
    secondIndex,
  );
  const regionalShares = createRegionalRunoffShares(
    { previousElection, previousFields, normalRandom },
    shares,
    firstIndex,
    secondIndex,
    validVotes,
  );
  updateRunoffMunicipalities(
    { municipalModels, previousElection, previousFields, createRandom, states },
    shares,
    regionalShares,
    normalizeShares,
    validVotes,
    castVotes,
  );
  updateRunoffExterior(
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
  );
  updateRunoffExteriorArrivals({
    exteriorModels,
    progressCurves,
    openingMinute,
    parseClock,
    arrivalTimes,
  });
  updateRunoffRaces(
    { states, candidateData, seededFraction, createRandom, races },
    hasSecondRoundCandidates,
    snapshot,
    runoffRaces,
  );
  presidentialCandidates.splice(
    0,
    presidentialCandidates.length,
    ...finalists.map((index) => presidentialCandidates[index]),
  );
  simulationRound.value = 2;
  return { firstRoundSummary, runoffRaces };
}
