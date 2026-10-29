import { Sim } from '../simulation.js';
import { We, Fe } from '../object-helpers.js';
import { Feed } from '../feed.js';
import { Geo } from '../geography.js';
export let h,
  render,
  useState,
  useEffect,
  useRef,
  useMemo,
  useLayoutEffect,
  useErrorBoundary,
  html,
  ie,
  ge,
  Me,
  ts,
  wn,
  $n,
  lt,
  Te,
  An,
  Oe,
  je,
  Xt,
  Ne,
  Tn,
  Sn,
  ue,
  kn,
  _t,
  Ee,
  un,
  ht,
  Pe,
  us,
  hn,
  Hn,
  Cn,
  Ue,
  yt,
  ps,
  es,
  Wn,
  H,
  pt,
  me,
  V,
  et,
  ct,
  X,
  mt,
  J,
  At,
  Yt,
  rt,
  nt,
  kt,
  Nt,
  ce,
  Ht,
  jt,
  k,
  b,
  C,
  R,
  N,
  Vt,
  re,
  Dt,
  pe,
  y,
  Z,
  G,
  it,
  vt,
  St,
  It,
  U;
export const btState = {
  value: undefined,
};
function inicializarAmbienteEAcessibilidade() {
  ({
    h: h,
    render: render,
    useState: useState,
    useEffect: useEffect,
    useRef: useRef,
    useMemo: useMemo,
    useLayoutEffect: useLayoutEffect,
    useErrorBoundary: useErrorBoundary,
  } = window.htmPreact);
  html = window.htm ? window.htm.bind(h) : window.htmPreact.html;
  ie = (t, e, n) => Math.max(e, Math.min(n, t));
  ge = matchMedia('(prefers-reduced-motion: reduce)').matches;
  Me = matchMedia('(pointer: coarse)').matches;
  ts = {
    on: !1,
  };
  (addEventListener(
    'keydown',
    (t) => {
      !t.metaKey && !t.ctrlKey && !t.altKey && (ts.on = !0);
    },
    !0,
  ),
    addEventListener(
      'pointerdown',
      () => {
        ts.on = !1;
      },
      !0,
    ));
  wn = (t, e) =>
    useEffect(() => {
      ts.on &&
        t.current &&
        t.current.focus({
          preventScroll: !0,
        });
    }, [e]);
  $n = /Mac|iP(hone|ad)/.test(navigator.platform || navigator.userAgent);
  lt = Sim.PRES;
  Te = Sim.UF_NAME;
  An = window.BANDEIRAS || {};
  Oe = Sim.OPEN;
  je = Sim.END;
  Xt = Sim.TURNO === 2 ? 2 : 1;
  Ne = new Set(Sim.RUNOFF || []);
  Tn = Xt === 2 ? '25 de outubro' : '4 de outubro';
  Sn =
    (Xt === 2 &&
      (window.TURNO1 ||
        (window.APURACAO && window.APURACAO.modo === 'ao-vivo'
          ? null
          : Sim.T1))) ||
    null;
}

