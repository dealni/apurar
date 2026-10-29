/*
 * Feed preservado: candidate-details.
 * Dependências explícitas; a fábrica mantém apenas o estado desta responsabilidade.
 */
export function createCandidateDetails({
  config,
  readCurrentSnapshot,
  emit,
  exteriorCount,
  exteriorOrder,
  fetchJson,
  isNonNegative,
  isOffline,
  live,
  readMunicipalSnapshot,
  municipalityCount,
  municipalityOrder,
  now,
}) {
  const detailFiles = new Map();
  const detailRequests = new Map();
  const detailFailures = new Map();
  const detailContracts = {
    cand: (p) => ({
      key: 'c' + p,
      path: `candidatos/${p}.json`,
      units: {
        1: 1e3,
        2: 1e5,
      },
      head: (L) => L.n === p,
    }),
    comp: () => ({
      key: 'comp',
      path: 'comparecimento.json',
      units: {
        1: 1e5,
      },
      head: () => !0,
    }),
  };
  const checkDetailFile = (p, L) => {
    const Q = p && L.units[p.versao],
      Pt = (dt) => isNonNegative(dt) && dt <= Q;
    return !Q || !L.head(p) || !Number.isSafeInteger(p.seq) || p.seq < 0
      ? 'cabeçalho'
      : (p.turno == null ? 1 : p.turno) !== config.turno
        ? 'turno ' + p.turno
        : !Array.isArray(p.br) ||
            p.br.length !== municipalityCount ||
            !p.br.every(Pt)
          ? 'br'
          : p.zz != null &&
              (!Array.isArray(p.zz) ||
                p.zz.length !== exteriorCount ||
                !p.zz.every(Pt))
            ? 'zz'
            : null;
  };
  const checkCandidate = (p, L) => checkDetailFile(p, detailContracts.cand(L));
  const checkTurnout = (p) => checkDetailFile(p, detailContracts.comp());
  const loadDetailFile = (p) => {
    (detailRequests.set(p.key, now()),
      fetchJson(p.path)
        .then((L) => {
          const Q = checkDetailFile(L, p);
          if (Q) throw new Error('arquivo inválido: ' + Q);
          if (
            (detailFailures.delete(p.key),
            readCurrentSnapshot() && L.seq > readCurrentSnapshot().seq + 86400)
          )
            throw new Error('arquivo inválido: seq');
          const Pt = detailFiles.get(p.key);
          if (Pt && L.seq <= Pt.seq) return;
          const dt = new Float32Array(municipalityCount),
            tt = new Float32Array(exteriorCount),
            ae = p.units[L.versao];
          for (let qt = 0; qt < municipalityCount; qt++)
            dt[municipalityOrder[qt]] = L.br[qt] / ae;
          if (L.zz)
            for (let qt = 0; qt < exteriorCount; qt++)
              tt[exteriorOrder[qt]] = L.zz[qt] / ae;
          (detailFiles.set(p.key, {
            seq: L.seq,
            br: dt,
            zz: tt,
          }),
            emit('detail', p.key));
        })
        .catch((L) => {
          const Q =
            (
              detailFailures.get(p.key) || {
                k: 0,
              }
            ).k + 1;
          (detailFailures.set(p.key, {
            k: Q,
            wait: L.retry || Math.min(6e4, 1e4 * Math.pow(2, Q - 1)),
          }),
            console.warn('[feed]', p.path, L.message),
            emit('detail', p.key));
        }));
  };
  const getDetailFile = (p) => {
    const L = detailFiles.get(p.key) || null,
      Q = detailFailures.get(p.key),
      Pt = now() - (detailRequests.get(p.key) || 0),
      dt = readMunicipalSnapshot() ? readMunicipalSnapshot().seq : 0;
    return (
      live &&
        !isOffline() &&
        (!L || L.seq < dt) &&
        Pt > (Q ? Q.wait : 3e3) &&
        loadDetailFile(p),
      L
    );
  };
  const isDetailUnavailable = (p) =>
    !detailFiles.has(p.key) && detailFailures.has(p.key);
  const candidate = (p) => getDetailFile(detailContracts.cand(p));
  const candidateUnavailable = (p) =>
    isDetailUnavailable(detailContracts.cand(p));
  const turnout = () => getDetailFile(detailContracts.comp());
  const turnoutUnavailable = () => isDetailUnavailable(detailContracts.comp());
  return {
    candidate,
    candidateUnavailable,
    checkCandidate,
    checkTurnout,
    detailFiles,
    turnout,
    turnoutUnavailable,
  };
}
