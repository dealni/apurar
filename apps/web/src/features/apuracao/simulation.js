import {
  createProgressCurveFactory,
  createArrivalTimes,
  formatClock,
} from './simulation/progress.js';
import { Geo } from './geography.js';
import { createRandomEngine } from './simulation/random.js';
import { createStateData } from './simulation/state-data.js';
import { createMunicipalModels } from './simulation/municipal-models.js';
import { createRaces } from './simulation/races.js';
import { createSnapshots } from './simulation/snapshots.js';
import { createRunoff } from './simulation/runoff.js';
const Sim = (() => {
  const {
    createRandom,
    normalRandom,
    parseClock,
    seededFraction,
    spatialNoise,
  } = createRandomEngine();
  const config = (typeof window != 'undefined' && window.APURACAO) || {};
  let scenarioHash = (typeof location != 'undefined' && location.hash) || '';
  try {
    scenarioHash = decodeURIComponent(scenarioHash);
  } catch {
    /* Fallback opcional preservado da captura; a interface continua disponível. */
  }
  const round =
    config.turno === 2 ||
    (config.modo !== 'ao-vivo' &&
      /(^|[#~-])2t(?=$|[~-])/.test(scenarioHash.toLowerCase()))
      ? 2
      : 1;
  const { arrivalTimes, regions, stateArticles, stateData, stateNames } =
    createStateData();
  const states = Object.keys(Geo.ufs).sort();
  const allStates = [...states, 'ZZ'];
  const openingMinute = 1020;
  const firstCountMinute = 1020 + (round === 2 ? 2 : 6);
  const progressLogits = [0, Math.log(9), Math.log(99), Math.log(999)];
  const fullProgressLogits = [-Math.log(99), -Math.log(9), ...progressLogits];
  const createProgressCurve = createProgressCurveFactory({
    stateData,
    progressLogits,
    parseClock,
    openingMinute,
    firstCountMinute,
  });
  const progressCurves = Object.fromEntries(
    allStates.map((y) => [y, createProgressCurve(y)]),
  );
  const {
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
  } = createMunicipalModels({
    createRandom,
    normalRandom,
    openingMinute,
    regions,
    seededFraction,
    spatialNoise,
    stateData,
    states,
  });
  const { races } = createRaces({
    candidateData,
    createRandom,
    plIndex,
    presidentialShares,
    ptIndex,
    states,
  });
  const simulationRound = {
    value: 1,
  };
  const { snapshotAt } = createSnapshots({
    allStates,
    arrivedSections,
    exteriorModel,
    exteriorModels,
    municipalModels,
    presidentialCandidates,
    progressCurves,
    races,
    regions,
    simulationRound,
    stateData,
    stateNames,
  });
  const { firstRoundSummary, runoffRaces } = createRunoff({
    allStates,
    arrivalTimes,
    candidateData,
    createProgressCurve,
    createRandom,
    exteriorData,
    exteriorFields,
    exteriorModel,
    exteriorModels,
    fullProgressLogits,
    municipalModels,
    normalRandom,
    openingMinute,
    parseClock,
    presidentialCandidates,
    previousElection,
    previousFields,
    progressCurves,
    races,
    round,
    seededFraction,
    simulationRound,
    snapshotAt,
    stateData,
    states,
  });
  const { municipalArrival, exteriorArrival } = createArrivalTimes({
    progressCurves,
    firstCountMinute,
    municipalModels,
    exteriorModels,
  });
  const endMinute = round === 2 ? 1320 : 1410;
  const finalSnapshot = snapshotAt(1560);
  return {
    at: snapshotAt,
    FINAL: finalSnapshot,
    PRES: presidentialCandidates,
    RACES: races,
    UFS: states,
    ALL: allStates,
    UF_NAME: stateNames,
    UF_ART: stateArticles,
    REGION: regions,
    UF_DATA: stateData,
    M: municipalModels,
    ARRIVE: municipalArrival,
    X: exteriorModels,
    XARRIVE: exteriorArrival,
    fmtClock: formatClock,
    OPEN: openingMinute,
    END: endMinute,
    real: !!candidateData,
    TURNO: round,
    DIA: round === 2 ? '2026-10-25' : '2026-10-04',
    RUNOFF: runoffRaces,
    T1: firstRoundSummary,
  };
})();
export { Sim };
