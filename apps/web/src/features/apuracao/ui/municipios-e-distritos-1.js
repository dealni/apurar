import { Geo } from '../geography.js';
import { U, jt, lt, Dt, Xt, G } from './formatacao-e-acessibilidade-1.js';
import { Feed } from '../feed.js';
import { We, Fe } from '../object-helpers.js';
import { Sim } from '../simulation.js';
export let Et, Lt, wt, qe, ee, Le, mn, Vn, $s, xn, ns, En, vn, fe, $t, Qt, Gt;
function inicializarModelosDeZonas() {
  Et = new Map();
  Lt = (t, e) => {
    if (!Et.has(t)) {
      const n = Geo.munis[t],
        s = (l, d = 0) => {
          let $ =
            ((+n.id % 100003) * 7919 + e.z[l] * (104729 + d) + l * 31) | 0;
          return (
            ($ = Math.imul($ ^ ($ >>> 15), 2246822507)),
            ($ = Math.imul($ ^ ($ >>> 13), 3266489909)),
            (($ ^ ($ >>> 16)) >>> 0) / 4294967296
          );
        },
        a = e.c.map((l) => Math.hypot(l[0] - n.c[0], l[1] - n.c[1])),
        r = Math.max(1e-6, ...a),
        u = e.el.reduce((l, d) => l + d, 0) || 1,
        i = e.z.map(
          (l, d) => 0.7 * ((2 * a[d]) / r - 1) + 0.3 * (2 * s(d) - 1),
        ),
        c = i.reduce((l, d, $) => l + d * e.el[$], 0) / u;
      Et.set(t, {
        lean: i.map((l) => l - c),
        pace: e.z.map((l, d) => 0.55 + 1.25 * s(d, 77)),
        tot: u,
      });
    }
    return Et.get(t);
  };
}

function inicializarResultadosDeZonas() {
  wt = (t, e) => {
    const n = U(e);
    if (!n) return null;
    if (t.live) {
      const v = Feed.zones(e);
      return {
        Z: n,
        ready: !!v,
        rows: n.z.map((M, S) => {
          const x = v && v.get(M);
          return x
            ? {
                z: M,
                j: S,
                nome: n.nome[S],
                el: x.eleitorado || n.el[S],
                f: x.secoes ? x.totalizadas / x.secoes : 0,
                turnout: x.apurado ? x.comparecimento / x.apurado : 0,
                race: jt(
                  lt.map((w, z) =>
                    We(Fe({}, w), {
                      k: z,
                      votes: x.votos[z],
                    }),
                  ),
                  x.validos,
                ),
                d: x,
              }
            : {
                z: M,
                j: S,
                nome: n.nome[S],
                el: n.el[S],
                f: v ? 0 : null,
                race: null,
              };
        }),
      };
    }
    const s = Sim.M[e],
      a = Dt(t, e),
      r = Sim.UF_DATA[s.uf],
      u = Lt(e, n),
      i = s.share.map((v, M) => [v, M]).sort((v, M) => M[0] - v[0]),
      c = lt.findIndex((v) => v.partido === 'PT'),
      l = i[0][1],
      d = i[1] ? i[1][1] : -1,
      $ = l === c || d === c ? c : l,
      f = $ === l ? d : l;
    let m = 0,
      h = 60;
    if (a > 0 && a < 1)
      for (let v = 0; v < 40; v++) {
        const M = (m + h) / 2;
        n.el.reduce((S, x, w) => S + x * Math.exp(-M * u.pace[w]), 0) >
        a * u.tot
          ? (m = M)
          : (h = M);
      }
    const g = (m + h) / 2;
    return {
      Z: n,
      ready: !0,
      rows: n.z.map((v, M) => {
        const S = a <= 0 ? 0 : a >= 1 ? 1 : Math.exp(-g * u.pace[M]),
          x = n.el[M] * s.turnout * S * (1 - (r[7] + r[8]) / 100),
          w = s.share.map(
            (gt, _) =>
              gt * Math.exp(0.5 * u.lean[M] * (_ === $ ? 1 : _ === f ? -1 : 0)),
          ),
          z = w.reduce((gt, _) => gt + _, 0) || 1;
        return {
          z: v,
          j: M,
          nome: n.nome[M],
          el: n.el[M],
          f: S,
          turnout: s.turnout,
          race: jt(
            lt.map((gt, _) =>
              We(Fe({}, gt), {
                k: _,
                votes: (x * w[_]) / z,
              }),
            ),
            x,
          ),
        };
      }),
    };
  };
}

