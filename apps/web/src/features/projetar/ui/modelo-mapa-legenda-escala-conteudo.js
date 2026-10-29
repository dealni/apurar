import {
  lt,
  Dt,
  ct,
  nt,
  kn,
  ue,
  _t,
  Hn,
  html,
  ht,
  Nt,
  yt,
} from "./formatacao-e-acessibilidade-1.js";
import { Cs, Nn, bn, tt, Ps } from "./apuracao-e-votos-1.js";
import { Geo } from "../geography.js";
import { Sim } from "../simulation.js";
import { xr, Ri, Os, Pi, Fs } from "./mapa-dados-1.js";
import { an } from "./candidatos-e-partidos-1.js";
import { Bl } from "./resultados-municipais-1.js";
export function prepararConteudo(ctx) {
  return ctx._ ? legendaExteriorIndisponivel(ctx) : prepararConteudoBrasil(ctx);
}
function prepararConteudoBrasil(ctx) {
  const {
    t,
    e,
    i,
    c,
    l,
    z,
    _,
    j,
    Y,
    E,
    T,
    Ct,
    Bt,
    Ke,
    we,
    Ae,
    D,
    q,
    rect: h,
    tv: v = false,
  } = ctx;
  const le = [...z.values()].sort((Mt, de) => de.n - Mt.n),
    be = e !== "pres" && e !== "dep",
    ot = le.slice(0, 4),
    ke = le.slice(4).reduce((Mt, de) => Mt + de.n, 0),
    W = _ ? "cidades" : Bt ? "locais" : obterUnidadeSemLocais(Ke, j, e),
    ze = le[0] && nt(le[0].c),
    Pn = {
      cidades: "cidade",
      locais: "local",
      zonas: "zona",
      municípios: "município",
      vagas: "vaga",
      estados: "estado",
    },
    dn = (Mt) => (Math.round(Mt) === 1 ? Pn[W] : W),
    In = !!q && q.wait,
    sn = (Mt) => obterFormatoPercentual(Mt).format(Mt * 100),
    Xe = (Mt) => (Mt * 100 < 0.0995 && Mt > 0 ? kn.format(Mt * 100) : _t(Mt)),
    De = (Mt) =>
      "+" +
      (Mt >= 1e6
        ? Hn(Mt, " mi", " mi")
        : ue[0].format(Math.round(Mt / 1e3)) + " mil"),
    xo = (Mt) => 30 * Math.sqrt(Mt / Ps(t).max),
    ds = () =>
      renderizarEscalaTematica({
        ...ctx,
        Pn,
      }),
    Ro =
      E && _
        ? html`<span><${an} c=${E} size=${18} round /><b>${yt(E)}</b></span>`
        : null,
    go =
      E && q.S > 0
        ? html`<span
            class="ramp ends"
            title=${`A parte dos votos computados das candidaturas que ${yt(E)} tem em cada lugar. No país: ${Xe(q.S)}%. Os tons mudam em ${q.steps.map(sn).join(", ")}%.`}
            ><em
              ><span class="lg">menos de </span
              ><span class="sh">${"< "}</span>${sn(q.steps[0])}%</em
            >${q.tones.map((Mt, de) => html`<i key=${de} style=${"background:" + Mt}></i>`)}<em
              ><span class="sh">≥ </span>${sn(q.steps[4])}%<span class="lg">
                ou mais</span
              ></em
            ></span
          >`
        : null,
    bo = T
      ? ds()
      : E
        ? html`${Ro}<span class="ttl"
              >${renderizarResumoDoCandidato(In, D, Ae, Xe, t, q, we, _, Ke)}</span
            >${go}`
        : renderizarVantagens(Y, ot, De, xo, be, ke, dn, ze, e),
    Jn = obterUrnasDoExterior(_, E, le, t, l),
    lo = Jn
      ? html`<span
            ><i class="xr shut"></i>urnas fechadas
            <b class="tn">${ht(Jn.n)}</b></span
          ><span
            ><i class="xr open"></i>votando
            <b class="tn">${ht(Jn.total - Jn.n)}</b>
            ${Jn.total - Jn.n === 1 ? "cidade" : "cidades"}</span
          >`
      : null,
    ms = ocultarLegendaCompleta(be, i, _, c),
    yo = obterEspacoDosControles(v),
    as = semResultados(T, E, Y, lo, ot, ze),
    ro = html`<span
      ><i style=${"background:" + (Ct ? Pi : Fs)}></i>Aguardando os votos</span
    >`,
    Qo = renderizarCaixaDaLegenda(ms, E, _, h, v, yo, Ro, go, lo, as, ro, bo);
  return {
    ...ctx,
    Qo,
  };
}
function obterUnidadeSemLocais(Ke, j, e) {
  return Ke ? "zonas" : j ? "municípios" : e === "sen" ? "vagas" : "estados";
}
function obterFormatoPercentual(Mt) {
  return Mt * 100 < 0.0995 && Mt > 0
    ? kn
    : ue[Mt * 100 >= 9.95 ? 0 : Mt * 100 >= 0.995 ? 1 : 2];
}
function renderizarCarregamento(n) {
  return html`<span class="ttl"
    >${n === "mud" || n === "t1r" ? "Carregando o 1º turno…" : "Carregando…"}</span
  >`;
}
function obterCidadesDoPais(_, l) {
  return _ ? (l && Cs(l) ? Cs(l).cities : Nn) : null;
}
function obterValoresNoBrasil(de, i, t, T) {
  return de
    ? (i ? Geo.ufs[i].munis : tt).map((ye) =>
        Dt(t, ye) > 0 ? T.town(t, ye) : null,
      )
    : (i ? [i] : Sim.UFS).map((ye) =>
        t.ufs[ye].pst > 0 ? T.uf(t.ufs[ye]) : null,
      );
}
function obterValoresLocais(Bt, T, xt, Ct, t, c, Mt, ve, de, i) {
  return Bt && T.local
    ? xt.map((ye, cn) => (ye ? T.local(Ct, cn, ye, t, c) : null))
    : Mt
      ? ve.rows.map((ye) => (ye.f > 0 ? T.zone(ye) : null))
      : obterValoresNoBrasil(de, i, t, T);
}
function obterUnidadeTematica(Bt, T, Mt, de) {
  return Bt && T.local
    ? "locais"
    : Mt
      ? "zonas"
      : de
        ? "municípios"
        : "estados";
}
function renderizarApuracao(ye, He, Pn, zn, _, Mt, Vs) {
  return html`<span
      ><i style=${"background:" + xr[4]}></i><b class="tn">${ht(ye)}</b> de
      ${ht(He.length)} ${He.length === 1 ? Pn[zn] : zn}
      ${_ || Mt ? "apuradas" : "apurados"}</span
    >
    ${Vs(html`<em><span class="lg">menos de </span><span class="sh">${"< "}</span>25%</em>`, xr, html`<em>100%</em>`, "Quanto das seções de cada lugar já foi totalizado")}`;
}
function renderizarAbstencao(_, i, cn, Vs) {
  return html`<span
      >Abstenção ${_ ? "no exterior" : i ? ct(i) : "no país"}
      <b class="tn">${cn == null ? "–" : _t(cn) + "%"}</b></span
    >
    ${Vs(html`<em><span class="lg">menos de </span><span class="sh">${"< "}</span>15%</em>`, Ri, html`<em><span class="sh">≥ </span>30%<span class="lg"> ou mais</span></em>`, "A parte do eleitorado das seções totalizadas que não votou. Os tons mudam em 15, 20, 25 e 30%.")}`;
}
function renderizarComparacao(On, yn, ls, on, Vs, Rn, Bn) {
  return html`${[On, yn].map((ye, cn) => html`<span key=${ye.id}><i style=${"background:" + nt(ye)}></i>${Nt(ye) || yt(ye)} <b class="tn">${ht(ls[cn])}</b>${cn === 1 ? " " + on(ls[1]) : ""}</span>`)}
  ${Vs(html`<em>${Nt(On) || yt(On)}</em>`, [...Rn(On).slice().reverse(), ...Rn(yn)], html`<em>${Nt(yn) || yt(yn)}</em>`, Bn ? "Quem ficou à frente em cada lugar no 1º turno, em 4 de outubro, e por quanto, entre os dois do 2º turno. Os tons mudam em 10, 25 e 45 pontos." : "Para quem cada lugar se moveu desde o 1º turno: quanto a vantagem de um sobre o outro mudou, em pontos. Os tons mudam em 1, 3 e 6 pontos.")}`;
}
function obterUnidadeDeLideranca(Ke, we) {
  return Ke
    ? we === 1
      ? "zona"
      : "zonas"
    : we === 1
      ? "município"
      : "municípios";
}
function renderizarLideranca(t, q, we, _, Ke, Xe) {
  return t.towns && !q.off
    ? html`À frente em
        <b class="tn">${ht(we)}</b>
        ${_ ? (we === 1 ? "cidade" : "cidades") : obterUnidadeDeLideranca(Ke, we)}`
    : html`No país · <b class="tn">${Xe(q.S)}%</b>`;
}
function renderizarResumoDoCandidato(In, D, Ae, Xe, t, q, we, _, Ke) {
  return In
    ? "Carregando…"
    : D
      ? Ae
        ? html`Mais forte ${Ae[0]} · <b class="tn">${Xe(Ae[1])}%</b>`
        : renderizarLideranca(t, q, we, _, Ke, Xe)
      : "Aguardando os votos";
}
function renderizarDistribuicao(be, ot, ke, dn, ze, e) {
  return be
    ? html`${ot.map((Mt, de) => html`<span key=${Mt.c.partido}><i style=${"background:" + nt(Mt.c)}></i>${Nt(Mt.c) || yt(Mt.c)} <b class="tn">${ht(Mt.n)}</b>${!ke && de === ot.length - 1 ? " " + dn(Mt.n) : ""}</span>`)}${ke ? html`<span>Outros <b class="tn">${ht(ke)}</b> ${dn(ke)}</span>` : null}
      ${ze ? html`<span class="ramp" title="O tom diz o andamento da disputa"><i style=${"background:" + Os(ze)[0]}></i><i style=${"background:" + Os(ze)[3]}></i><em>claro: apurando · forte: ${e === "sen" ? "eleitos" : "definido"}</em></span>` : null}`
    : html`${ot.map((Mt, de) => html`<span key=${Mt.c.partido}><i style=${"background:" + nt(Mt.c)}></i>${Nt(Mt.c) || yt(Mt.c)} <b class="tn">${ht(Mt.n)}</b>${!ke && de === ot.length - 1 ? " " + dn(Mt.n) : ""}</span>`)}${ke ? html`<span>Outros <b class="tn">${ht(ke)}</b> ${dn(ke)}</span>` : null}
      ${ze && e !== "dep" ? html`<span class="ramp" title="Vantagem do líder, em pontos">${Os(ze).map((Mt, de) => html`<i key=${de} style=${"background:" + Mt}></i>`)}<em>até 10 · 25 · 45 · mais pontos</em></span>` : null}`;
}
function renderizarVantagens(Y, ot, De, xo, be, ke, dn, ze, e) {
  return Y
    ? html`${ot.slice(0, 3).map((Mt) => html`<span key=${Mt.c.partido}><i style=${"background:" + nt(Mt.c)}></i>${Nt(Mt.c)} <b class="tn">${De(Mt.n)}</b></span>`)}
        <span
          class="skey"
          title="Altura de cada pico, a vantagem do líder no município"
          ><svg width="156" height="34" aria-hidden="true">
            ${[
              [1e4, 4],
              [1e5, 54],
              [5e5, 108],
            ].map(
              ([Mt, de]) =>
                html`<g key=${Mt}
                  ><path
                    d=${`M${de - 3},31 L${de},${31 - xo(Mt)} L${de + 3},31 Z`}
                    fill="var(--fg-3)"
                  /><text x=${de + 6} y="31" font-size="11" fill="var(--fg-3)"
                    >${Mt >= 1e5 ? Mt / 1e3 + " mil" : "10 mil"}</text
                  ></g
                >`,
            )}</svg
          ><em>votos de vantagem</em></span
        >`
    : renderizarDistribuicao(be, ot, ke, dn, ze, e);
}
function obterUrnasDoExterior(_, E, le, t, l) {
  return _ && !E && !le.length
    ? Bl(t.t, l && Cs(l) ? Cs(l).cities : null)
    : null;
}
function ocultarLegendaCompleta(be, i, _, c) {
  return (be && !!i) || (_ && c != null);
}
function semResultados(T, E, Y, lo, ot, ze) {
  return !T && !E && !Y && !lo && !ot.length && !ze;
}
function renderizarLegendaVisivel(ms, Ro, go, lo, as, ro, bo) {
  return ms ? html`${Ro}${go}` : lo || (as ? ro : bo);
}
function renderizarCaixaDaLegenda(ms, E, _, h, v, yo, Ro, go, lo, as, ro, bo) {
  return ms && !(E && _)
    ? null
    : html`<div
        class="mapleg"
        style=${`left:${h.x0}px;top:${v ? h.y0 - 40 : h.y1}px;width:${Math.max(0, h.x1 - h.x0 - yo)}px`}
      >
        <div class="legend" role="group" aria-label="Legenda do mapa">
          ${renderizarLegendaVisivel(ms, Ro, go, lo, as, ro, bo)}
        </div>
      </div>`;
}
function renderizarEscalaTematica(ctx) {
  const { t, n, i, c, l, _, j, T, Ct, xt, Bt, ve, Pn } = ctx;
  if (T.wait) return renderizarCarregamento(n);
  const Mt = !!ve && ve.ready,
    de = j && t.towns && !T.off,
    Ye = obterCidadesDoPais(_, l),
    He = _
      ? Ye.map((ye) => (bn(t, ye) > 0 ? T.city(t, ye) : null))
      : obterValoresLocais(Bt, T, xt, Ct, t, c, Mt, ve, de, i),
    zn = _ ? "cidades" : obterUnidadeTematica(Bt, T, Mt, de),
    on = (ye) => (ye === 1 ? Pn[zn] : zn),
    Vs = (ye, cn, As, Us) =>
      html`<span class="ramp ends" title=${Us}
        >${ye}${cn.map((rs, Ss) => html`<i key=${Ss} style=${"background:" + rs}></i>`)}${As}</span
      >`;
  if (n === "apur") {
    const ye = He.filter((cn) => cn >= 1).length;
    return renderizarApuracao(ye, He, Pn, zn, _, Mt, Vs);
  }
  if (n === "abst") {
    const ye = _ ? t.ufs.ZZ : i ? t.ufs[i] : t.n,
      cn = ye && ye.pst > 0 ? T.uf(ye) : null;
    return renderizarAbstencao(_, i, cn, Vs);
  }
  const ls = contarSinais(He);
  const On = lt[0],
    yn = lt[1],
    Rn = (ye) => Os(nt(ye)),
    Bn = n === "t1r";
  return renderizarComparacao(On, yn, ls, on, Vs, Rn, Bn);
}
function contarSinais(valores) {
  const totais = [0, 0];
  for (const valor of valores) if (valor != null) totais[valor > 0 ? 1 : 0]++;
  return totais;
}

function legendaExteriorIndisponivel(ctx) {
  const h = ctx.rect;
  return {
    ...ctx,
    Qo: html`<div
      class="mapleg"
      style=${`left:${h.x0}px;top:${ctx.tv ? h.y0 - 40 : h.y1}px;width:${Math.max(0, h.x1 - h.x0)}px`}
    >
      <div class="legend" role="group" aria-label="Legenda do mapa">
        <span>Cadastro de referência · sem resultados</span>
      </div>
    </div>`,
  };
}

function obterEspacoDosControles(tv) {
  return tv ? 0 : 60;
}
