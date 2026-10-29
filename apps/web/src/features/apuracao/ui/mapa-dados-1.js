import { Geo } from '../geography.js';
import { zt, Ln } from './municipios-e-distritos-2.js';
import { U, ce, ie, ue, Xt, lt } from './formatacao-e-acessibilidade-1.js';
import { dt, qt } from './apuracao-e-votos-1.js';
export let gl,
  Va,
  Uo,
  zi,
  Na,
  Ti,
  Li,
  bl,
  ga,
  Fs,
  Pi,
  Ii,
  jo,
  yl,
  qa,
  Cr,
  Tu,
  Mr,
  Os,
  Ar,
  Go,
  Fi,
  kl,
  Ba,
  Lu,
  wl,
  Sr,
  Pu,
  Oi,
  Iu,
  xr,
  Fu,
  Ri,
  Ou,
  Ru,
  Zu,
  Cl,
  Zi,
  Du;
export const _nState = {
  value: undefined,
};
export const _eState = {
  value: undefined,
};
export const ErState = {
  value: undefined,
};
export function initialize() {
  inicializarEnquadramento();
  inicializarCores();
  inicializarEscalas();
}

function enquadrarExterior(e, n) {
  if (e != null) {
    const [m, h] = zt.cities[e].c;
    return [m - 1300, h - 850, m + 1300, h + 850];
  }
  const u = n && zt.countries.find((m) => m.iso === n),
    i = u ? u.box : zt.box,
    c = u ? 1.3 : 1.04,
    l = Math.max(i[2] - i[0], u ? 1800 : 0) * c,
    d = Math.max(i[3] - i[1], u ? 1100 : 0) * c,
    $ = (i[0] + i[2]) / 2,
    f = (i[1] + i[3]) / 2;
  return [$ - l / 2, f - d / 2, $ + l / 2, f + d / 2];
}

function primeiroTurnoDisponivel(dados) {
  return !!dados && !!dados.m && Array.isArray(dados.fields);
}

function inicializarEnquadramento() {
  gl = '#08090a';
  Va = '#0f1011';
  Uo = document.createElement('canvas').getContext('2d');
  zi = ['RN', 'PB', 'PE', 'AL', 'SE', 'ES', 'RJ'];
  Na = Geo.box;
  Ti = (Geo.box[0] + Geo.box[2]) / 2;
  Li = (Geo.box[1] + Geo.box[3]) / 2;
  bl = (t, e, n = null, s = null) => {
    if (t === 'ZZ' && zt) return enquadrarExterior(e, n);
    if (e != null) {
      const u = Geo.munis[e],
        i = u.box,
        c = Geo.ufs[u.uf].box,
        l = (i[0] + i[2]) / 2,
        d = (i[1] + i[3]) / 2;
      if (s) {
        const m = s.box || i,
          h = Math.max(i[2] - i[0], i[3] - i[1]),
          g = Math.max(
            1.5,
            Math.min(
              h * 0.6,
              Math.max(Math.max(m[2] - m[0], m[3] - m[1]) * 1.6 + 3, 6),
            ),
          ),
          v = g < h * 0.6 ? m : i;
        return [
          (v[0] + v[2]) / 2 - g,
          (v[1] + v[3]) / 2 - g,
          (v[0] + v[2]) / 2 + g,
          (v[1] + v[3]) / 2 + g,
        ];
      }
      const $ = U(e);
      if ($ && $.box) {
        const m = $.box,
          h = $.ext || i,
          g = Math.min(
            Math.max(h[2] - h[0], h[3] - h[1]) * 0.6,
            Math.max(m[2] - m[0], m[3] - m[1]) * 0.8 + 6,
          );
        return [
          (m[0] + m[2]) / 2 - g,
          (m[1] + m[3]) / 2 - g,
          (m[0] + m[2]) / 2 + g,
          (m[1] + m[3]) / 2 + g,
        ];
      }
      const f =
        Math.max(
          i[2] - i[0],
          i[3] - i[1],
          Math.max(c[2] - c[0], c[3] - c[1]) * 0.32,
        ) * 0.85;
      return [l - f, d - f, l + f, d + f];
    }
    if (!t) return Na;
    const a = Geo.ufs[t].box,
      r = Math.max(a[2] - a[0], a[3] - a[1]) * 0.08;
    return [a[0] - r, a[1] - r, a[2] + r, a[3] + r];
  };
  ga = (t, e, n) => {
    const s = e.x1 - e.x0 - n,
      a = e.y1 - e.y0,
      r = Math.min(s / (t[2] - t[0]), a / (t[3] - t[1]));
    return {
      k: r,
      ox: e.x0 + (e.x1 - e.x0 - ((t[2] - t[0]) * r + n)) / 2 - t[0] * r,
      oy: e.y0 + (a - (t[3] - t[1]) * r) / 2 - t[1] * r,
    };
  };
}