function inicializarFormatadoresENomes() {
  ue = [0, 1, 2].map(
    (t) =>
      new Intl.NumberFormat('pt-BR', {
        minimumFractionDigits: t,
        maximumFractionDigits: t,
      }),
  );
  kn = new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  });
  _t = (t, e = 1) => ue[e].format((t || 0) * 100);
  Ee = (t) => _t(t) + '%';
  un = (t) => Pe(t) + '%';
  ht = (t) => ue[0].format(Math.round(t || 0));
  Pe = (t) =>
    t >= 1
      ? '100'
      : t > 0
        ? t < 1e-4
          ? 'menos de 0,01'
          : t < 0.01
            ? ue[2].format(Math.floor(t * 1e4) / 100)
            : ue[1].format(Math.floor(t * 1e3) / 10)
        : '0';
  us = (t, e) => (Math.abs(t - e) < 0.01 ? 2 : 1);
  hn = (t) => Sim.fmtClock(t);
  Hn = (t, e, n) => {
    const s = Math.round(t / 1e5) / 10;
    return ue[s % 1 ? 1 : 0].format(s) + (s < 2 ? e : n);
  };
  Cn = (t) => {
    const e = Math.round(t || 0);
    return e >= 999500
      ? Hn(e, ' milhão', ' milhões') + ' de votos'
      : e >= 1e4
        ? ue[0].format(Math.round(e / 1e3)) + ' mil votos'
        : ht(e) + (e === 1 ? ' voto' : ' votos');
  };
  Ue = (t) =>
    t >= 999500
      ? Hn(t, ' milhão', ' milhões')
      : t >= 1e4
        ? ue[0].format(Math.round(t / 1e3)) + ' mil'
        : ht(t);
  yt = (t) => (t && t.name) || '';
  ps = (t) => t.charAt(0).toUpperCase() + t.slice(1);
  es = (t) => yt(t).split(' ')[0];
  Wn = (t) =>
    window.APURACAO && window.APURACAO.shell && innerWidth < 800
      ? es(t)
      : yt(t);
  H = (t) => lt.find((e) => +e.n == +t);
  pt = (t) => !!t && t.g === 'F';
  me = new Set(
    'dr. dra. doutor doutora prof. professor professora pastor pastora delegado delegada coronel capitão capitã sargento veterinário escritor juiz juíza apóstolo general tenente major irmã irmão padre bispo cabo soldado comandante mestre'.split(
      ' ',
    ),
  );
  V = (t) =>
    yt(t)
      .split(' ')
      .filter((e) => e.length > 2 && !me.has(e.toLowerCase()))
      .slice(0, 2)
      .map((e) => e[0])
      .join('');
  et = (t) => (Sim.UF_ART || {})[t] || '';
  ct = (t) => (et(t) === 'o' ? 'no ' : et(t) === 'a' ? 'na ' : 'em ') + Te[t];
  X = (t) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  mt = (t) =>
    t >= 1e6
      ? Ue(t) + ' de eleitores'
      : t >= 1e4
        ? Ue(t) + ' eleitores'
        : ht(t) + (Math.round(t) === 1 ? ' eleitor' : ' eleitores');
  J = (t) => (et(t) === 'o' ? 'do ' : et(t) === 'a' ? 'da ' : 'de ') + Te[t];
}

function inicializarPartidosEResultados() {
  At = {
    cor: '#8C8577',
    sg: '',
    on: '#0F0E0D',
  };
  Yt = window.PARTIDOS || {};
  rt = (t) =>
    Object.prototype.hasOwnProperty.call(Yt, t)
      ? Yt[t]
      : We(Fe({}, At), {
          sg: t,
        });
  nt = (t) => rt(t.partido).cor;
  kt = (t) => rt(t.partido).txt || nt(t);
  Nt = (t) => rt(t.partido).sg || t.partido || '';
  ce = (t) => {
    const e = parseInt(t.slice(1), 16);
    return [e >> 16, (e >> 8) & 255, e & 255];
  };
  Ht = (t) => (isFinite(t) && t > 0 ? t : 0);
  jt = (t, e) => {
    const n = Ht(e);
    return t
      .map((s) => {
        const a = Ht(s.votes);
        return We(Fe({}, s), {
          votes: a,
          share: n && (!s.anulado || s.sj) ? Math.min(1, a / n) : 0,
        });
      })
      .sort((s, a) => !!s.anulado - !!a.anulado || a.votes - s.votes);
  };
  k = (t) => t.reduce((e, n) => e + (n.anulado && !n.sj ? 0 : Ht(n.votes)), 0);
  b = (t) => {
    const e = t.nat,
      n = (a) =>
        jt(
          lt.map((r, u) =>
            We(Fe({}, r), {
              k: u,
              votes: a.cand[u],
            }),
          ),
          a.base != null ? a.base : a.valid,
        ),
      s = {};
    for (const a of Sim.ALL) {
      const r = t.uf[a],
        u = {
          uf: a,
          name: Te[a],
          pst: r.pst,
          valid: r.valid,
          el: r.el,
          left: r.left,
          votes: r.votes,
          blank: r.blank,
          nul: r.nul,
          elDone: r.elDone,
          sections: r.sections,
          secDone: r.secDone,
          pres: n(r),
        };
      (r.gov &&
        ((u.gov = jt(r.gov, k(r.gov))),
        (u.govStatus = r.govStatus),
        (u.sen = jt(r.sen, k(r.sen))),
        (u.senStatus = r.senStatus)),
        (s[a] = u));
    }
    return {
      t: t.t,
      at: t.at == null ? t.t : t.at,
      n: e,
      pres: n(e),
      ufs: s,
      muni: t.muni,
      zz: t.zz,
      live: !!t.live,
      empty: !!t.empty,
      towns: t.towns !== !1,
      museq: t.museq == null ? null : t.museq,
      proj: t.live ? t.proj || null : N(t),
    };
  };
}

