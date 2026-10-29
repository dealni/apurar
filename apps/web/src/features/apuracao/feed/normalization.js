import { Fe, We } from '../object-helpers.js';
import { Sim } from '../simulation.js';
/*
 * Feed preservado: normalization.
 * Dependências explícitas; a fábrica mantém apenas o estado desta responsabilidade.
 */
export function createNormalization({
  allStates,
  candidateIndex,
  isFiniteNumber,
  presidentialCandidates,
  stride,
}) {
  const stateIdentity = (p) => ({
    uf: p,
    name: Sim.UF_NAME[p],
    region: Sim.REGION[p],
  });
  const normalizePresident = (p, L) => {
    const Q = presidentialCandidates.map((tt) => +(p.votos[tt.n] || 0));
    let Pt = 0;
    for (const tt in p.votos) Pt += +p.votos[tt] || 0;
    let dt = Pt;
    for (const tt of p.sj || []) dt += +(p.anulados || {})[tt] || 0;
    return We(Fe({}, stateIdentity(L)), {
      el: p.eleitorado,
      sections: p.secoes,
      secDone: p.totalizadas,
      elDone: p.apurado,
      votes: p.comparecimento,
      valid: Pt,
      base: dt,
      blank: p.brancos,
      nul: p.nulos,
      cand: Q,
      pst: p.totalizadas / p.secoes,
      left: Math.max(0, p.eleitorado - p.apurado),
      status: p.situacao,
      definido: isFiniteNumber(p.definido) ? p.definido : null,
    });
  };
  const normalizeCandidates = (p, L, Q) => {
    const Pt = L.anulados || {},
      dt = new Set(L.sj || []),
      tt = new Set(),
      ae = p.map((qt) => {
        tt.add(String(qt.n));
        const Re = String(qt.n) in Pt;
        return We(Fe({}, qt), {
          anulado: Re,
          sj: Re && dt.has(String(qt.n)),
          votes: +((Re ? Pt[qt.n] : L.votos[qt.n]) || 0),
        });
      });
    for (const qt in L.votos)
      if (!tt.has(qt) && L.votos[qt] > 0) {
        const Re =
          L.nomes && Array.isArray(L.nomes[qt])
            ? L.nomes[qt].map((Ie) => (typeof Ie == 'string' ? Ie : ''))
            : null;
        ae.push({
          id: Q + qt,
          n: +qt,
          name: (Re && Re[0]) || 'Candidatura ' + qt,
          partido: (Re && Re[1]) || '',
          sq: '',
          g: '',
          votes: L.votos[qt],
        });
      }
    return ae.sort(
      (qt, Re) => Re.votes - qt.votes || Number(qt.n) - Number(Re.n),
    );
  };
  const unpackRows = (p, L, Q, Pt) => {
    for (let dt = 0; dt < L; dt++) {
      const tt = Q[dt],
        ae = tt * stride,
        qt = p.l[dt] ? candidateIndex.get(+p.l[dt]) : 0,
        Re = qt != null;
      ((Pt[ae] = Re ? p.f[dt] / 1e3 : 0),
        (Pt[ae + 1] = Re ? qt : 0),
        (Pt[ae + 2] = Re ? p.m[dt] / 1e3 : 0),
        (Pt[ae + 3] = Re ? p.v[dt] : 0));
    }
    return Pt;
  };
  const normalizeProjection = (p) => {
    if (
      !p ||
      p.versao !== 1 ||
      !Array.isArray(p.n) ||
      p.n.length !== 2 ||
      !p.n.every((Q) => candidateIndex.has(+Q))
    )
      return null;
    const L = (Q) => isFiniteNumber(Q) && Q >= 0 && Q <= 1;
    return ![p.p, p.parte, p.faixa90, p.faixa98].every(L) ||
      p.faixa98 > 0.05 ||
      (p.chamada != null && !p.n.includes(String(p.chamada)))
      ? null
      : {
          p: p.p,
          by: {
            [+p.n[0]]: p.parte,
            [+p.n[1]]: 1 - p.parte,
          },
          band: p.faixa98,
          band90: p.faixa90,
          drift: isFiniteNumber(p.deriva) ? p.deriva : 0,
          call: p.chamada == null ? null : +p.chamada,
        };
  };
  const totalFields = [
    'secoes',
    'totalizadas',
    'eleitorado',
    'apurado',
    'comparecimento',
    'brancos',
    'nulos',
  ];
  const sumStates = (p) => {
    let L = 0;
    for (const Pt of allStates) L += p.uf[Pt].totalizadas;
    if (!(L > p.br.totalizadas)) return null;
    const Q = We(Fe({}, p.br), {
      votos: {},
    });
    for (const Pt of totalFields) Q[Pt] = 0;
    for (const Pt of allStates) {
      const dt = p.uf[Pt];
      for (const tt of totalFields) Q[tt] += dt[tt];
      for (const tt in dt.votos)
        Q.votos[tt] = (Q.votos[tt] || 0) + (+dt.votos[tt] || 0);
    }
    return Q;
  };
  return {
    normalizeCandidates,
    normalizePresident,
    normalizeProjection,
    sumStates,
    unpackRows,
  };
}