function inicializarLocaisDeVotacao() {
  qe = (window.APURACAO || {}).locais || null;
  ee = (window.APURACAO || {}).locaisUF || null;
  Le = new Map();
  mn = new Map();
  Vn = new Map();
  $s = (t, e) => {
    const n =
      e && e.versao === 1 && Array.isArray(e.n) && e.n.length
        ? Geo.places(e)
        : null;
    let s = n
      ? We(Fe({}, e), {
          geo: n,
          shaped: n.paths.some(Boolean),
          memo: null,
          memoB: null,
        })
      : null;
    const a = e && e.div;
    if (
      s &&
      a &&
      Array.isArray(a.nomes) &&
      a.nomes.length &&
      Array.isArray(a.p) &&
      a.p.length === e.n.length &&
      Array.isArray(a.a) &&
      a.a.length === a.nomes.length
    ) {
      const r = Geo.divisions(a);
      s = We(Fe({}, s), {
        bairros: a.nomes,
        b: a.p,
        bc: a.l,
        geo: We(Fe({}, n), {
          bc: r.bc,
        }),
        div: {
          fonte: a.fonte,
          paths: r.paths,
          boxes: r.boxes,
        },
        tse: {
          bairros: e.bairros,
          b: e.b,
        },
      });
    }
    Le.set(t, s);
  };
  xn = (t) => {
    if (!(qe || ee) || t == null || !Geo.munis[t]) return null;
    const e = String(Geo.munis[t].id),
      n = Geo.munis[t].uf,
      s = ee ? n : e;
    return Le.has(e)
      ? Le.get(e)
      : mn.has(e)
        ? ($s(e, mn.get(e)), mn.delete(e), Le.get(e))
        : (Date.now() - (Vn.get(s) || -1 / 0) < 15e3 ||
            (Vn.set(s, Date.now()),
            fetch(ee ? ee + n + '.json' : qe + e + '.json', {
              cache: 'default',
            })
              .then((a) =>
                a.ok
                  ? a.json()
                  : a.status === 404
                    ? null
                    : Promise.reject(new Error('HTTP ' + a.status)),
              )
              .then(
                (a) => {
                  (ee
                    ? Geo.munis.forEach((r) => {
                        const u = r && r.uf === n ? String(r.id) : null;
                        u &&
                          !Le.has(u) &&
                          (a && a[u] ? mn.set(u, a[u]) : Le.set(u, null));
                      })
                    : $s(e, a),
                    dispatchEvent(new Event('locais')));
                },
                () => {},
              )),
          null);
  };
}

function inicializarDisponibilidadeDeLocais() {
  ns = (t) =>
    !!(qe || ee) &&
    t != null &&
    !!Geo.munis[t] &&
    !Le.has(String(Geo.munis[t].id)) &&
    !mn.has(String(Geo.munis[t].id));
  En = (t, e) => {
    const n = xn(e);
    return n && n.shaped && (Xt === 1 || !t.live) ? n : null;
  };
  vn = (t, e) => (Xt === 1 || !t.live) && ns(e);
  fe = lt.map((t) => String(+t.n));
}

function preencherResultadosCapturados(a, u, r) {
  for (let i = 0; i < a; i++) {
    const c = fe.map((d) => u(d, i)),
      l = c.reduce((d, $) => d + $, 0);
    l > 0 &&
      (r[i] = {
        f: 1,
        valid: l,
        list: jt(
          lt.map((d, $) =>
            We(Fe({}, d), {
              k: $,
              votes: c[$],
            }),
          ),
          l,
        ),
      });
  }
}

