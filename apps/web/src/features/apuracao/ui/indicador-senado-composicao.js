import { Sim } from '../simulation.js';
import { ja } from './resultados-e-listas-1.js';
import { $c } from './composicao-legislativa-1.js';
import { Ko } from './composicao-legislativa-1.js';
import { nt } from './formatacao-e-acessibilidade-1.js';
import { Tu } from './mapa-dados-1.js';
import { qa } from './mapa-dados-1.js';
import { html } from './formatacao-e-acessibilidade-1.js';
import { hc } from './composicao-legislativa-1.js';
import { Wo } from './composicao-legislativa-1.js';
export const implementar = ({ m: t }) => {
  const { e, n, s, a } = contarCadeiras(t);
  const u = new Map();
  for (const j of [e, n, s]) for (const [Y, E] of j) u.has(Y) || u.set(Y, E.c);
  const i = [...u.keys()],
    c = (j) => $c(j),
    l = (j, Y) => (c(j) || 0) - (c(Y) || 0),
    d = i.filter((j) => Ko(j) === 'l').sort(l),
    $ = i.filter((j) => Ko(j) === 'c').sort(l),
    f = i.filter((j) => Ko(j) === 'r').sort(l),
    m = i.filter((j) => Ko(j) == null),
    h = [],
    g = (j, Y) => (j.has(Y) ? j.get(Y).n : 0),
    v = (j) => nt(u.get(j)),
    M = (j, Y) => {
      for (const E of Y)
        for (let T = 0; T < g(E === 'w' ? e : E === 's' ? n : s, j); T++)
          h.push(E === 'w' ? v(j) : E === 's' ? Tu(v(j)) : qa(v(j)));
    };
  for (const j of d) M(j, ['w', 's', 'l']);
  for (const j of $) M(j, ['w', 's', 'l']);
  for (const j of m) M(j, ['w', 's', 'l']);
  for (let j = 0; j < a - [...s.values()].reduce((Y, E) => Y + E.n, 0); j++)
    h.push('#2A2825');
  for (const j of f) M(j, ['l', 's', 'w']);
  const S = (j, Y) =>
      j.reduce((E, T) => E + Y.reduce((Ct, xt) => Ct + g(xt, T), 0), 0),
    x = [...n.values()].reduce((j, Y) => j + Y.n, 0),
    w = new Map();
  for (const [j, Y] of [...e, ...n]) {
    const E = w.get(j) || {
      c: Y.c,
      n: 0,
    };
    ((E.n += Y.n), w.set(j, E));
  }
  const z = [...w.values()].sort((j, Y) => Y.n - j.n),
    gt = z.slice(0, 5),
    _ = z.slice(5).reduce((j, Y) => j + Y.n, 0);
  return html`<div>
    <${hc}
      fills=${h}
      done=${54 - a}
      left=${S(d, [e, n])}
      right=${S(f, [e, n])}
      leftLead=${S(d, [s])}
      rightLead=${S(f, [s])}
      center=${S($, [e, n])}
      centerLead=${S($, [s])}
      nc=${S($, [e, n])}
    />
    <div class="seatlegend">
      ${gt.map((j) => html`<span key=${j.c.partido}><i style=${'background:' + nt(j.c)}></i>${Wo(j.c.partido)} <b class="tn">${j.n}</b></span>`)}${_ ? html`<span>Outros <b class="tn">${_}</b></span>` : null}<span
        ><i class="hatch"></i>Em disputa <b class="tn">${a}</b></span
      >${x ? null : html`<span>27 cadeiras sem eleição</span>`}
    </div>
  </div>`;
};

function contarCadeiras(t) {
  const e = new Map(),
    n = new Map(),
    s = new Map();
  let a = 0;
  const r = (j, Y, E) => {
    const T = j.get(Y) || {
      c: E || {
        partido: Y,
      },
      n: 0,
    };
    (T.n++, j.set(Y, T));
  };
  for (const j of Sim.UFS) {
    const Y = t.ufs[j],
      E = Y.senStatus === 'eleitos' ? 2 : Y.senStatus === 'um-eleito' ? 1 : 0,
      T = Y.pst > 0 && Y.sen && Y.sen.some((Ct) => Ct.votes > 0);
    for (let Ct = 0; Ct < 2; Ct++) {
      const xt = Ct < E && Y.sen[Ct];
      if (xt) r(e, xt.partido, xt);
      else {
        a++;
        const Bt = T && Y.sen[Ct];
        Bt && Bt.votes > 0 && r(s, Bt.partido, Bt);
      }
    }
    ja[j] && r(n, ja[j][1]);
  }
  return { e, n, s, a };
}
