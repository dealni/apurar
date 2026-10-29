import { createSnapshot } from './feed/snapshot.js';
import { createJsonTransport } from './feed/transport.js';
import { Fe } from './object-helpers.js';
import { Geo } from './geography.js';
import { Sim } from './simulation.js';
import { createEvents } from './feed/events.js';
import { createSimulationCache } from './feed/simulation-cache.js';
import { createValidation } from './feed/validation.js';
import { createNormalization } from './feed/normalization.js';
import { createStateDetails } from './feed/state-details.js';
import { createCandidateDetails } from './feed/candidate-details.js';
import { createZones } from './feed/zones.js';
import { createArchive } from './feed/archive.js';
const config = Object.assign(
  {
    modo: 'sim',
    feed: [],
    build: 'dev',
    intervalo: 15,
    dia: '2026-10-04',
    turno: 1,
  },
  window.APURACAO || {},
);
const live = config.modo === 'ao-vivo' && config.feed.length > 0;
const municipalityCount = Geo.munis.length;
const exteriorCount = (window.EXTERIOR && window.EXTERIOR.cidades.length) || 0;
const stride = 4;
const presidentialCandidates = Sim.PRES;
const allStates = Sim.ALL;
const states = Sim.UFS;
const now = () => Date.now();
const [year, month, day] = config.dia.split('-').map(Number);
const electionStart = Date.UTC(year, month - 1, day, 3, 0, 0);
const minuteOf = (p) => (p - electionStart) / 6e4;
const { emit, subscribe } = createEvents();
const { simulationAt } = createSimulationCache();
const {
  checkCurrent,
  checkMunicipalities,
  isFiniteNumber,
  isNonNegative,
  singleSeatStatuses,
} = createValidation({
  allStates,
  config,
  exteriorCount,
  municipalityCount,
  states,
});
const municipalityOrder = Geo.munis
  .map((p, L) => [String(p.id), L])
  .sort((p, L) => (p[0] < L[0] ? -1 : 1))
  .map((p) => p[1]);
const exteriorOrder = exteriorCount
  ? window.EXTERIOR.cidades
      .map((p, L) => [String(p[0]), L])
      .sort((p, L) => (p[0] < L[0] ? -1 : 1))
      .map((p) => p[1])
  : [];
const candidateIndex = new Map(presidentialCandidates.map((p, L) => [+p.n, L]));
const {
  normalizeCandidates,
  normalizePresident,
  normalizeProjection,
  sumStates,
  unpackRows,
} = createNormalization({
  allStates,
  candidateIndex,
  isFiniteNumber,
  presidentialCandidates,
  stride,
});
const toSnapshot = createSnapshot({
  allStates,
  states,
  config,
  municipalityCount,
  exteriorCount,
  stride,
  municipalityOrder,
  exteriorOrder,
  presidentialCandidates,
  normalizePresident,
  normalizeCandidates,
  sumStates,
  unpackRows,
  normalizeProjection,
  isFiniteNumber,
  minuteOf,
  readCurrentSnapshot: () => currentSnapshot,
});
const status = {
  estado: live ? 'conectando' : 'sim',
  ultimo: 0,
  mudou: 0,
  t: null,
  falhas: 0,
  motivo: '',
  aviso: null,
};
const updateStatus = (p) => {
  (Object.assign(status, p), emit('status', Fe({}, status)));
};
let currentSnapshot = null;
let municipalSnapshot = null;
let feedIndex = 0;
let failures = 0;
let pollTimer = 0;
let _municipalTimer = 0;
let loading = !1;
let retryTimer = 0;
let municipalLoading = !1;
let started = !1;
const { fetchJson } = createJsonTransport({
  readBase: () => config.feed[feedIndex],
});
const isHidden = () =>
  typeof document != 'undefined' && document.visibilityState === 'hidden';
const isOffline = () =>
  typeof navigator != 'undefined' && navigator.onLine === !1;
const finishedInterval = 3e5;
const isComplete = (p) => !!p && p.secoes > 0 && p.totalizadas >= p.secoes;
const isElectionOver = () =>
  !!currentSnapshot &&
  isComplete(currentSnapshot.presidente.br) &&
  ['governador', 'senado'].every((p) =>
    Object.values(currentSnapshot[p].uf).every(isComplete),
  );
