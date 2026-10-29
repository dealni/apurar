import { Sim } from '../simulation.js';
export function createSnapshot({
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
  readCurrentSnapshot,
}) {
  let revision = 0;
  const latestMinute = {
    max: 0,
  };
  const confirmedWinners = new Map();
  const confirmWinner = (p, L, Q, Pt) => {
    const dt = L.slice().sort((ae, qt) => qt - ae);
    if (!(dt[0] > 0) || dt[0] - (dt[1] || 0) <= Q) return null;
    const tt = Math.min(
      confirmedWinners.has(p) ? confirmedWinners.get(p) : 1 / 0,
      Pt,
    );
    return (confirmedWinners.set(p, tt), tt);
  };
  const normalizeStates = (p) => {
    const Q = p.presidente;
    const Pt = {};
    for (const Ie of allStates) {
      const ln = (Pt[Ie] = normalizePresident(Q.uf[Ie], Ie));
      if (Ie === 'ZZ') continue;
      const Xn = Sim.RACES[Ie],
        Ls = p.governador.uf[Ie],
        Ps = p.senado.uf[Ie];
      ((ln.gov = Ls ? normalizeCandidates(Xn.gov, Ls, Ie + 'g') : []),
        (ln.govStatus = Ls ? Ls.situacao : null),
        (ln.govAt = Ls && isFiniteNumber(Ls.definido) ? Ls.definido : null),
        (ln.sen = Ps ? normalizeCandidates(Xn.sen, Ps, Ie + 's') : []),
        (ln.senStatus = Ps ? Ps.situacao : null),
        (ln.senAt = Ps && isFiniteNumber(Ps.definido) ? Ps.definido : null));
    }
    return Pt;
  };
  const applyConfirmedWinners = (p, tt, Pt, Re) => {
    const Ie = confirmWinner('BR', tt.cand, tt.left, Re);
    Ie != null && tt.status === 'apurando'
      ? ((tt.status = 'eleito'), (tt.definido = Ie), (tt.conta = !0))
      : Ie != null &&
        isFiniteNumber(tt.definido) &&
        (tt.definido = Math.min(tt.definido, Ie));
    for (const ln of states) {
      const Xn = Pt[ln],
        Ls = p.governador.uf[ln];
      if (!Ls || !Xn.gov.length) continue;
      const Ps = confirmWinner(
        'g' + ln,
        Xn.gov.filter((Co) => !Co.anulado).map((Co) => Co.votes),
        Math.max(0, Ls.eleitorado - Ls.apurado),
        Re,
      );
      Ps != null && Xn.govStatus === 'apurando'
        ? ((Xn.govStatus = 'eleito'), (Xn.govAt = Ps), (Xn.govConta = !0))
        : Ps != null &&
          isFiniteNumber(Xn.govAt) &&
          (Xn.govAt = Math.min(Xn.govAt, Ps));
    }
  };
  const toSnapshot = (p, L) => {
    const Q = p.presidente,
      Pt = {};
    Object.assign(Pt, normalizeStates(p));
    const dt = sumStates(Q),
      tt = normalizePresident(dt || Q.br, 'BR');
    ((tt.name = 'Brasil'),
      (tt.order = tt.cand
        .map((Ie, ln) => [Ie, ln])
        .sort((Ie, ln) => ln[0] - Ie[0])
        .map((Ie) => Ie[1])));
    const ae = new Float32Array(municipalityCount * stride),
      qt = new Float32Array(exteriorCount * stride);
    L &&
      (unpackRows(L.br, municipalityCount, municipalityOrder, ae),
      exteriorCount &&
        L.zz &&
        unpackRows(L.zz, exteriorCount, exteriorOrder, qt));
    let Re = dt ? Math.max(p.t, Math.floor(minuteOf(p.gerado))) : p.t;
    if (
      (p === readCurrentSnapshot() &&
        (Re = latestMinute.max = Math.max(latestMinute.max, Re)),
      config.turno === 2)
    ) {
      applyConfirmedWinners(p, tt, Pt, Re);
    }
    return {
      t: p.t,
      at: Re,
      seq: p.seq,
      museq: L ? L.seq : null,
      rev: ++revision,
      gerado: p.gerado,
      nat: tt,
      uf: Pt,
      muni: ae,
      zz: qt,
      pres: presidentialCandidates,
      towns: !!L,
      live: !0,
      proj:
        config.turno === 2 ? normalizeProjection(p.presidente.projecao) : null,
    };
  };
  return toSnapshot;
}
