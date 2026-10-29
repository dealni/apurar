import { createPresidentialShares } from './municipal-shares.js';
import {
  createMunicipalPopulation,
  calibrateMunicipalModels,
} from './municipal-population.js';
import { createExteriorModels, arrivedSections } from './exterior-models.js';
/*
 * Simulação determinística: municipal-models.
 * Dependências explícitas; a fábrica mantém apenas o estado desta responsabilidade.
 */
export function createMunicipalModels({
  createRandom,
  normalRandom,
  openingMinute,
  regions,
  seededFraction,
  spatialNoise,
  stateData,
  states,
}) {
  const {
    candidateData,
    presidentialCandidates,
    ptIndex,
    plIndex,
    presidentialShares,
  } = createPresidentialShares({ regions, stateData });
  const previousElection =
    (typeof window != 'undefined' && window.R2022) || null;
  const previousFields = previousElection
    ? Object.fromEntries(previousElection.fields.map((y, Z) => [y, Z]))
    : null;
  const validFirstRoundVotes = (y) =>
    y[previousFields.lula_1t] +
    y[previousFields.bolsonaro_1t] +
    y[previousFields.tebet_1t] +
    y[previousFields.ciro_1t] +
    y[previousFields.outros_1t];
  const municipalModels = createMunicipalPopulation({
    createRandom,
    normalRandom,
    seededFraction,
    spatialNoise,
    stateData,
    presidentialShares,
    presidentialCandidates,
    previousElection,
    previousFields,
    validFirstRoundVotes,
    ptIndex,
    plIndex,
  });
  calibrateMunicipalModels(municipalModels, states, presidentialShares);
  const { exteriorModel, exteriorData, exteriorFields, exteriorModels } =
    createExteriorModels({
      stateData,
      presidentialShares,
      previousElection,
      previousFields,
      openingMinute,
      seededFraction,
      createRandom,
      normalRandom,
      validFirstRoundVotes,
      ptIndex,
      plIndex,
    });
  return {
    arrivedSections,
    candidateData,
    exteriorData,
    exteriorFields,
    exteriorModel,
    exteriorModels,
    municipalModels,
    plIndex,
    presidentialCandidates,
    presidentialShares,
    previousElection,
    previousFields,
    ptIndex,
  };
}