const pollInterval = (p) =>
  isElectionOver() ? Math.max(p, finishedInterval) : p;
const schedulePollingDisabled = () => {};
const isNewerSnapshot = (p) =>
  !currentSnapshot ||
  p.seq > currentSnapshot.seq ||
  (p.seq < currentSnapshot.seq && p.gerado > currentSnapshot.gerado + 6e4);
const applyCurrentSnapshot = (p, Pt) => {
  Pt &&
    (currentSnapshot &&
      p.seq < currentSnapshot.seq &&
      (detailFiles.clear(),
      zoneCache.clear(),
      detailCache.clear(),
      (municipalSnapshot = null)),
    (currentSnapshot = p));
};
const refreshMunicipalities = async (dt) => {
  let tt = !1;
  if (
    (!municipalSnapshot || municipalSnapshot.seq !== currentSnapshot.seq) &&
    (dt - retryTimer > 2e4 || (!municipalSnapshot && !municipalLoading))
  ) {
    retryTimer = dt;
    try {
      const qt = await fetchJson('municipios.json'),
        Re = checkMunicipalities(qt);
      if (Re) throw new Error(Re);
      ((tt = !municipalSnapshot || qt.seq !== municipalSnapshot.seq),
        (municipalSnapshot = qt),
        (municipalLoading = !1));
    } catch (qt) {
      ((municipalLoading = !0), console.warn('[feed] municípios:', qt.message));
    }
  }
  return tt;
};
const handleCurrentFailure = (p) => {
  (failures++,
    (_municipalTimer = p.retry || 0),
    failures >= 3 &&
      config.feed.length > 1 &&
      (feedIndex = (feedIndex + 1) % config.feed.length),
    console.warn('[feed]', p.message),
    updateStatus({
      estado: isOffline()
        ? 'sem-conexao'
        : currentSnapshot
          ? 'reconectando'
          : 'conectando',
      falhas: failures,
      motivo: p.message,
    }));
};
const refreshCurrent = async () => {
  if (!loading) {
    loading = !0;
    try {
      const p = await fetchJson('agora.json'),
        L = p && typeof p == 'object' ? (p.turno == null ? 1 : p.turno) : 0;
      L > config.turno && requestReloadDisabled('turno-' + L, !0);
      const Q = checkCurrent(p);
      if (Q) throw new Error('dados inválidos: ' + Q);
      ((failures = 0), (_municipalTimer = 0));
      const Pt = isNewerSnapshot(p),
        dt = now();
      applyCurrentSnapshot(p, Pt);
      const tt = await refreshMunicipalities(dt);
      (Pt || tt) &&
        ((peek.s = null),
        emit('snap', toSnapshot(currentSnapshot, municipalSnapshot)));
      const ae = Pt ? dt : status.mudou || dt;
      updateStatus({
        estado: isStale(ae) ? 'parado' : 'ao-vivo',
        ultimo: dt,
        mudou: ae,
        t: p.t,
        falhas: 0,
        motivo: '',
        aviso: p.aviso || null,
      });
    } catch (p) {
      handleCurrentFailure(p);
    } finally {
      ((loading = !1), schedulePollingDisabled());
    }
  }
};
let _reloadPending = !1;
let pendingBuild = null;
const isFullscreen = () =>
  typeof document != 'undefined' &&
  !!(document.fullscreenElement || document.webkitFullscreenElement);
const requestReloadDisabled = () => {};
const flushPendingBuild = () => {
  if (pendingBuild && !isFullscreen()) {
    const p = pendingBuild;
    ((pendingBuild = null), requestReloadDisabled(p));
  }
};
typeof document != 'undefined' &&
  (document.addEventListener('fullscreenchange', flushPendingBuild),
  document.addEventListener('webkitfullscreenchange', flushPendingBuild));