function inicializarCores() {
  Fs = '#23252a';
  Pi = '#8a8f98';
  Ii = (t) => (
    (t /= 255),
    t <= 0.04045 ? t / 12.92 : Math.pow((t + 0.055) / 1.055, 2.4)
  );
  jo = (t) => {
    const [e, n, s] = ce(t).map(Ii),
      a = Math.cbrt(0.4122214708 * e + 0.5363325363 * n + 0.0514459929 * s),
      r = Math.cbrt(0.2119034982 * e + 0.6806995451 * n + 0.1073969566 * s),
      u = Math.cbrt(0.0883024619 * e + 0.2817188376 * n + 0.6299787005 * s);
    return [
      0.2104542553 * a + 0.793617785 * r - 0.0040720468 * u,
      1.9779984951 * a - 2.428592205 * r + 0.4505937099 * u,
      0.0259040371 * a + 0.7827717662 * r - 0.808675766 * u,
    ];
  };
  yl = ([t, e, n]) => {
    const s = Math.pow(t + 0.3963377774 * e + 0.2158037573 * n, 3),
      a = Math.pow(t - 0.1055613458 * e - 0.0638541728 * n, 3),
      r = Math.pow(t - 0.0894841775 * e - 1.291485548 * n, 3),
      u = (i) => {
        const c =
          i <= 0.0031308
            ? 12.92 * i
            : 1.055 * Math.pow(i, 0.4166666666666667) - 0.055;
        return Math.round(ie(c, 0, 1) * 255)
          .toString(16)
          .padStart(2, '0');
      };
    return (
      '#' +
      [
        4.0767416621 * s - 3.3077115913 * a + 0.2309699292 * r,
        -1.2684380046 * s + 2.6097574011 * a - 0.3413193965 * r,
        -0.0041960863 * s - 0.7034186147 * a + 1.707614701 * r,
      ]
        .map(u)
        .join('')
    );
  };
  qa = (t) => Os(t)[1];
  Cr = new Map();
  Tu = (t) => {
    if (!Cr.has(t)) {
      const e = jo(t),
        n = jo('#23252a');
      Cr.set(t, yl(e.map((s, a) => s * 0.6 + n[a] * 0.4)));
    }
    return Cr.get(t);
  };
  Mr = new Map();
  Os = (t) => {
    if (!Mr.has(t)) {
      const e = jo(Va),
        n = jo(t);
      Mr.set(
        t,
        [0.4, 0.62, 0.82, 1].map((s) =>
          yl(e.map((a, r) => a + (n[r] - a) * s)),
        ),
      );
    }
    return Mr.get(t);
  };
}

function inicializarEscalas() {
  Ar = [0.1, 0.25, 0.45];
  Go = (t) => (t < Ar[0] ? 0 : t < Ar[1] ? 1 : t < Ar[2] ? 2 : 3);
  Fi = (t) => {
    const [e, n, s] = ce(t).map(Ii);
    return 0.2126 * e + 0.7152 * n + 0.0722 * s;
  };
  kl = (t, e) => {
    const n = Fi(t),
      s = Fi(e);
    return (Math.max(n, s) + 0.05) / (Math.min(n, s) + 0.05);
  };
  Ba = (t, e) => (kl(t, '#FAFAF9') >= kl(t, e) ? '#FAFAF9' : e);
  Lu = [0.4, 0.7, 1, 1.4, 2];
  wl = (t, e) => {
    let n = 0;
    for (; n < t.length && e >= t[n];) n++;
    return n;
  };
  Sr = new Map();
  Pu = (t) => {
    if (!Sr.has(t)) {
      const e = jo(Va),
        n = jo(t);
      Sr.set(
        t,
        [0.28, 0.42, 0.56, 0.7, 0.85, 1].map((s) =>
          yl(e.map((a, r) => a + (n[r] - a) * s)),
        ),
      );
    }
    return Sr.get(t);
  };
  _nState.value = null;
  _eState.value = null;
  Oi = (t, e) => {
    const n = jo(Va),
      s = jo(t);
    return e.map((a) => yl(n.map((r, u) => r + (s[u] - r) * a)));
  };
  Iu = [0.25, 0.5, 0.75, 1];
  xr = Oi('#FAFAF9', [0.14, 0.27, 0.41, 0.56, 0.86]);
  Fu = [0.15, 0.2, 0.25, 0.3];
  Ri = Oi('#E8A23A', [0.24, 0.4, 0.56, 0.74, 0.92]);
  Ou = [0.01, 0.03, 0.06];
  Ru = (t) => xr[wl(Iu, t)];
  Zu = (t) =>
    t >= 1 ? '100' : t < 0.01 ? '<1' : ue[0].format(Math.floor(t * 100));
  ErState.value = null;
  Cl = () => {
    const t = window.T1MUN;
    if (
      ErState.value ||
      Xt !== 2 ||
      lt.length !== 2 ||
      !primeiroTurnoDisponivel(t)
    )
      return ErState.value;
    const e = t.fields.indexOf('validos'),
      n = lt.map((l) => t.fields.indexOf(String(+l.n)));
    if (e < 0 || n.some((l) => l < 0)) return null;
    const s = new Float32Array(dt * 2).fill(NaN),
      a = new Float32Array(Ln * 2).fill(NaN),
      r = {},
      u = (l, d, $, f) => {
        if (!($[e] > 0)) return;
        ((l[d * 2] = $[n[0]] / $[e]), (l[d * 2 + 1] = $[n[1]] / $[e]));
        const m = r[f] || (r[f] = [0, 0, 0]);
        ((m[0] += $[n[0]]), (m[1] += $[n[1]]), (m[2] += $[e]));
      };
    for (const l in t.m) {
      const d = qt.get(l);
      d != null && u(s, d, t.m[l], Geo.munis[d].uf);
    }
    const i = zt ? new Map(zt.cities.map((l, d) => [+l.cd, d])) : null;
    if (i && t.zz)
      for (const l in t.zz) {
        const d = i.get(+l);
        d != null && u(a, d, t.zz[l], 'ZZ');
      }
    const c = {};
    for (const l in r) c[l] = [r[l][0] / r[l][2], r[l][1] / r[l][2]];
    return (ErState.value = {
      br: s,
      zz: a,
      uf: c,
    });
  };
  Zi = (t, e) => (t === 1 ? e : -e);
  Du = (t) => {
    const e = t.pres.find((s) => s.k === 0),
      n = t.pres.find((s) => s.k === 1);
    return (n ? n.share : 0) - (e ? e.share : 0);
  };
}
