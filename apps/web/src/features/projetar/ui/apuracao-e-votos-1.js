import { Ln, zt } from "./municipios-e-distritos-2.js";
import { Sim } from "../simulation.js";
import {
  vt,
  jt,
  lt,
  Ne,
  Sn,
  Xt,
  Z,
  ue,
  html,
  rt,
  _t,
  nt,
  yt,
} from "./formatacao-e-acessibilidade-1.js";
import { Feed } from "../feed.js";
import { We, Fe } from "../object-helpers.js";
import { Geo } from "../geography.js";
import { Cl } from "./mapa-dados-1.js";
export let Nn,
  bn,
  hs,
  Ts,
  na,
  so,
  Vo,
  Cs,
  $a,
  ol,
  ss,
  Kn,
  Ks,
  Pa,
  sa,
  po,
  p,
  L,
  Q,
  Pt,
  dt,
  tt,
  ae,
  qt,
  Re,
  Ie,
  ln,
  Xn,
  Ps,
  Co,
  ni,
  oa,
  al,
  si,
  Jd,
  Qd,
  cr,
  ur,
  iu,
  No,
  ha,
  aa,
  Fn;
export const LsState = {
  value: undefined,
};
function inicializarResultadosDoExterior() {
  Nn = [...Array(Ln).keys()];
  bn = (t, e) => (t.zz && t.zz[e * 4]) || 0;
  hs = (t, e) => (t.zz && t.zz[e * 4 + 1]) || 0;
  Ts = (t, e) => (t.zz && t.zz[e * 4 + 2]) || 0;
  na = Sim.UF_DATA.ZZ;
  so = (t, e) => {
    if (t.live) {
      const a = vt.on ? null : Feed.city(e);
      return a
        ? jt(
            lt.map((r, u) =>
              We(Fe({}, r), {
                k: u,
                votes: a.votos[u],
              }),
            ),
            a.validos,
          )
        : null;
    }
    const n = Sim.X && Sim.X[e];
    if (!n) return null;
    const s = n.el * n.turnout * bn(t, e) * (1 - (na[7] + na[8]) / 100);
    return jt(
      lt.map((a, r) =>
        We(Fe({}, a), {
          k: r,
          votes: s * n.share[r],
        }),
      ),
      s,
    );
  };
  Vo = (t, e) => {
    if (t.live) {
      const s = vt.on ? null : Feed.city(e);
      return (
        s && {
          el: s.eleitorado,
          sections: s.secoes,
          done: s.totalizadas,
          turnout: s.apurado ? s.comparecimento / s.apurado : 0,
        }
      );
    }
    const n = Sim.X && Sim.X[e];
    return (
      n && {
        el: n.el,
        sections: n.sections,
        done: Math.round(bn(t, e) * n.sections),
        turnout: n.turnout,
      }
    );
  };
  Cs = (t) => (zt && zt.countries.find((e) => e.iso === t)) || null;
  $a = (t, e) => {
    const n = lt.map(() => 0);
    let s = 0,
      a = 0,
      r = 0;
    for (const u of e.cities) {
      const i = so(t, u),
        c = zt.cities[u].el;
      ((a += c),
        (r += bn(t, u) * c),
        i &&
          i.forEach((l) => {
            ((n[l.k] += l.votes), (s += l.votes));
          }));
    }
    return {
      race: jt(
        lt.map((u, i) =>
          We(Fe({}, u), {
            k: i,
            votes: n[i],
          }),
        ),
        s,
      ),
      pst: a ? r / a : 0,
    };
  };
}

function inicializarDisputasPorCargo() {
  ol = [];
  ss = (t, e) => t.n - e.n;
  Kn = (t, e) => (e === "gov" ? t.gov : e === "sen" ? t.sen : t.pres);
  Ks = (t, e) => e === "pres" || (Kn(t, e) || []).length > 0;
  Pa = (t) => {
    const e = !Ne.has(t) && Sn && Sn.gov && Sn.gov[t];
    return (e && e.status === "eleito" && e.top[0]) || null;
  };
  sa = (t, e) =>
    e === "gov"
      ? t.govStatus
      : e === "sen"
        ? t.senStatus
        : t.pst >= 1
          ? "apurado"
          : "apurando";
  po = (t, e) =>
    e === "gov"
      ? t.govStatus !== "apurando"
      : e === "sen"
        ? t.senStatus === "eleitos"
        : t.pst >= 1;
  p = (t, e) => {
    const n = Kn(t, e),
      s = (a) => n[a] || n[a - 1] || n[0];
    return e === "sen" ? [s(1), n[2] || s(1)] : [n[0], s(1)];
  };
  L = (t, e) => {
    const [n, s] = p(t, e);
    return n.share - s.share;
  };
  Q = (t, e) => {
    const n = Kn(t, e),
      s = (a) => (n[a] ? n[a].share : 0);
    return e === "sen"
      ? s(1) - s(2)
      : Math.min(
          Math.abs(s(0) - 0.5),
          s(0) - s(1),
          s(0) < 0.5 ? s(1) - s(2) : 1 / 0,
        );
  };
  Pt = (t, e) =>
    Sim.UFS.map((n) => t.ufs[n])
      .filter((n) => Ks(n, e))
      .sort(
        (n, s) =>
          po(n, e) - po(s, e) ||
          (s.pst > 0) - (n.pst > 0) ||
          (po(n, e) ? L(n, e) - L(s, e) : Q(n, e) - Q(s, e)),
      );
}

