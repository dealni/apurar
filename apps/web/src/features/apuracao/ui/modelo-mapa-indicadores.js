import {
  Dt,
  Pe,
  ie,
  _t,
  nt,
  lt,
  ue,
  yt,
  pe,
  y,
} from './formatacao-e-acessibilidade-1.js';
import { bn, hs, Ts } from './apuracao-e-votos-1.js';
import { Ru, Zu, Ri, wl, Fu, Cl, Os, Go, Zi, Du, Ou } from './mapa-dados-1.js';
import { Feed } from '../feed.js';
import { Sim } from '../simulation.js';
import { fe } from './municipios-e-distritos-1.js';

export const modeloApuracao = () => ({
  key: 'a',
  hatch: !1,
  town: (t, e) => Dt(t, e),
  city: (t, e) => bn(t, e),
  zone: (t) => t.f,
  uf: (t) => t.pst,
  local: (t, e, n) => n.f,
  fill: Ru,
  text: (t) => Zu(t) + '%',
  say: (t) => Pe(t) + '% das seções apuradas',
});

export const modeloAbstencao = (t) => {
  const e = t.live && t.towns ? Feed.comp() : null,
    n = t.live && !e && (!t.towns || Feed.compOff()),
    s = t.live && !e && !n,
    a = !!e && t.museq != null && e.seq < t.museq,
    r = (i) => (i > 0 ? 1 - i : null),
    u = (i) => !(s || (a && !(i > 0)));
  return {
    key: 'b' + (t.live ? (e ? e.seq + (a ? 'b' : '') : n ? 'x' : 'w') : ''),
    hatch: !0,
    wait: s,
    off: n,
    town: (i, c) => {
      const l = i.live ? (e ? e.br[c] : 0) : Sim.M[c].turnout;
      return u(l) ? r(l) : null;
    },
    city: (i, c) => {
      const l = i.live
        ? e
          ? e.zz[c]
          : 0
        : Sim.X && Sim.X[c]
          ? Sim.X[c].turnout
          : 0;
      return u(l) ? r(l) : null;
    },
    zone: (i) => (i.turnout > 0 ? 1 - i.turnout : null),
    uf: (i) => (i.elDone > 0 ? 1 - i.votes / i.elDone : null),
    local: (i, c, l, d, $) => {
      if (d.live || !(i.t1.ap[c] > 0)) return null;
      const f = i.t1.ap.reduce((g, v) => g + v, 0),
        m = i.t1.cp.reduce((g, v) => g + v, 0),
        h = Sim.M[$].turnout;
      return m > 0
        ? ie(1 - ((i.t1.cp[c] / i.t1.ap[c]) * h) / (m / f), 0, 1)
        : null;
    },
    fill: (i) => Ri[wl(Fu, i)],
    text: (i) => _t(i, 0) + '%',
    say: (i) => 'abstenção de ' + _t(i) + '%',
  };
};

export const modeloPrimeiroTurno = () => {
  const t = Cl(),
    e = (s) => (Number.isFinite(s) ? s : null),
    n = (s, a) => {
      const r = s.t1 && s.t1.v;
      if (!r || !r[fe[0]] || !r[fe[1]]) return null;
      let u = 0,
        i = 0;
      for (const c of a) {
        for (const l in r) l !== 'b' && l !== 'n' && (u += r[l][c]);
        i += r[fe[1]][c] - r[fe[0]][c];
      }
      return u > 0 ? i / u : null;
    };
  return {
    key: 'r' + (t ? 1 : 0),
    hatch: !1,
    wait: !t,
    town: (s, a) => (t ? e(t.br[a * 2 + 1] - t.br[a * 2]) : null),
    city: (s, a) => (t ? e(t.zz[a * 2 + 1] - t.zz[a * 2]) : null),
    uf: (s) => (t && t.uf[s.uf] ? t.uf[s.uf][1] - t.uf[s.uf][0] : null),
    local: (s, a) => n(s, [a]),
    group: n,
    fill: (s) => Os(nt(lt[s > 0 ? 1 : 0]))[Go(Math.abs(s))],
    dot: (s) => nt(lt[s > 0 ? 1 : 0]),
    text: (s) =>
      Math.abs(s) < 0.0095
        ? ue[1].format(Math.abs(s) * 100)
        : ue[0].format(Math.round(Math.abs(s) * 100)),
    say: (s) => {
      const a = Math.round(Math.abs(s) * 1e3) / 10;
      return `no 1º turno, ${yt(lt[s > 0 ? 1 : 0])} à frente por ${ue[1].format(a)} ${a < 2 ? 'ponto' : 'pontos'}`;
    },
  };
};

export const modeloMudanca = () => {
  const t = Cl(),
    e = (n) => (Number.isFinite(n) ? n : null);
  return {
    key: 'm' + (t ? 1 : 0),
    hatch: !0,
    wait: !t,
    town: (n, s) =>
      t ? e(Zi(pe(n, s), y(n, s)) - (t.br[s * 2 + 1] - t.br[s * 2])) : null,
    city: (n, s) =>
      t ? e(Zi(hs(n, s), Ts(n, s)) - (t.zz[s * 2 + 1] - t.zz[s * 2])) : null,
    uf: (n) =>
      t && t.uf[n.uf] ? Du(n) - (t.uf[n.uf][1] - t.uf[n.uf][0]) : null,
    local: (n, s, a) => {
      const r = n.t1.v,
        u = a.list.find((l) => l.k === 0),
        i = a.list.find((l) => l.k === 1),
        c = Object.keys(r).reduce(
          (l, d) => l + (d === 'b' || d === 'n' ? 0 : r[d][s]),
          0,
        );
      return !c || !r[fe[0]] || !r[fe[1]]
        ? null
        : (i ? i.share : 0) -
            (u ? u.share : 0) -
            (r[fe[1]][s] - r[fe[0]][s]) / c;
    },
    fill: (n) => Os(nt(lt[n > 0 ? 1 : 0]))[wl(Ou, Math.abs(n))],
    dot: (n) => nt(lt[n > 0 ? 1 : 0]),
    text: (n) =>
      '+' +
      (Math.abs(n) < 0.0095
        ? ue[1].format(Math.abs(n) * 100)
        : ue[0].format(Math.round(Math.abs(n) * 100))),
    say: (n) => {
      const s = Math.round(Math.abs(n) * 1e3) / 10;
      return `${ue[1].format(s)} ${s < 2 ? 'ponto' : 'pontos'} a favor de ${yt(lt[n > 0 ? 1 : 0])} desde o 1º turno`;
    },
  };
};
