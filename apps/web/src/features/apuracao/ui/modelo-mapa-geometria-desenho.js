import { Fs, _eState, _nState, Os, Go, Ba } from './mapa-dados-1.js';
import { nt, rt } from './formatacao-e-acessibilidade-1.js';

import { Geo } from '../geography.js';
import { Streets } from '../streets.js';
import { $e } from './municipios-e-distritos-2.js';
import { Kn } from './apuracao-e-votos-1.js';

import { Ha, Ui, ji, ia, HiState, Nu, Tr, Lr } from './mapa-geometria-1.js';

function atualizarCache(e, s, r, u, l, d, $, f) {
  const m = ia.cv || (ia.cv = document.createElement('canvas'));
  (m.width !== d && (m.width = d), m.height !== $ && (m.height = $));
  const h = m.getContext('2d');
  h &&
    (h.setTransform(1, 0, 0, 1, 0, 0),
    h.clearRect(0, 0, d, $),
    h.setTransform(l, 0, 0, l, 0, 0),
    h.translate(e.ox, e.oy),
    h.scale(e.k, e.k),
    ji(h, e, s, r, u),
    (ia.key = f));
}
function prepararFundo(t, e, s, r, u, l, d, $, f) {
  (t.save(),
    t.save(),
    (t.globalCompositeOperation = 'saturation'),
    (t.fillStyle = 'rgba(128,128,128,.85)'),
    t.fill(Ui(s), 'evenodd'),
    t.restore(),
    ia.key === f
      ? (t.setTransform(1, 0, 0, 1, 0, 0), t.drawImage(ia.cv, 0, 0))
      : (ji(t, e, s, r, u),
        clearTimeout(ia.t),
        (ia.t = setTimeout(() => atualizarCache(e, s, r, u, l, d, $, f), 350))),
    t.setTransform(l, 0, 0, l, 0, 0),
    t.translate(e.ox, e.oy),
    t.scale(e.k, e.k),
    t.clip(Geo.munis[s].path, 'evenodd'));
}
function corDaDivisao(m, g, a, h) {
  if (m) {
    const M = m[g],
      S = M && M.list[0],
      x = M && M.list[1];
    return S && S.votes > 0 ? Os(nt(S))[Go(S.share - (x ? x.share : 0))] : Fs;
  }
  return Ha(_eState.value.group(a, h[g]));
}
function desenharDivisoes(t, e, n, s, a, c) {
  const m = !_eState.value && !_nState.value ? $e(n, s, a) : null,
    h = _eState.value && _eState.value.group ? a.div.paths.map(() => []) : null;
  (h &&
    a.b.forEach((g, v) => {
      g >= 0 && h[g] && h[g].push(v);
    }),
    (t.lineWidth = 1 / e.k),
    (t.strokeStyle = 'rgba(15,14,13,.7)'));
  for (let g = 0; g < a.div.paths.length; g++) {
    if (m || h) {
      let v;
      v = corDaDivisao(m, g, a, h);
      ((t.globalAlpha = c != null && g !== c ? 0.2 : 0.55),
        (t.fillStyle = v),
        t.fill(a.div.paths[g], 'evenodd'));
    }
    ((t.globalAlpha = c != null && g !== c ? 0.5 : 1),
      t.stroke(a.div.paths[g]));
  }
  t.globalAlpha = 1;
}
function desenharLocais(t, e, n, s, a, c, l) {
  const i = a.geo;
  (t.setTransform(l, 0, 0, l, 0, 0),
    (t.lineWidth = 0.8),
    (t.strokeStyle = 'rgba(15,14,13,.8)'));
  for (const m of i.order) {
    const h = i.pts[m];
    ((t.globalAlpha = c != null && a.b[m] !== c ? 0.25 : 1),
      t.beginPath(),
      t.arc(
        e.ox + h[0] * e.k,
        e.oy + h[1] * e.k,
        Tr(i, a, m, e.k) * e.k,
        0,
        6.2832,
      ),
      (t.fillStyle = Nu(n, s, a, m)),
      t.fill(),
      t.stroke());
  }
  ((t.globalAlpha = 1), t.restore());
}
export function desenharMunicipio(t, e, n, s, a, r, u) {
  const c = HiState.value;
  const l = t.getTransform().a / e.k;
  const d = t.canvas.width,
    $ = t.canvas.height;
  const f = [s, e.k, e.ox, e.oy, d, $, Streets ? Streets.version() : 0].join();
  prepararFundo(t, e, s, r, u, l, d, $, f);
  if (a.div) desenharDivisoes(t, e, n, s, a, c);
  desenharLocais(t, e, n, s, a, c, l);
}

export function corDaDisputa(t, e) {
  const n = Kn(t, e).filter((d) => !d.anulado),
    s = Lr(t, e),
    a = n[0],
    r = n[1] || n[0],
    u = rt(a.partido),
    i = rt(r.partido),
    c =
      s === 'done'
        ? 3
        : s === 'run'
          ? 2
          : Math.min(
              1,
              Go(
                e === 'sen'
                  ? r.share - (n[2] ? n[2].share : 0)
                  : a.share - r.share,
              ),
            ),
    l = Os(u.cor)[c];
  return (e === 'sen' || s === 'run') && i.cor !== u.cor
    ? {
        fill: l,
        ink: '#FAFAF9',
        tex: null,
        split: [l, Os(i.cor)[c]],
      }
    : {
        fill: l,
        ink: Ba(l, u.on),
        tex: null,
      };
}
