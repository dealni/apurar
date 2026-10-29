import { ie, nt, lt, ce } from './formatacao-e-acessibilidade-1.js';
import { zt } from './municipios-e-distritos-2.js';
import { bn, hs, Ts } from './apuracao-e-votos-1.js';
import { _eState, _nState, Os, Go, Fs, gl, Va, Uo } from './mapa-dados-1.js';
import { Ha, Al } from './mapa-geometria-1.js';
import { Sim } from '../simulation.js';
import { Ml } from './mapa-dados-2.js';
import { Geo } from '../geography.js';
import { Rr } from './mapa-geometria-2.js';
import { criarDistribuidor } from './modelo-mapa-selecao-layout.js';
export let Sl, Wu, Yi, Ku, Zr, Xu, ca, Ji, xl, Yu, Ju, Qu, Dr, Qi, tc, ec;
function initializeDesenho() {
  Sl = (t, e) => ie(2.1 + 2.3 * Math.sqrt(zt.cities[t].el / 8e3), 2.4, 11) * e;
  Wu = '#8a8f98';
  Yi = (t, e, n, s, a, r, u, i) => {
    const c = zt.cities[s],
      l = e.ox + c.c[0] * e.k,
      d = e.oy + c.c[1] * e.k,
      $ = Sl(s, a),
      f = r ? 0 : bn(n, s);
    ((t.globalAlpha = u ? 0.28 : 1),
      t.beginPath(),
      t.arc(l, d, $, 0, Math.PI * 2));
    const m = f <= 0 && c.closes <= n.t;
    ((t.fillStyle = corMunicipio(n, s, f, m)),
      t.fill(),
      (t.lineWidth = 1.2),
      (t.strokeStyle =
        f > 0 ? gl : m ? 'rgba(208,214,224,.62)' : 'rgba(208,214,224,.2)'),
      t.stroke(),
      f > 0 &&
        f < 1 &&
        $ >= 3.4 &&
        (t.beginPath(),
        t.arc(l, d, $ + 2.4, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * f),
        (t.lineWidth = 1.4),
        (t.strokeStyle = 'rgba(208,214,224,.82)'),
        t.stroke()),
      i &&
        (t.save(),
        (t.shadowColor = 'rgba(208,214,224,.4)'),
        (t.shadowBlur = 8),
        t.beginPath(),
        t.arc(l, d, $ + 4.6, 0, Math.PI * 2),
        (t.lineWidth = 2),
        (t.strokeStyle = '#FAFAF9'),
        t.stroke(),
        t.restore()),
      (t.globalAlpha = 1));
  };
  Ku = (t, e, n, s) => {
    (t.save(),
      t.translate(e.ox, e.oy),
      t.scale(e.k, e.k),
      (t.lineJoin = 'round'),
      (t.fillStyle = Va),
      t.fill(zt.land, 'evenodd'),
      (t.strokeStyle = 'rgba(208,214,224,.07)'),
      (t.lineWidth = 0.8 / e.k),
      t.stroke(zt.land),
      (t.globalAlpha = 0.42));
    for (const u of Sim.UFS)
      ((t.fillStyle = Ml(n.ufs[u], 'pres').fill), t.fill(Al(u)));
    ((t.globalAlpha = 1),
      (t.strokeStyle = 'rgba(208,214,224,.18)'),
      (t.lineWidth = 0.9 / e.k),
      t.stroke(Geo.lines.edge),
      t.restore());
    const a = s.zk || 1,
      r = s.country;
    for (const u of Rr)
      Yi(
        t,
        e,
        n,
        u,
        a,
        !!(s.holdX && s.holdX.has(u)),
        !!r && zt.cities[u].iso !== r,
        s.town === u,
      );
  };
}

function initializeBrilho() {
  Zr = new Map();
  Xu = (t) => {
    if (Zr.has(t)) return Zr.get(t);
    const e = document.createElement('canvas'),
      n = e.getContext('2d'),
      [s, a, r] = ce(t),
      u = (c) => Math.round(c + (255 - c) * 0.25);
    e.width = e.height = 64;
    const i = n.createRadialGradient(32, 32, 0, 32, 32, 32);
    return (
      i.addColorStop(0, `rgba(${u(s)},${u(a)},${u(r)},1)`),
      i.addColorStop(0.18, `rgba(${s},${a},${r},.9)`),
      i.addColorStop(0.5, `rgba(${s},${a},${r},.26)`),
      i.addColorStop(1, `rgba(${s},${a},${r},0)`),
      (n.fillStyle = i),
      n.fillRect(0, 0, 64, 64),
      Zr.set(t, e),
      e
    );
  };
}

function initializeSelecao() {
  ca = 40;
  Ji = Math.ceil(Geo.W / ca) + 1;
  xl = new Map();
  Geo.munis.forEach((t, e) => {
    const n = t.box;
    for (let s = Math.floor(n[1] / ca); s <= Math.floor(n[3] / ca); s++)
      for (let a = Math.floor(n[0] / ca); a <= Math.floor(n[2] / ca); a++) {
        const r = s * Ji + a;
        (xl.has(r) || xl.set(r, []), xl.get(r).push(e));
      }
  });
  Yu = (t, e) => {
    if (!Uo || t < 0 || e < 0 || t > Geo.W || e > Geo.H) return null;
    for (const n of xl.get(Math.floor(e / ca) * Ji + Math.floor(t / ca)) ||
      []) {
      const s = Geo.munis[n].box;
      if (
        t >= s[0] &&
        t <= s[2] &&
        e >= s[1] &&
        e <= s[3] &&
        Uo.isPointInPath(Geo.munis[n].path, t, e)
      )
        return Geo.munis[n].uf;
    }
    return null;
  };
  Ju = (() => {
    const t = [];
    for (let e = -30; e <= 30; e++)
      for (let n = -30; n <= 30; n++) n * n + e * e <= 900 && t.push([n, e]);
    return t.sort(
      (e, n) => e[0] * e[0] + e[1] * e[1] - n[0] * n[0] - n[1] * n[1],
    );
  })();
}

function initializeAnimacao() {
  Qu = criarDistribuidor(Ju, Yu);
  Dr = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  Qi = Math.hypot(Geo.box[2] - Geo.box[0], Geo.box[3] - Geo.box[1]) * 0.53;
  tc = 1200;
  ec = (t, e) =>
    Math.round(tc * (1 - Math.cbrt(Math.max(0, 1 - t / (Qi * e)))));
}

function corMunicipio(apuracao, municipio, fracao, encerrado) {
  if (!(fracao > 0)) return encerrado ? Wu : Fs;
  if (_eState.value) return Ha(_eState.value.city(apuracao, municipio));
  if (_nState.value) return _nState.value.fillX(municipio);
  return Os(nt(lt[hs(apuracao, municipio)]))[Go(Ts(apuracao, municipio))];
}

export function initialize() {
  initializeDesenho();
  initializeBrilho();
  initializeSelecao();
  initializeAnimacao();
}
