import { ju } from './mapa-geometria-1.js';
import { Dr } from './mapa-selecao-1.js';
import { ie, Z, pe, rt, lt } from './formatacao-e-acessibilidade-1.js';
import { Geo } from '../geography.js';

export function desenharCamada(t, e, n, s, a, r, u, i, c, l, d) {
  const $ = a.rise != null ? Dr(ie((a.rise - d * 0.05) / 0.65, 0, 1)) : a.e,
    f = new Map();
  for (const m of l) {
    if (s && Geo.munis[m].uf !== s) continue;
    const h = Z(n, m),
      g = a.rise != null ? h * $ : a.from ? a.from[m] + (h - a.from[m]) * $ : h;
    if (!(g > 0)) continue;
    const v = a.hmax * Math.min(1.25, Math.sqrt(g / u));
    if (v < 0.8) continue;
    const M = Geo.munis[m].c,
      S = e.ox + M[0] * e.k,
      x = e.oy + M[1] * e.k,
      w = pe(n, m);
    let z = f.get(w);
    (z || f.set(w, (z = [new Path2D(), new Path2D()])),
      z[0].moveTo(S - i, x),
      z[0].lineTo(S, x - v),
      z[0].lineTo(S + i, x),
      z[0].closePath(),
      z[1].moveTo(S - i, x),
      z[1].lineTo(S, x - v),
      z[1].lineTo(S, x),
      z[1].closePath(),
      c &&
        c.push({
          i: m,
          x: S,
          y: x,
          h: v,
          w: i,
        }));
  }
  ((t.lineWidth = 0.6), (t.strokeStyle = 'rgba(15,14,13,.6)'));
  for (const [m, h] of f) {
    const g = rt(lt[m].partido).cor;
    ((t.fillStyle = g),
      t.fill(h[0]),
      (t.fillStyle = ju(g)),
      t.fill(h[1]),
      t.stroke(h[0]));
  }
}
