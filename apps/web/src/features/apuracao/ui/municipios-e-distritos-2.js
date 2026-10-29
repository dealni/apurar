import { $t } from './municipios-e-distritos-1.js';
import { Xt, lt, jt } from './formatacao-e-acessibilidade-1.js';
import { We, Fe } from '../object-helpers.js';
import { Geo } from '../geography.js';
export let $e, zt, Ln;
export function initialize() {
  $e = (t, e, n) => {
    if (n.memoB && n.memoB.m === t) return n.memoB.rows;
    const s = $t(t, e, n),
      a = n.t1,
      r = Xt === 1 && t.live,
      u = n.bairros.length,
      i = n.bairros.map(() => ({
        n: 0,
        el: 0,
        valid: 0,
        ap: 0,
        cp: 0,
        bn: 0,
        votes: lt.map(() => 0),
      }));
    for (let l = 0; l < n.n.length; l++) {
      const d = n.b[l];
      if (!(d >= 0 && d < u)) continue;
      const $ = i[d];
      (($.el += n.el[l]),
        $.n++,
        r &&
          (($.ap += a.ap[l]),
          ($.cp += a.cp[l]),
          ($.bn += (a.v.b ? a.v.b[l] : 0) + (a.v.n ? a.v.n[l] : 0))));
      const f = s[l];
      if (f) {
        $.valid += f.valid;
        for (const m of f.list) $.votes[m.k] += m.votes;
      }
    }
    const c = i.map((l) => ({
      n: l.n,
      el: l.el,
      valid: l.valid,
      list:
        l.valid > 0
          ? jt(
              lt.map((d, $) =>
                We(Fe({}, d), {
                  k: $,
                  votes: l.votes[$],
                }),
              ),
              l.valid,
            )
          : [],
      turnout: r && l.ap > 0 ? l.cp / l.ap : null,
      bn: r && l.cp > 0 ? l.bn / l.cp : null,
    }));
    return (
      (n.memoB = {
        m: t,
        rows: c,
      }),
      c
    );
  };
  zt = Geo.world;
  Ln = zt ? zt.cities.length : 0;
}
