import { Sim } from "../simulation.js";
import { We, Fe } from "../object-helpers.js";
import { Feed } from "../feed.js";
import { Geo } from "../geography.js";
import { observeReducedMotion } from "../../../integration/motion-preference.ts";
let stopObservingMotion = () => {};
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
  stopObservingMotion();
  stopObservingMotion = observeReducedMotion((reduced) => {
    ge = reduced;
  });
  Me = matchMedia("(pointer: coarse)").matches;
  ts = {
    on: !1,
  };
  (addEventListener(
    "keydown",
    (t) => {
      !t.metaKey && !t.ctrlKey && !t.altKey && (ts.on = !0);
    },
    !0,
  ),
    addEventListener(
      "pointerdown",
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
  Tn = Xt === 2 ? "25 de outubro" : "4 de outubro";
  Sn =
    (Xt === 2 &&
      (window.TURNO1 ||
        (window.APURACAO && window.APURACAO.modo === "ao-vivo"
          ? null
          : Sim.T1))) ||
    null;
}

function inicializarFormatadoresENomes() {
  ue = [0, 1, 2].map(
    (t) =>
      new Intl.NumberFormat("pt-BR", {
        minimumFractionDigits: t,
        maximumFractionDigits: t,
      }),
  );
  kn = new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  });
  _t = (t, e = 1) => ue[e].format((t || 0) * 100);
  Ee = (t) => _t(t) + "%";
  un = (t) => Pe(t) + "%";
  ht = (t) => (t == null ? "—" : ue[0].format(Math.round(t)));
  Pe = (t) =>
    t >= 1
      ? "100"
      : t > 0
        ? t < 1e-4
          ? "menos de 0,01"
          : t < 0.01
            ? ue[2].format(Math.floor(t * 1e4) / 100)
            : ue[1].format(Math.floor(t * 1e3) / 10)
        : "0";
  us = (t, e) => (Math.abs(t - e) < 0.01 ? 2 : 1);
  hn = (t) => Sim.fmtClock(t);
  Hn = (t, e, n) => {
    const s = Math.round(t / 1e5) / 10;
    return ue[s % 1 ? 1 : 0].format(s) + (s < 2 ? e : n);
  };
  Cn = (t) => {
    const e = Math.round(t || 0);
    return e >= 999500
      ? Hn(e, " milhão", " milhões") + " de votos"
      : e >= 1e4
        ? ue[0].format(Math.round(e / 1e3)) + " mil votos"
        : ht(e) + (e === 1 ? " voto" : " votos");
  };
  Ue = (t) =>
    t >= 999500
      ? Hn(t, " milhão", " milhões")
      : t >= 1e4
        ? ue[0].format(Math.round(t / 1e3)) + " mil"
        : ht(t);
  yt = (t) => (t && t.name) || "";
  ps = (t) => t.charAt(0).toUpperCase() + t.slice(1);
  es = (t) => yt(t).split(" ")[0];
  Wn = (t) =>
    window.APURACAO && window.APURACAO.shell && innerWidth < 800
      ? es(t)
      : yt(t);
  H = (t) => lt.find((e) => +e.n == +t);
  pt = (t) => !!t && t.g === "F";
  me = new Set(
    "dr. dra. doutor doutora prof. professor professora pastor pastora delegado delegada coronel capitão capitã sargento veterinário escritor juiz juíza apóstolo general tenente major irmã irmão padre bispo cabo soldado comandante mestre".split(
      " ",
    ),
  );
  V = (t) =>
    yt(t)
      .split(" ")
      .filter((e) => e.length > 2 && !me.has(e.toLowerCase()))
      .slice(0, 2)
      .map((e) => e[0])
      .join("");
  et = (t) => (Sim.UF_ART || {})[t] || "";
  ct = (t) => (et(t) === "o" ? "no " : et(t) === "a" ? "na " : "em ") + Te[t];
  X = (t) => t.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  mt = (t) =>
    !Number.isFinite(t)
      ? "Indisponível"
      : t >= 1e6
        ? Ue(t) + " de eleitores"
        : t >= 1e4
          ? Ue(t) + " eleitores"
          : ht(t) + (Math.round(t) === 1 ? " eleitor" : " eleitores");
  J = (t) => (et(t) === "o" ? "do " : et(t) === "a" ? "da " : "de ") + Te[t];
}

function inicializarPartidosEResultados() {
  At = {
    cor: "#8C8577",
    sg: "",
    on: "#0F0E0D",
  };
  Yt = window.PARTIDOS || {};
  rt = (t) =>
    Object.prototype.hasOwnProperty.call(Yt, t)
      ? Yt[t]
      : We(Fe({}, At), {
          sg: t,
          cor:
            lt.findIndex((candidate) => candidate.partido === t) === 1
              ? "#8db9d9"
              : "#e7ad78",
        });
  nt = (t) =>
    Yt[t.partido]?.cor ||
    (lt.findIndex(
      (candidate) => candidate.id === t.id || +candidate.n === +t.n,
    ) === 1
      ? "#8db9d9"
      : "#e7ad78");
  kt = (t) => rt(t.partido).txt || nt(t);
  Nt = (t) => rt(t.partido).sg || t.partido || "";
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
          available: r.available,
          coverageComplete: r.coverageComplete,
          coverage: r.coverage,
          aggregation: r.aggregation,
          as_of_min: r.as_of_min,
          as_of_max: r.as_of_max,
          valid: r.valid,
          base: r.base,
          computed: r.computed,
          voteDestinationWarning: r.voteDestinationWarning,
          abstention: r.abstention,
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
      projection: t.projection ?? null,
      proj: t.live ? t.proj || null : N(t),
    };
  };
}

function inicializarEstimativas() {
  // O único modelo de projeção pertence ao backend Apurar.
  C = [];
  R = () => 0;
  btState.value = null;
  N = () => null;
}

function inicializarMunicipiosECarregamento() {
  Vt = (t) => t.proj || null;
  re =
    "Estimativa experimental do Apurar usando o primeiro turno e os votos recebidos no segundo. Não é resultado oficial nem probabilidade de vitória. Cobertura incompleta pode impedir a publicação da projeção.";
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
                validity: u.destinacoes[c] ?? undefined,
              }),
            ),
            u.base,
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
          as_of: a.as_of,
          el: a.eleitorado,
          sections: a.secoes,
          done: a.totalizadas,
          turnout:
            a.apurado > 0 && a.comparecimento != null
              ? a.comparecimento / a.apurado
              : null,
          abstention:
            a.apurado > 0 && a.abstencao != null
              ? a.abstencao / a.apurado
              : null,
          bn:
            a.comparecimento > 0 && a.brancos != null && a.nulos != null
              ? (a.brancos + a.nulos) / a.comparecimento
              : null,
          valid: a.validos,
          computed: a.computados,
          blank: a.brancos,
          nul: a.nulos,
          turnoutCount: a.comparecimento,
          abstentionCount: a.abstencao,
          voteDestinationWarning: a.voteDestinationWarning,
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
      const r = document.createElement("script");
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
