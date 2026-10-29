import {
  registrarCargos,
  registrarMudancas,
  registrarCapitais,
} from './indicador-eventos-estados.js';
import {
  html,
  yt,
  Xt,
  lt,
  ht,
  _t,
  kt,
} from './formatacao-e-acessibilidade-1.js';
import { Sim } from '../simulation.js';
import { So } from './hud-e-comunicacao-1.js';
export let ma,
  Is,
  Un,
  ll,
  oi,
  to,
  rl,
  va,
  dr,
  ai,
  ii,
  uu,
  fr,
  ci,
  ui,
  du,
  dl,
  fu,
  pr;
export const qoState = {
  value: undefined,
};
export const cuState = {
  value: undefined,
};
export const liState = {
  value: undefined,
};
export const ilState = {
  value: undefined,
};
export const clState = {
  value: undefined,
};
export const ulState = {
  value: undefined,
};
export const laState = {
  value: undefined,
};
export const riState = {
  value: undefined,
};
export const flState = {
  value: undefined,
};
export const diState = {
  value: undefined,
};
export function initialize() {
  inicializarEstado();
  inicializarChegadas();
  inicializarSecoes();
  inicializarEstados();
  inicializarLista();
}

function inicializarEstado() {
  ma = [];
  Is = [];
  qoState.value = null;
  Un = (t) => html`<b>${yt(t)}</b>`;
  ll = Xt === 2 ? '' : ' no 1º turno';
  cuState.value = 0;
  oi = (t) => (t.shown != null ? t.shown : t.t);
  to = (t) => {
    t.id = ++cuState.value;
    let e = Is.length;
    for (; e && oi(Is[e - 1]) > oi(t);) e--;
    Is.splice(e, 0, t);
  };
  rl = {
    gov: new Set(),
    sen: new Set(),
  };
  va = new Set();
  dr = {};
  ai = new Set();
  liState.value = null;
  ilState.value = 0;
  clState.value = null;
  ulState.value = null;
  laState.value = null;
  riState.value = !1;
  ii = [...Sim.UFS, 'ZZ'];
  uu = (t) => {
    const e = t.map((n) => (n.uf === 'ZZ' ? 'Exterior' : n.uf));
    return e.length > 4
      ? `${e.slice(0, 3).join(', ')} e mais ${e.length - 3}`
      : pr(e);
  };
}

function inicializarChegadas() {
  fr = (t, e, n, s, a, r = []) => {
    const u = lt[a.lead],
      i = lt[a.second],
      c = () =>
        html`<b class="tn">+${ht(n)}</b>
          ${n === 1 ? 'seção' : 'seções'}${s ? `: ${s}` : ''}`,
      l = () =>
        html`${Un(u)} ${_t(a.sh[a.lead])}% · ${Un(i)} ${_t(a.sh[a.second])}%`,
      d = r.length > 3 ? r.slice(0, 2) : r,
      $ = r.length - d.length,
      f = (h, g) =>
        html`<span class="par"
          >${Un(h)}
          <span class="tn" style=${`color:${kt(h)}`}
            >${_t(a.sh[g])}%</span
          ></span
        >`,
      m = () =>
        html`<span class="arr"
          ><span class="arr1"
            ><span
              ><b class="tn">+${ht(n)}</b> ${n === 1 ? 'seção' : 'seções'}</span
            >${d.length ? html`<span class="arru">${d.map((h) => (h === 'ZZ' ? html`<span class="uft plain gl" key="ZZ" title="Exterior" aria-label="Exterior"><${So} size=${11} /></span>` : html`<span class="uft plain" key=${h}>${h}</span>`))}${$ ? html`<span class="mais tn">+${$}</span>` : null}</span>` : null}</span
          >
          <span class="arr2"
            >${f(u, a.lead)}${Xt === 2 ? null : f(i, a.second)}</span
          ></span
        >`;
    to({
      t,
      shown: e,
      ms: a.pst,
      line: m,
      tick: () => html`${c()} · ${l()}`,
    });
  };
}

