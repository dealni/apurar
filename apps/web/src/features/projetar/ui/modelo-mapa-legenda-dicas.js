import { PrimeiroTurnoMunicipal } from "./primeiro-turno-municipal.js";
import { officialMapTip } from "./official-map-presentation.js";
import {
  html,
  ie,
  Pe,
  ht,
  Oe,
  ps,
  Xt,
  mt,
  Dt,
  G,
  yt,
  pt,
  Ne,
} from "./formatacao-e-acessibilidade-1.js";
import { zt } from "./municipios-e-distritos-2.js";
import { _l } from "./mapa-interativo-2.js";
import { To, os } from "./candidatos-e-partidos-1.js";
import { Feed } from "../feed.js";
import { Qt } from "./municipios-e-distritos-1.js";
import {
  aa,
  bn,
  so,
  Kn,
  Ks,
  Pa,
  ha,
  Xn,
  No,
  ni,
  ur,
  ol,
  Ie,
  Co,
} from "./apuracao-e-votos-1.js";
import { Geo } from "../geography.js";
import { So } from "./hud-e-comunicacao-1.js";
import { Ma } from "./resultados-municipais-1.js";
function detalheIndisponivel(
  h,
  nome,
  cadastro = "Cadastro geográfico de referência",
) {
  return h(
    false,
    2,
    html`<div class="th">
        <div><span class="nm">${nome}</span><small>${cadastro}</small></div>
      </div>
      <p class="note">Apuração deste detalhe indisponível nesta fonte.</p>`,
  );
}
export function renderZona(l, v, h) {
  return detalheIndisponivel(h, v.nome || "Zona " + v.z);
}
export function renderBairro(l, S, M, h) {
  return detalheIndisponivel(h, M.bairros[l.bairro]);
}
export function renderLocal(l, x, w, h) {
  return detalheIndisponivel(h, x.nome[l.local] || "Local " + x.n[l.local]);
}
export function renderTerritorio(l, e, n, d, $, f, u, i, h) {
  const official = escolherDicaOficial(l, e, n, d, $, h);
  if (official !== undefined) return official;
  const z = obterProgressoTerritorial($, e, l, f, d),
    gt = obterChaveTerritorial($, l, f, n),
    _ = obterCandidatosComVotos(z, $, e, l, f, d, n),
    j = _.slice(0, 2),
    Y = obterCandidatoDestacado(u, n, _);
  incluirCandidatoDestacado(Y, j);
  const E = $ ? zt.cities[l.city] : null,
    T = obterNomeTerritorial($, E, f, l, d),
    Ct = semDisputaAtual($, f, d, n),
    xt = Ct ? Pa(l.uf) : null,
    Bt = $
      ? html`<span class="uft plain">${E.iso}</span>`
      : l.uf === "ZZ"
        ? html`<span class="uft plain gl"><${So} size=${12} /></span>`
        : html`<${To} r=${d} office=${n} plain=${f} />`,
    ve = e.live && e.n.pst <= 0 && z <= 0,
    Ke = formatarProgressoTerritorial($, ve, e, E, z),
    we = obterValorTerritorial(i, z, Ct, $, e, l, f, d),
    Ae = obterResumoPrimeiroTurno(n, Ct, $, l, f),
    firstRoundPlace = municipioDoPrimeiroTurno(n, f, $, l);
  return h(
    l.side,
    j.length +
      (ve ? 1 : 0) +
      (we != null ? 1 : 0) +
      linhasPrimeiroTurno(firstRoundPlace, Ae),
    html`<div class="th">
        ${Bt}
        <div>
          <span class="nm">${T}</span
          >${Ct ? null : html`<small class="tn">${$ ? E.country + " · " : ""}${Ke}</small>`}
        </div>
      </div>
      ${we != null ? html`<p class="note tn">${ps(i.say(we))}</p>` : null}
      ${renderAvisoVotos(ve, Ct)} ${renderResultadoGovernador(Ct, xt, l)}
      ${j.map((D) => html`<${os} key=${gt + D.id} c=${D} size=${30} cls=${D === Y ? "spot" : ""} votes />`)}${renderPrimeiroTurno(firstRoundPlace, Ae)}${renderComparacaoAnterior(f, l, _, $, n)}`,
  );
}
function escolherDicaOficial(l, e, n, d, $, h) {
  if (n === "gov" && e.governor) {
    const place =
      l.muni != null
        ? e.governor.municipalities[l.muni]
        : e.governor.states[l.uf];
    const name = l.muni != null ? Geo.munis[l.muni].name : d.name;
    return officialMapTip(
      place?.result,
      name,
      place?.status || "Resultado indisponível",
      l.side,
      h,
      l.muni != null ? Geo.munis[l.muni].uf : l.uf,
    );
  }
  if ($ && e.exterior) {
    const city = zt.cities[l.city];
    return officialMapTip(
      e.exterior.cities[l.city],
      city.name + " · " + city.country,
      "Resultado oficial indisponível",
      l.side,
      h,
    );
  }
  if ($)
    return detalheIndisponivel(
      h,
      zt.cities[l.city].name,
      "Exterior · cadastro geográfico de referência",
    );
  return undefined;
}
export function criarPosicionador(c, l, a, m) {
  return (D, q, le) => {
    const be = D ? l.x - _l - 12 : l.x + 18 + _l > m ? l.x - _l - 18 : l.x + 18,
      ot = `left:${ie(be, a.x0, m - _l)}px;top:${ie(D ? l.y - 60 : l.y - 24, a.y0 - 44, a.y1 - 190 - 38 * Math.max(0, q - 2))}px`;
    return (
      (c.current = {
        style: ot,
        inner: le,
      }),
      html`<div class="tip on" style=${ot}>${le}</div>`
    );
  };
}
function obterValorLocal(w, i, x, D, e, l) {
  return w && i && i.id !== "apur" && i.local
    ? i.local(x, D, w, e, l.muni)
    : null;
}
function renderComparacaoAnterior(f, l, _, $, n) {
  return f && Xn
    ? html`<${No} w=${ni[l.muni]} now=${ur(_)} />`
    : $
      ? html`<${No} w=${ol[l.city]} now=${ur(_)} />`
      : n === "pres" && Xn && l.uf !== "ZZ" && Ie.uf[l.uf]
        ? html`<${No} w=${Co(Ie.uf[l.uf])} now=${ur(_)} />`
        : null;
}
function obterValorTerritorial(i, z, Ct, $, e, l, f, d) {
  return i && i.id !== "apur" && z > 0 && !Ct
    ? $
      ? i.city(e, l.city)
      : f
        ? i.town(e, l.muni)
        : i.uf(d)
    : null;
}
function obterResumoPrimeiroTurno(n, Ct, $, l, f) {
  return n === "pres" && Xt === 2 && !Ct
    ? $
      ? ha("ZZ", null, l.city)
      : f
        ? ha(null, l.muni)
        : ha(l.uf)
    : null;
}
function obterCandidatosComVotos(z, $, e, l, f, d, n) {
  return z > 0
    ? (($ ? so(e, l.city) : f ? G(e, l.muni) : Kn(d, n)) || []).filter(
        (D) => D.votes > 0,
      )
    : [];
}
function renderResultadoGovernador(Ct, xt, l) {
  return Ct
    ? html`<p class="note">
        ${xt ? `${yt(xt)} ${pt(xt) ? "foi eleita" : "foi eleito"} no 1º turno.` : Ne.has(l.uf) ? "Aguardando os dados do 2º turno." : "Sem 2º turno para governador."}
      </p>`
    : null;
}
function formatarProgressoTerritorial($, ve, e, E, z) {
  if (z == null) return "Percentual indisponível · cobertura incompleta";
  return $ && ve
    ? e.t >= E.closes
      ? "urnas fechadas"
      : "vota até " + Ma(E.closes)
    : Pe(z) + "% das seções";
}
function renderAvisoVotos(ve, Ct) {
  return ve && !Ct
    ? html`<p class="note">
        ${Feed.minuteOf(Date.now()) < Oe ? "Os votos saem a partir das 17h." : "Aguardando os primeiros votos."}
      </p>`
    : null;
}
function obterProgressoTerritorial($, e, l, f, d) {
  return $ ? bn(e, l.city) : f ? Dt(e, l.muni) : d.pst;
}
function obterChaveTerritorial($, l, f, n) {
  return $ ? "x" + l.city : f ? "m" + l.muni : "u" + l.uf + n;
}
function obterCandidatoDestacado(u, n, _) {
  return u != null && n === "pres" ? _.find((D) => D.k === u) : null;
}
function incluirCandidatoDestacado(Y, j) {
  return Y && !j.includes(Y) && j.push(Y);
}
function obterNomeTerritorial($, E, f, l, d) {
  return $ ? E.name : f ? Geo.munis[l.muni].name : d.name;
}
function semDisputaAtual($, f, d, n) {
  return !$ && !f && !Ks(d, n);
}

function municipioDoPrimeiroTurno(mode, municipality, abroad, tip) {
  return mode === "pres" && Xt === 2 && municipality && !abroad
    ? Geo.munis[tip.muni]
    : null;
}
function linhasPrimeiroTurno(place, summary) {
  return place ? 4 : summary ? 1 : 0;
}
function renderPrimeiroTurno(place, summary) {
  return place
    ? html`<${PrimeiroTurnoMunicipal} place=${place} />`
    : summary
      ? html`<${aa} s=${summary} />`
      : null;
}
