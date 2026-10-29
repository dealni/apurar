import { legacyTerritoryDetailsEnabled } from "../territory-details.js";
import { nc, sc } from "./mapa-dicas-e-legenda-1.js";
import {
  lt,
  pt,
  html,
  Te,
  nt,
  Ee,
  yt,
  ht,
  Pe,
  Oe,
} from "./formatacao-e-acessibilidade-1.js";
import { Sa } from "./busca-e-preferencias-1.js";
import { zt } from "./municipios-e-distritos-2.js";
import { Cs, qt, Kn, sa } from "./apuracao-e-votos-1.js";
import { Sim } from "../simulation.js";
import { Geo } from "../geography.js";
import { So } from "./hud-e-comunicacao-1.js";
import { To, an, oo, os } from "./candidatos-e-partidos-1.js";
import { tn } from "./contagem-e-animacao-1.js";
import { Feed } from "../feed.js";
export let Md, Ad, qc, Bc, Sd, Qa, Hc, xd, Ed, Yo, Uc;
export function initialize() {
  Md = shellMd;
  Ad = {
    pres: "presidente",
    gov: "governadores",
    sen: "senado",
    dep: "deputados",
  };
  qc = {
    v: "votes",
    e: "uf",
    a: "apur",
    ab: "abst",
    mu: "mud",
    r1: "t1r",
  };
  Bc = {
    votes: "v",
    uf: "e",
    apur: "a",
    abst: "ab",
    mud: "mu",
    t1r: "r1",
  };
  Sd = new Set([...nc, ...sc].map((t) => t[0]));
  Qa = shellQa;
  Hc = shellHc;
  xd = shellxd;
  Ed = () => {
    const t = new Map();
    lt.forEach((e) =>
      t.set(e.id, {
        office: "pres",
      }),
    );
    for (const e of Sim.UFS) {
      const n = Sim.RACES[e];
      if (n) {
        for (const s of n.gov || [])
          t.set(s.id, {
            office: "gov",
            uf: e,
          });
        for (const s of n.sen || [])
          t.set(s.id, {
            office: "sen",
            uf: e,
          });
      }
    }
    return t;
  };
  Yo = {
    tv: null,
    clock: null,
    at: null,
  };
  Uc = Feed.LIVE && !!window.APURACAO_STAGING;
}
function shellMd(t) {
  return t < 1100 ? 2 : t < 1260 ? 0.5 : 2;
}
function shellQa() {
  if (!legacyTerritoryDetailsEnabled() && /-z\d+(?=~|$)/i.test(location.hash))
    history.replaceState(
      null,
      "",
      location.pathname +
        location.search +
        location.hash.replace(/-z\d+(?=~|$)/i, ""),
    );
  let t = (location.hash || "").slice(1);
  try {
    t = decodeURIComponent(t);
  } catch {
    /* Fallback opcional preservado da captura; a interface continua disponível. */
  }
  const [e, ...n] = t
      .toLowerCase()
      .replace(/t\d{4}/, "")
      .replace("tv", "")
      .split("~"),
    s =
      /^(presidente|governadores|senado|deputados)?(?:-([a-z]{2}))?(?:-(\d{7}|\d{5}|[a-z]{2}))?(?:-z(\d{1,4}))?$/.exec(
        e,
      ) || [],
    a = n.map((g) => /^c(\d{1,3})$/.exec(g)).find(Boolean),
    r = a ? lt.findIndex((g) => +g.n == +a[1]) : -1,
    u = r >= 0 ? r : null,
    i =
      {
        governadores: "gov",
        senado: "sen",
        deputados: "dep",
      }[s[1]] || "pres",
    c = Sa.some(([g]) => g === i) ? i : "pres",
    l = u != null ? "cand" : qc[n.find((g) => qc[g])] || "mun",
    d = Sd.has(l) ? l : "mun";
  if (s[2] === "zz") {
    return navegacaoNoExterior(s, c, d, u);
  }
  return navegacaoNoBrasil(s, c, d, u);
}
function shellHc(t) {
  return {
    o: t.office === "dep" ? "pres" : t.office,
    lv: t.office === "pres" && t.level !== "cand" ? t.level : "mun",
  };
}
function shellxd({
  m: t,
  office: e,
  uf: n = null,
  id: s,
  onClose: a,
  onState: r = null,
  back: u = !1,
}) {
  const i = n ? t.ufs[n] : null,
    c = e === "pres" ? (i ? i.pres : t.pres) : (i && Kn(i, e)) || [],
    l = c.find((z) => z.id === s);
  if (!l) return null;
  const d = l.votes > 0,
    $ = c.filter((z) => z.votes > l.votes && !z.anulado).length + 1,
    f = e === "pres" ? (i ? i.pst : t.n.pst) : i.pst,
    voteDestinationWarning = avisoDeBaseDoPerfil(e, i, t.n),
    m =
      e === "pres"
        ? "Presidente" + (i ? " · " + i.name : "")
        : (e === "gov" ? "Governador" : "Senado") + " · " + i.name,
    h = pt(l),
    g = e === "pres" ? t.n.status : sa(i, e),
    M = situacaoDoCandidato({
      d,
      g,
      $,
      e,
      h,
    }),
    S = estadosDoCandidato({
      e,
      i,
      d,
      t,
      s,
    }),
    x = (z) =>
      html`<div class="cby" key=${z.u}>
        ${z.u === "ZZ" ? html`<span class="uft plain gl"><${So} size=${12} /></span>` : html`<${To} r=${t.ufs[z.u]} office="pres" plain />`}<span
          class="nm"
          >${z.u === "ZZ" ? "Exterior" : Te[z.u]}</span
        >
        <div class="bar" style="--h:4px">
          <div class="clip">
            <i style=${`flex-grow:${z.share};background:${nt(l)}`}></i
            ><i
              style=${`flex-grow:${1 - z.share};background:rgba(250,250,249,.08)`}
            ></i>
          </div>
        </div>
        <b class="tn">${Ee(z.share)}</b>
      </div>`,
    w = e !== "pres" && d ? c.filter((z) => !z.anulado).slice(0, 3) : [];
  return renderPerfilDeCandidato({
    s,
    u,
    a,
    l,
    m,
    d,
    e,
    i,
    M,
    f,
    t,
    S,
    x,
    w,
    r,
    voteDestinationWarning,
  });
}
function avisoDeBaseDoPerfil(office, state, national) {
  return office === "pres" && (state || national).voteDestinationWarning;
}
function renderPerfilDeCandidato({
  s,
  u,
  a,
  l,
  m,
  d,
  e,
  i,
  M,
  f,
  t,
  S,
  x,
  w,
  r,
  voteDestinationWarning,
}) {
  return html`<section class="card grow stc candc enter" key=${"p" + s}>
    ${
      u
        ? html`<button class="cback" onClick=${a}>
            <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
              <path
                d="M8.5 3 4.5 7l4 4"
                fill="none"
                stroke="currentColor"
                stroke-width="1.6"
                stroke-linecap="round"
                stroke-linejoin="round"
              /></svg
            >Voltar
          </button>`
        : null
    }
    <div class="ch">
      <${an} c=${l} size=${64} />
      <div class="who">
        <h2>${yt(l)}</h2>
        <small><${oo} c=${l} /> · ${m}</small>
      </div>
      <button class="icon" onClick=${a} aria-label="Fechar">
        <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
          <path
            d="M3 3l8 8M11 3l-8 8"
            stroke="currentColor"
            stroke-width="1.6"
            stroke-linecap="round"
          />
        </svg>
      </button>
    </div>
    ${
      d
        ? html`<div class="cfig">
              <b class="tn"><${tn} n=${l.share} fmt=${Ee} /></b
              ><span
                >${`dos votos ${voteDestinationWarning ? "computados das candidaturas" : "válidos"}${e === "pres" ? (i ? " no estado" : " no Brasil") : ""}`}</span
              >
            </div>
            <div class="ckv">
              <span>Votos</span
              ><b class="tn"><${tn} n=${l.votes} fmt=${ht} /></b>
            </div>
            <div class="ckv"><span>Situação</span><b>${M}</b></div>
            <div class="ckv">
              <span>Seções totalizadas</span><b class="tn">${Pe(f)}%</b>
            </div>`
        : html`<p class="note">
            ${t.live && Feed.minuteOf(Date.now()) < Oe ? "Os votos saem a partir das 17h." : "Ainda sem votos apurados."}
          </p>`
    }
    ${
      S.length
        ? html`<div class="lab"><span>Onde vai melhor</span></div>
            ${S.slice(0, 5).map(x)}${
              S.length > 8
                ? html`<div class="lab"><span>Onde vai pior</span></div>
                    ${S.slice(-3).reverse().map(x)}`
                : null
            }`
        : null
    }
    ${
      w.length
        ? html`<div class="lab">
              <span
                >A disputa ${e === "gov" ? "pelo governo" : "pelo Senado"}</span
              >
            </div>
            ${w.map((z) => html`<${os} key=${"r" + z.id} c=${z} size=${30} cls=${z.id === s ? "spot" : ""} />`)}`
        : null
    }
    ${e !== "pres" && r ? html`<button class="btn cst" onClick=${r}>Ver o estado</button>` : null}
  </section>`;
}
function situacaoDoCandidato({ d, g, $, e, h }) {
  return d
    ? g === "eleito" || g === "eleitos"
      ? $ <= (e === "sen" ? 2 : 1)
        ? h
          ? "Eleita"
          : "Eleito"
        : "Não eleit" + (h ? "a" : "o")
      : g === "segundo-turno"
        ? $ <= 2
          ? "Vai ao 2º turno"
          : "Fora do 2º turno"
        : $ === 1
          ? "Lidera"
          : $ + "º lugar"
    : null;
}
function estadosDoCandidato({ e, i, d, t, s }) {
  return e === "pres" && !i && d
    ? [...Sim.UFS, ...(zt && t.ufs.ZZ ? ["ZZ"] : [])]
        .map((z) => {
          const gt = t.ufs[z] && t.ufs[z].pres.find((_) => _.id === s);
          return gt && t.ufs[z].pst > 0
            ? {
                u: z,
                share: gt.share,
              }
            : null;
        })
        .filter(Boolean)
        .sort((z, gt) => gt.share - z.share)
    : [];
}
function navegacaoNoExterior(s, c, d, u) {
  if (c !== "pres" || !zt)
    return {
      office: c,
      focus: null,
      town: null,
      country: null,
      level: d,
      cand: u,
    };
  const g = /^\d{5}$/.test(s[3] || "")
      ? zt.cities.findIndex((M) => M.cd === s[3])
      : -1,
    v = /^[a-z]{2}$/.test(s[3] || "") ? s[3].toUpperCase() : null;
  return {
    office: c,
    focus: "ZZ",
    town: g >= 0 ? g : null,
    country: g < 0 && v && Cs(v) ? v : null,
    level: d,
    cand: u,
  };
}
function navegacaoNoBrasil(s, c, d, u) {
  const $ = s[2] ? s[2].toUpperCase() : null,
    f = /^\d{7}$/.test(s[3] || "") && qt.has(s[3]) ? qt.get(s[3]) : null,
    m = $ && Sim.UFS.includes($) ? $ : f != null ? Geo.munis[f].uf : null,
    h = f != null && Geo.munis[f].uf === m ? f : null;
  return {
    office: c,
    focus: m,
    town: h,
    country: null,
    level: d,
    cand: u,
    zone:
      legacyTerritoryDetailsEnabled() && h != null && c === "pres" && s[4]
        ? +s[4]
        : null,
  };
}
