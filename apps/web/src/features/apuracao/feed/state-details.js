import { checkNumericColumns, checkVoteColumns } from './column-validation.js';
import { Geo } from '../geography.js';
/*
 * Feed preservado: state-details.
 * Dependências explícitas; a fábrica mantém apenas o estado desta responsabilidade.
 */
export function createStateDetails({
  emit,
  exteriorCount,
  fetchJson,
  isNonNegative,
  isOffline,
  live,
  now,
  presidentialCandidates,
}) {
  const detailCache = new Map();
  const loadingStates = new Set();
  const municipalityIndices = new Map(
    Geo.munis.map((p, L) => [String(p.id), L]),
  );
  const exteriorIndices = exteriorCount
    ? new Map(window.EXTERIOR.cidades.map((p, L) => [String(p[0]), L]))
    : new Map();
  const checkIdentifiers = (Q, L) => {
    if (L === 'ZZ') {
      for (const dt of Q)
        if (!exteriorIndices.has(String(dt))) return 'cidade ' + dt;
    } else
      for (const dt of Q) {
        const tt = municipalityIndices.get(String(dt));
        if (tt == null || Geo.munis[tt].uf !== L) return 'município ' + dt;
      }
    return null;
  };
  const checkStateDetail = (p, L) => {
    const Q = L === 'ZZ' ? p && p.tse : p && p.ibge;
    if (!p || p.versao !== 1 || p.uf !== L || !Array.isArray(Q) || !p.votos)
      return 'cabeçalho';
    const Pt = Q.length;
    const columns = checkNumericColumns(p, Pt, isNonNegative);
    if (columns) return columns;
    const votes = checkVoteColumns(p.votos, Pt, isNonNegative);
    if (votes) return votes;
    return checkIdentifiers(Q, L);
  };
  const loadStateDetail = (p) => {
    !live ||
      loadingStates.has(p) ||
      isOffline() ||
      (loadingStates.add(p),
      fetchJson(`uf/${p.toLowerCase()}.json`)
        .then((L) => {
          const Q = checkStateDetail(L, p);
          if (Q) throw new Error('detalhe inválido: ' + Q);
          const Pt = detailCache.get(p);
          if (Pt && Number.isInteger(L.seq) && L.seq < Pt.seq) return;
          const dt = new Map();
          ((p === 'ZZ' ? L.tse : L.ibge).forEach((tt, ae) => {
            const qt = presidentialCandidates.map(
              (Re) => +((L.votos[Re.n] || [])[ae] || 0),
            );
            dt.set(
              p === 'ZZ'
                ? exteriorIndices.get(String(tt))
                : municipalityIndices.get(String(tt)),
              {
                secoes: L.secoes[ae],
                totalizadas: L.totalizadas[ae],
                eleitorado: L.eleitorado[ae],
                apurado: L.apurado[ae],
                comparecimento: L.comparecimento[ae],
                brancos: L.brancos[ae],
                nulos: L.nulos[ae],
                votos: qt,
                validos: qt.reduce((Re, Ie) => Re + Ie, 0),
              },
            );
          }),
            detailCache.set(p, {
              at: now(),
              seq: Number.isInteger(L.seq) ? L.seq : 0,
              rows: dt,
            }),
            emit('detail', p));
        })
        .catch((L) => {
          (console.warn('[feed]', p, L.message),
            detailCache.set(p, {
              at: now() - 35e3,
              seq: (
                detailCache.get(p) || {
                  seq: 0,
                }
              ).seq,
              rows: (
                detailCache.get(p) || {
                  rows: new Map(),
                }
              ).rows,
            }));
        })
        .then(() => loadingStates.delete(p)));
  };
  const town = (p) => {
    const L = Geo.munis[p].uf,
      Q = detailCache.get(L);
    return (
      (!Q || now() - Q.at > 45e3) && loadStateDetail(L),
      (Q && Q.rows.get(p)) || null
    );
  };
  const city = (p) => {
    const L = detailCache.get('ZZ');
    return (
      (!L || now() - L.at > 45e3) && loadStateDetail('ZZ'),
      (L && L.rows.get(p)) || null
    );
  };
  return {
    checkStateDetail,
    city,
    detailCache,
    town,
  };
}