function inicializarIndicesMunicipais() {
  dt = Geo.munis.length;
  tt = [...Array(dt).keys()];
  ae = Array.from(Sim.M, (t) => t.el ?? null);
  qt = new Map(Geo.munis.map((t, e) => [String(t.id), e]));
  Re = Float32Array.from(tt, (t) => ((t * 2654435761) >>> 0) / 4294967296);
  Ie = null;
  ln = null;
  Xn = !1;
  LsState.value = null;
  Ps = (t) => {
    const e = Xt === 2 ? window.T1MUN : null,
      n = e ? "t1" : t ? "rel" + t.rev : "none";
    if (LsState.value && LsState.value.key === n) return LsState.value;
    const s = {
        max: 1,
        uf: {},
        key: n,
      },
      a =
        e && Array.isArray(e.fields)
          ? [e.fields.indexOf("13"), e.fields.indexOf("22")]
          : null;
    return (
      Geo.munis.forEach((r, u) => {
        const i = a && a[0] >= 0 && a[1] >= 0 && e.m ? e.m[r.id] : null,
          c = i ? Math.abs(i[a[0]] - i[a[1]]) : t ? Z(t, u) : 0;
        ((s.max = Math.max(s.max, c)),
          (s.uf[r.uf] = Math.max(s.uf[r.uf] || 1, c)));
      }),
      (LsState.value = s)
    );
  };
}

function inicializarComparacoesHistoricas() {
  Co = (t) => {
    if (!t) return null;
    if (Xt === 2) {
      const n = t[ln.lula_2t] + t[ln.bolsonaro_2t];
      return n ? [t[ln.lula_2t] / n, t[ln.bolsonaro_2t] / n] : null;
    }
    const e =
      t[ln.lula_1t] +
      t[ln.bolsonaro_1t] +
      t[ln.tebet_1t] +
      t[ln.ciro_1t] +
      t[ln.outros_1t];
    return e ? [t[ln.lula_1t] / e, t[ln.bolsonaro_1t] / e] : null;
  };
  ni = Xn ? Geo.munis.map((t) => Co(Ie.m[t.id])) : [];
  oa =
    Xt === 2 && window.TURNO1_NOITE && Array.isArray(window.TURNO1_NOITE.p)
      ? window.TURNO1_NOITE
      : null;
  al = (t, e) => {
    const n = oa ? oa.n.indexOf(String(+t.n)) : -1;
    return n >= 0 && e ? e[1 + n] : null;
  };
}

function inicializarVariacoesEReferencias() {
  si = [
    [0.014, 0.435],
    [0.08, 0.476],
    [0.178, 0.484],
    [0.287, 0.489],
    [0.398, 0.493],
    [0.54, 0.498],
    [0.676, 0.5],
    [0.688, 0.5],
    [0.841, 0.504],
    [0.925, 0.506],
    [0.97, 0.507],
    [0.983, 0.508],
    [0.99, 0.508],
    [0.997, 0.509],
    [1, 0.509],
  ];
  Jd = (t) => {
    let e = si[0];
    if (t <= e[0]) return e[1];
    for (const n of si) {
      if (t <= n[0]) return e[1] + ((n[1] - e[1]) * (t - e[0])) / (n[0] - e[0]);
      e = n;
    }
    return e[1];
  };
  Qd = (t, e) => (+t.n == 13 ? e : +t.n == 22 ? 1 - e : null);
  cr = (t) => (t >= 0 ? "+" : "−") + ue[1].format(Math.abs(t * 100));
  ur = (t) => {
    const e = (t || []).find((s) => +s.n == 13),
      n = (t || []).find((s) => +s.n == 22);
    return e && n && e.votes + n.votes > 0 ? [e.share, n.share] : null;
  };
  iu = (t) => {
    if (!Xn) return null;
    const e = Ie.fields.map(() => 0);
    for (const n of t) {
      const s = Ie.uf[n];
      s &&
        s.forEach((a, r) => {
          e[r] += +a || 0;
        });
    }
    return Co(e);
  };
  No = ({ w: t, now: e = null }) =>
    t
      ? html`<p class="then tn" title=${`No ${Xt}º turno de 2022`}>
            <span>2022 · ${Xt}º turno</span
            ><span
              ><i style=${"background:" + rt("PT").cor}></i>Lula
              ${_t(t[0])}%</span
            ><span
              ><i style=${"background:" + rt("PL").cor}></i>Bolsonaro
              ${_t(t[1])}%</span
            >
          </p>
          ${e ? html`<p class="then dlt tn" title=${`Pontos percentuais em relação ao ${Xt}º turno de 2022 (o PL tinha Jair Bolsonaro)`}><span>Variação</span><span>Lula ${cr(e[0] - t[0])}</span><span>PL ${cr(e[1] - t[1])} pontos</span></p>` : null}`
      : null;
  ha = (t, e = null, n = null) => {
    const s = Xt === 2 ? Cl() : null;
    if (!s) return null;
    const a =
      n != null
        ? [s.zz[n * 2], s.zz[n * 2 + 1]]
        : e != null
          ? [s.br[e * 2], s.br[e * 2 + 1]]
          : s.uf[t] || null;
    return a && Number.isFinite(a[0]) ? a : null;
  };
  aa = ({ s: t }) =>
    t
      ? html`<p
          class="then tn"
          title="O resultado do 1º turno, em 4 de outubro"
        >
          <span>1º turno</span
          >${lt.map((e, n) => html`<span key=${e.id}><i style=${"background:" + nt(e)}></i>${yt(e)} ${_t(t[n])}%</span>`)}
        </p>`
      : null;
  Fn = [];
}

export function initialize() {
  inicializarResultadosDoExterior();
  inicializarDisputasPorCargo();
  inicializarIndicesMunicipais();
  inicializarComparacoesHistoricas();
  inicializarVariacoesEReferencias();
}
