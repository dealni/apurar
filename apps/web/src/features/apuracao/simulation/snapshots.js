import {
  accumulateModel,
  accumulateState,
  emptyTotals,
  finalizeProgress,
  recordLocalSnapshot,
} from './snapshot-totals.js';
import { finalizeNationalRace, finalizeStateRaces } from './snapshot-races.js';

/** Compõe snapshots determinísticos mantendo o estado mutável do turno original. */
export function createSnapshots({
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
}) {
  const countedFraction = (model, minute) => {
    const progress = progressCurves[model.uf](minute);
    const fraction = Math.min(1, Math.max(0, (progress - model.u) / model.w));
    return Math.floor(fraction * model.sections + 1e-9) / model.sections;
  };
  const snapshotAt = (minute) => {
    const states = {};
    for (const uf of allStates) {
      states[uf] = emptyTotals(
        uf,
        stateNames[uf],
        presidentialCandidates,
        regions[uf],
      );
    }
    const municipalities = new Float32Array(municipalModels.length * 4);
    for (const model of municipalModels) {
      const fraction = countedFraction(model, minute);
      accumulateModel(states[model.uf], model, fraction, stateData);
      recordLocalSnapshot(municipalities, model, fraction, stateData, model.uf);
    }
    const exterior = new Float32Array(exteriorModels.length * 4);
    if (!exteriorModels.length)
      accumulateModel(
        states[exteriorModel.uf],
        exteriorModel,
        countedFraction(exteriorModel, minute),
        stateData,
      );
    for (const model of exteriorModels) {
      const fraction = arrivedSections(model, minute);
      accumulateModel(states[model.uf], model, fraction, stateData);
      recordLocalSnapshot(exterior, model, fraction, stateData, 'ZZ');
    }
    const national = emptyTotals('BR', 'Brasil', presidentialCandidates);
    for (const uf of allStates) {
      accumulateState(national, states[uf]);
      if (uf !== 'ZZ')
        finalizeStateRaces(
          states[uf],
          races[uf],
          stateData,
          simulationRound.value,
        );
    }
    finalizeProgress(national);
    finalizeNationalRace(national, simulationRound.value);
    return {
      t: minute,
      nat: national,
      uf: states,
      muni: municipalities,
      zz: exterior,
      pres: presidentialCandidates,
      towns: true,
    };
  };
  return { snapshotAt };
}