function inicializarSecoes() {
  ci = (t) => {
    if (!ilState.value) {
      clState.value = t;
      return;
    }
    for (let e = 1; e < t.length; e++) {
      const n = Math.round((t[e].pst - t[e - 1].pst) * ilState.value);
      n > 0 && fr(t[e].t, t[e].t, n, '', t[e]);
    }
    if (t.length) {
      const e = t[t.length - 1];
      ((ulState.value = {
        t: e.t,
        sd: Math.round(e.pst * ilState.value),
      }),
        ui());
    }
  };
  ui = () => {
    if (riState.value || !ulState.value || !laState.value) return;
    riState.value = !0;
    const t = laState.value.sd - ulState.value.sd;
    t > 0 &&
      laState.value.t >= ulState.value.t &&
      fr(laState.value.t, laState.value.shown, t, '', laState.value.x);
  };
  du = (t) => {
    const e = t.nat;
    if (!e || !(e.sections > 0)) return;
    if (((ilState.value = e.sections), clState.value)) {
      const i = clState.value;
      ((clState.value = null), ci(i));
    }
    const n = t.seq != null ? t.seq : t.t,
      s = liState.value;
    if (s && n === s.key) return;
    const a = contarSecoes(t, s);
    if (
      ((liState.value = {
        key: n,
        usd: a,
      }),
      !s)
    ) {
      ((laState.value = {
        t: t.t,
        shown: t.at != null && t.at > t.t ? t.at : t.t,
        sd: Math.round(Object.values(a).reduce((i, c) => i + c, 0)),
        x: {
          pst: e.pst,
          sh: e.cand.map((i) => (e.valid ? i / e.valid : 0)),
          lead: e.order[0],
          second: e.order[1],
        },
      }),
        ui());
      return;
    }
    const r = ii
        .map((i) => ({
          uf: i,
          d: (a[i] || 0) - (s.usd[i] || 0),
        }))
        .filter((i) => i.d >= 0.5)
        .sort((i, c) => c.d - i.d),
      u = Math.round(r.reduce((i, c) => i + c.d, 0));
    u < 1 ||
      fr(
        t.t,
        t.at != null && t.at > t.t ? t.at : t.t,
        u,
        uu(r),
        {
          pst: e.pst,
          sh: e.cand.map((i) => (e.valid ? i / e.valid : 0)),
          lead: e.order[0],
          second: e.order[1],
        },
        r.map((i) => i.uf),
      );
  };
}

function inicializarEstados() {
  dl = (t) => [t[0], t[1] || t[0]];
  flState.value = null;
  diState.value = -1 / 0;
  fu = (t) => {
    const e = t.seq != null ? t.seq : t.t;
    if (flState.value && flState.value.key === e) return;
    const n = (diState.value = Math.max(
        diState.value,
        t.t,
        t.at != null ? t.at : t.t,
      )),
      s = flState.value,
      a = s && s.prev,
      r = Sim.UFS.map((c) => (t.uf[c] ? t.uf[c].pst : 0)),
      u = Sim.UFS.map((c) => {
        const l = t.uf[c];
        if (!l || !(l.valid > 0)) return -1;
        let d = 0;
        return (
          l.cand.forEach(($, f) => {
            $ > l.cand[d] && (d = f);
          }),
          d
        );
      });
    flState.value = {
      key: e,
      t: t.t,
      tt: n,
      ups: r,
      uld: u,
      prev: s
        ? {
            t: s.t,
            tt: s.tt,
            ups: s.ups,
            uld: s.uld,
          }
        : null,
    };
    const i = (c) => (c != null ? c : s ? n : null);
    registrarCargos(t, i);
    if (s) registrarMudancas(t, n, s, a, r, u);
    registrarCapitais(t, n);
  };
}

function inicializarLista() {
  pr = (t) =>
    t.length < 2
      ? t.join('')
      : t.slice(0, -1).join(', ') + ' e ' + t[t.length - 1];
}

function contarSecoes(t, s) {
  const a = {};
  for (const i of ii)
    t.uf[i] && (a[i] = Math.max(t.uf[i].secDone || 0, (s && s.usd[i]) || 0));
  return a;
}
