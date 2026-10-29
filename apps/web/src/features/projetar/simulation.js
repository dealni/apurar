// Fachada de compatibilidade visual. Não executa modelos de simulação ou previsão.
import { Geo } from "./geography.js";
import {
  regions,
  stateNames,
  stateArticles,
} from "./simulation/state-geography.js";
const states = Object.keys(Geo.ufs).sort();
const allStates = [...states, "ZZ"];
const candidates = (window.CANDIDATOS?.presidente || []).map((candidate) => ({
  id: "p" + candidate.n,
  n: candidate.n,
  name: candidate.exib || candidate.nome,
  short: candidate.exib || candidate.nome,
  partido: candidate.partido || "",
  sq: "",
  g: "",
}));
const emptyRow = (uf) => ({
  uf,
  name: stateNames[uf] || uf,
  region: regions[uf] || "",
  el: null,
  sections: 0,
  secDone: 0,
  elDone: null,
  votes: null,
  valid: 0,
  base: 0,
  blank: null,
  nul: null,
  cand: [0, 0],
  pst: 0,
  left: null,
  status: "apurando",
  definido: null,
  gov: [],
  sen: [],
  govStatus: null,
  senStatus: null,
  order: [0, 1],
});
const empty = () => ({
  t: 1020,
  at: 1020,
  seq: "aguardando",
  gerado: 0,
  nat: emptyRow("BR"),
  uf: Object.fromEntries(allStates.map((uf) => [uf, emptyRow(uf)])),
  muni: new Float32Array(Geo.munis.length * 4),
  zz: new Float32Array((window.EXTERIOR?.cidades?.length || 0) * 4),
  pres: candidates,
  towns: false,
  live: true,
  empty: true,
  proj: null,
});
const Sim = {
  at: () => window.APURAR_CURRENT_VIEW?.() || empty(),
  FINAL: null,
  PRES: candidates,
  UFS: states,
  ALL: allStates,
  UF_NAME: stateNames,
  UF_ART: stateArticles,
  REGION: regions,
  UF_DATA: Object.fromEntries(
    allStates.map((uf) => [uf, new Array(12).fill(0)]),
  ),
  RACES: Object.fromEntries(states.map((uf) => [uf, { gov: [], sen: [] }])),
  M: Geo.munis.map((place) => ({
    uf: place.uf,
    el: null,
    sec: null,
    share: [0, 0],
    turnout: null,
  })),
  X: [],
  ARRIVE: [],
  XARRIVE: [],
  RUNOFF: [],
  T1: null,
  fmtClock: (minute) =>
    String(Math.floor((((minute % 1440) + 1440) % 1440) / 60)).padStart(
      2,
      "0",
    ) +
    ":" +
    String(Math.floor(((minute % 60) + 60) % 60)).padStart(2, "0"),
  OPEN: 1020,
  END: 1440,
  real: false,
  TURNO: 2,
  DIA: "2026-10-25",
};
export { Sim };
