import {
  modeloApuracao,
  modeloAbstencao,
  modeloPrimeiroTurno,
  modeloMudanca,
} from './modelo-mapa-indicadores.js';
import { nt, lt, html } from './formatacao-e-acessibilidade-1.js';
import { Ks } from './apuracao-e-votos-1.js';
import { wl, _eState, _nState, Fs, Ba, gl, Pu, Lu } from './mapa-dados-1.js';
import { Feed } from '../feed.js';
import { Sim } from '../simulation.js';

import { Fe, We } from '../object-helpers.js';
import { Gi } from './mapa-geometria-1.js';
export let Di, _r, Vi, Ni, zr, Ml, qi;
export function initialize() {
  Di = {
    apur: modeloApuracao,
    abst: modeloAbstencao,
    t1r: modeloPrimeiroTurno,
    mud: modeloMudanca,
  };
  _r = (t) => Object.prototype.hasOwnProperty.call(Di, t);
  Vi = (t, e) =>
    Fe(
      {
        id: e,
      },
      Di[e](t),
    );
  Ni = (t) =>
    html`${_eState.value.dot ? html`<i style=${'background:' + _eState.value.dot(t)}></i>` : null}${_eState.value.text(t)}`;
  zr = () =>
    !!(
      (_nState.value && _nState.value.off) ||
      (_eState.value && _eState.value.off)
    );
  Ml = (t, e) => {
    if (!_eState.value || e !== 'pres' || !Ks(t, e)) return Gi(t, e);
    const n = t.pst > 0 ? _eState.value.uf(t) : null;
    if (n == null)
      return {
        fill: Fs,
        ink: '#8a8f98',
        tex: null,
      };
    const s = _eState.value.fill(n);
    return {
      fill: s,
      ink: Ba(s, gl),
      tex: null,
    };
  };
  qi = (t, e) => {
    const n = lt[e],
      s = Pu(nt(n)),
      a = t.pres.find((v) => v.k === e),
      r = a && a.share > 0 ? a.share : 0,
      u = r || 0.1,
      i = Lu.map((v, M) =>
        M < 3 ? v * u : Math.min(v * u, u + (1 - u) * (M - 2) * 0.3),
      ),
      c = t.live && t.towns ? Feed.cand(+n.n) : null,
      l = t.live && !c && (!t.towns || Feed.candOff(+n.n)),
      d = t.live && !c && !l,
      $ = !!c && t.museq != null && c.seq < t.museq,
      f = (v) => (t.live ? (c ? c.br[v] : 0) : Sim.M[v].share[e] || 0),
      m = (v) =>
        t.live
          ? c && c.zz
            ? c.zz[v]
            : 0
          : (Sim.X && Sim.X[v] && Sim.X[v].share[e]) || 0,
      h = (v) => s[wl(i, v)],
      g = (v) => d || l || ($ && !(v > 0));
    return {
      k: e,
      c: n,
      tones: s,
      steps: i,
      S: r,
      wait: d,
      off: l,
      key: chaveCandidato(e, t, c, $, l),
      br: f,
      zz: m,
      tone: h,
      fill: (v) => (g(f(v)) ? Fs : h(f(v))),
      fillX: (v) => (g(m(v)) ? Fs : h(m(v))),
      ofUF: (v) =>
        v.pres.find((M) => M.k === e) ||
        We(Fe({}, n), {
          k: e,
          votes: 0,
          share: 0,
        }),
    };
  };
}

function chaveCandidato(candidato, estado, feed, atrasado, indisponivel) {
  const versao = feed
    ? feed.seq + (atrasado ? 'b' : '')
    : indisponivel
      ? 'x'
      : 'w';
  return candidato + ':' + (estado.live ? versao : '');
}