function inicializarEstimativas() {
  C = [
    [0.05, 0.0131],
    [0.1, 0.0101],
    [0.15, 0.0086],
    [0.2, 0.0065],
    [0.25, 0.0055],
    [0.3, 0.0052],
    [0.4, 0.004],
    [0.5, 0.0031],
    [0.6, 0.0027],
    [0.7, 0.0022],
    [0.8, 0.0016],
    [0.9, 0.001],
    [1, 0],
  ];
  R = (t) => {
    let e = 1;
    for (; e < C.length - 1 && t > C[e][0];) e++;
    const [n, s] = C[e - 1],
      [a, r] = C[e];
    return t <= n ? s : s + (r - s) * Math.min(1, (t - n) / (a - n));
  };
  btState.value = null;
  N = (t) => {
    if (Xt !== 2 || lt.length !== 2 || !t.nat || !(t.nat.el > 0)) return null;
    const e = t.nat.elDone / t.nat.el;
    if (!(e > 0)) return null;
    if (btState.value == null) {
      const a = Sim.at(je).nat,
        r = a.cand[0] + a.cand[1];
      btState.value = r > 0 ? a.cand[0] / r : 0.5;
    }
    const n = R(e),
      s = ie(
        btState.value +
          n *
            0.55 *
            (0.9 * Math.sin(9.1 * e + 0.7) + 0.35 * Math.sin(23 * e + 2.1)),
        0,
        1,
      );
    return {
      p: e,
      by: {
        [+lt[0].n]: s,
        [+lt[1].n]: 1 - s,
      },
      band: n,
      call: e >= 0.25 && Math.abs(s - 0.5) > n ? +lt[s > 0.5 ? 0 : 1].n : null,
    };
  };
}

function inicializarMunicipiosECarregamento() {
  Vt = (t) =>
    Xt === 2 && t.proj && t.proj.p >= 0.15 && t.n.status === 'apurando'
      ? t.proj
      : null;
  re =
    'A estimativa histórica para o resultado final: o que já foi apurado mais, para o que falta, o 1º turno de cada zona eleitoral e município, com os eleitores dos outros candidatos divididos como estão se dividindo no mesmo estado. A faixa cobriu o resultado final em 98 de cada 100 noites simuladas no teste com o 2º turno de 2022. Diz quem deve vencer só com um quarto do eleitorado apurado e a faixa inteira de um lado.';
  Dt = (t, e) => t.muni[e * 4];
  pe = (t, e) => t.muni[e * 4 + 1];
  y = (t, e) => t.muni[e * 4 + 2];
  Z = (t, e) => t.muni[e * 4 + 3];
  G = (t, e) => {
    if (t.live) {
      const u = vt.on ? null : Feed.town(e);
      return u
        ? jt(
            lt.map((i, c) =>
              We(Fe({}, i), {
                k: c,
                votes: u.votos[c],
              }),
            ),
            u.validos,
          )
        : null;
    }
    const n = Sim.M[e],
      s = Dt(t, e),
      a = Sim.UF_DATA[n.uf],
      r = n.el * n.turnout * s * (1 - (a[7] + a[8]) / 100);
    return jt(
      lt.map((u, i) =>
        We(Fe({}, u), {
          k: i,
          votes: r * n.share[i],
        }),
      ),
      r,
    );
  };
  it = (t, e) => {
    if (t.live) {
      const a = vt.on ? null : Feed.town(e);
      return (
        a && {
          el: a.eleitorado,
          sections: a.secoes,
          done: a.totalizadas,
          turnout: a.apurado ? a.comparecimento / a.apurado : 0,
          bn: a.comparecimento ? (a.brancos + a.nulos) / a.comparecimento : 0,
        }
      );
    }
    const n = Sim.M[e],
      s = Sim.UF_DATA[n.uf];
    return {
      el: n.el,
      sections: n.sections,
      done: Math.round(Dt(t, e) * n.sections),
      turnout: n.turnout,
      bn: (s[7] + s[8]) / 100,
    };
  };
  vt = {
    on: !1,
    bare: !1,
  };
  St = new Set();
  It = (t, e, n) => {
    if (!t || n() || St.has(e)) return;
    St.add(e);
    const s = (a) => {
      const r = document.createElement('script');
      ((r.src = t),
        (r.onerror = () => {
          (r.remove(),
            a < 3 &&
              setTimeout(
                () => {
                  n() || s(a + 1);
                },
                15e3 * (a + 1),
              ));
        }),
        document.head.appendChild(r));
    };
    s(0);
  };
  U = (t) => {
    const e = Geo.zones(String(Geo.munis[t].id));
    return e && Feed.LIVE && (vt.on || vt.bare || Feed.zones(t) === !1)
      ? null
      : e;
  };
}

export function initialize() {
  inicializarAmbienteEAcessibilidade();
  inicializarFormatadoresENomes();
  inicializarPartidosEResultados();
  inicializarEstimativas();
  inicializarMunicipiosECarregamento();
}