const _visibilityChanged = () => {
  if (started) {
    if (isHidden()) {
      (clearTimeout(pollTimer), (pollTimer = 0));
      return;
    }
    if (isOffline()) {
      updateStatus({
        estado: 'sem-conexao',
      });
      return;
    }
    schedulePollingDisabled(0);
  }
};
const checkHistory = (p) => {
  if (!p || p.versao !== 1 || !Array.isArray(p.pontos)) return 'cabeçalho';
  for (const L of p.pontos) {
    if (
      !L ||
      !isFiniteNumber(L.t) ||
      !isNonNegative(L.totalizadas) ||
      !(L.secoes > 0) ||
      L.totalizadas > L.secoes ||
      !L.votos
    )
      return 'ponto';
    for (const Q in L.votos) if (!isNonNegative(L.votos[Q])) return 'votos';
  }
  return null;
};
const refreshHistory = () =>
  fetchJson('historico.json')
    .then((p) => {
      const L = checkHistory(p);
      if (L) throw new Error('histórico inválido: ' + L);
      emit(
        'history',
        p.pontos
          .map((Q) => {
            const Pt = presidentialCandidates.map(
                (tt) => +(Q.votos[tt.n] || 0),
              ),
              dt = Pt.reduce((tt, ae) => tt + ae, 0);
            return {
              t: Q.t,
              pst: Q.totalizadas / Q.secoes,
              sh: Pt.map((tt) => (dt ? tt / dt : 0)),
              status: singleSeatStatuses.has(Q.situacao)
                ? Q.situacao
                : 'apurando',
            };
          })
          .sort((Q, Pt) => Q.t - Pt.t),
      );
    })
    .catch((p) => console.warn('[feed]', p.message));
const startCapturedSnapshot = () => {
  if (!live || started) return;
  started = true;
  refreshHistory();
  refreshCurrent();
};
const isStale = (p) => {
  const L = currentSnapshot && currentSnapshot.presidente.br;
  return (
    !!L && L.totalizadas > 0 && L.totalizadas < L.secoes && now() - p > 18e4
  );
};
const { checkStateDetail, city, detailCache, town } = createStateDetails({
  emit,
  exteriorCount,
  fetchJson,
  isNonNegative,
  isOffline,
  live,
  now,
  presidentialCandidates,
});
const {
  candidate,
  candidateUnavailable,
  checkCandidate,
  checkTurnout,
  detailFiles,
  turnout,
  turnoutUnavailable,
} = createCandidateDetails({
  config,
  readCurrentSnapshot: () => currentSnapshot,
  emit,
  exteriorCount,
  exteriorOrder,
  fetchJson,
  isNonNegative,
  isOffline,
  live,
  readMunicipalSnapshot: () => municipalSnapshot,
  municipalityCount,
  municipalityOrder,
  now,
});
const { checkZones, zoneCache, zones } = createZones({
  config,
  readCurrentSnapshot: () => currentSnapshot,
  emit,
  fetchJson,
  isNonNegative,
  isOffline,
  live,
  now,
  presidentialCandidates,
});
const { load, minutes } = createArchive({
  checkCurrent,
  checkMunicipalities,
  readCurrentSnapshot: () => currentSnapshot,
  fetchJson,
  isFiniteNumber,
  live,
  readMunicipalSnapshot: () => municipalSnapshot,
  now,
  simulationAt,
  toSnapshot,
});
const peek = (p) =>
  live
    ? currentSnapshot && (p == null || p >= currentSnapshot.t)
      ? peek.s &&
        peek.s.seq === currentSnapshot.seq &&
        peek.s.towns === !!municipalSnapshot
        ? peek.s
        : (peek.s = toSnapshot(currentSnapshot, municipalSnapshot))
      : null
    : simulationAt(p);
const Feed = {
  CFG: config,
  LIVE: live,
  STRIDE: stride,
  minuteOf: minuteOf,
  on: subscribe,
  start: startCapturedSnapshot,
  over: isElectionOver,
  every: pollInterval,
  peek: peek,
  load: load,
  minutes: minutes,
  town: town,
  city: city,
  cand: candidate,
  candOff: candidateUnavailable,
  comp: turnout,
  compOff: turnoutUnavailable,
  zones: zones,
  json: (p, L) => fetchJson(p, L),
  status: () => Fe({}, status),
  checkAgora: checkCurrent,
  checkMuni: checkMunicipalities,
  checkDetail: checkStateDetail,
  checkHistory: checkHistory,
  checkCand: checkCandidate,
  checkComp: checkTurnout,
  checkZones: checkZones,
  toSnap: toSnapshot,
  diag: () => ({
    base: config.feed[feedIndex],
    fails: failures,
    seq: currentSnapshot && currentSnapshot.seq,
    st: Fe({}, status),
  }),
};
export { Feed };
