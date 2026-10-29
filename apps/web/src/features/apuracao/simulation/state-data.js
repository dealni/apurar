import {
  regions,
  stateNames,
  stateArticles,
  arrivalTimes,
} from './state-geography.js';
import { stateData } from './state-votes.js';

/** Isola os parâmetros mutáveis entre instâncias de primeiro e segundo turno. */
export function createStateData() {
  return structuredClone({
    arrivalTimes,
    regions,
    stateArticles,
    stateData,
    stateNames,
  });
}