function inicializarResultadosDeLocais() {
  $t = (t, e, n) => {
    if (n.memo && n.memo.m === t) return n.memo.races;
    const s = n.t1,
      a = n.n.length,
      r = new Array(a).fill(null),
      u = (i, c) => (s.v[i] ? s.v[i][c] : 0);
    if (Xt === 1 && t.live) preencherResultadosCapturados(a, u, r);
    else if (!t.live && Dt(t, e) > 0) {
      const i = G(t, e) || [],
        c = fe.map((m) => (s.v[m] || []).reduce((h, g) => h + g, 0)),
        l = c.reduce((m, h) => m + h, 0) || 1,
        d = s.ap.reduce((m, h) => m + h, 0) || 1,
        $ = i.reduce((m, h) => m + h.votes, 0),
        f = lt.map((m, h) => {
          const g = i.find((v) => v.k === h);
          return g ? g.share : 0;
        });
      for (let m = 0; m < a; m++) {
        const h = fe.reduce((S, x) => S + u(x, m), 0);
        if (!(h > 0) || !($ > 0)) continue;
        const g = f.map(
            (S, x) => S * (c[x] > 0 ? u(fe[x], m) / h / (c[x] / l) : 1),
          ),
          v = g.reduce((S, x) => S + x, 0) || 1,
          M = ($ * s.ap[m]) / d;
        r[m] = {
          f: Dt(t, e),
          valid: M,
          list: jt(
            lt.map((S, x) =>
              We(Fe({}, S), {
                k: x,
                votes: (M * g[x]) / v,
              }),
            ),
            M,
          ),
        };
      }
    }
    return (
      (n.memo = {
        m: t,
        races: r,
      }),
      r
    );
  };
}

function inicializarComparacoesELimites() {
  Qt = (t, e) => {
    const n = Array.isArray(e) ? e : [e],
      s = t.t1.v;
    let a = 0;
    const r = [0, 0];
    for (const u of n)
      for (const i in s) {
        if (i === 'b' || i === 'n') continue;
        a += s[i][u];
        const c = fe.indexOf(i);
        c >= 0 && c < 2 && (r[c] += s[i][u]);
      }
    return a > 0 ? [r[0] / a, r[1] / a] : null;
  };
  Gt = (t, e) => {
    const n = [1 / 0, 1 / 0, -1 / 0, -1 / 0],
      s = [1 / 0, 1 / 0, -1 / 0, -1 / 0],
      a = (d, $, f, m, h) => {
        ((d[0] = Math.min(d[0], $)),
          (d[1] = Math.min(d[1], f)),
          (d[2] = Math.max(d[2], m)),
          (d[3] = Math.max(d[3], h)));
      };
    t.b.forEach((d, $) => {
      if (d !== e) return;
      const f = t.geo.boxes[$],
        m = t.geo.pts[$];
      (f && a(n, f[0], f[1], f[2], f[3]), m && a(s, m[0], m[1], m[0], m[1]));
    });
    const r = (d) => Math.max(d[2] - d[0], d[3] - d[1]),
      u =
        t.div && t.div.boxes[e]
          ? t.div.boxes[e]
          : s[2] >= s[0] && (!(n[2] >= n[0]) || r(n) > Math.max(3, 2 * r(s)))
            ? s
            : n;
    if (!(u[2] >= u[0])) return null;
    const i = (u[0] + u[2]) / 2,
      c = (u[1] + u[3]) / 2,
      l = Math.max(1.5, r(u) * 0.75);
    return [i - l, c - l, i + l, c + l];
  };
}

export function initialize() {
  inicializarModelosDeZonas();
  inicializarResultadosDeZonas();
  inicializarLocaisDeVotacao();
  inicializarDisponibilidadeDeLocais();
  inicializarResultadosDeLocais();
  inicializarComparacoesELimites();
}
