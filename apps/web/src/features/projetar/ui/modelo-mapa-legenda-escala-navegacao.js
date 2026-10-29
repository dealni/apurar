import { zt } from "./municipios-e-distritos-2.js";
import { html, Te } from "./formatacao-e-acessibilidade-1.js";
import { Cs } from "./apuracao-e-votos-1.js";
import { Geo } from "../geography.js";
import { rc } from "./mapa-dicas-e-legenda-2.js";
import { sc, nc } from "./mapa-dicas-e-legenda-1.js";
export function renderizarEscala(ctx) {
  const {
    c,
    l,
    _,
    rect: h,
    tv: v = false,
    onBrasil: d,
    onAbroad: f,
    onCountry: m,
    hush: g = false,
    Qo,
  } = ctx;
  return html`<div
      class=${"maptop" + (g ? " hush" : "")}
      style=${`left:${h.x0}px;width:${h.x1 - h.x0}px;top:${h.y0 - 44}px`}
    >
      ${
        _
          ? (() => {
              const Mt = c != null ? zt.cities[c] : null,
                de = Mt ? Cs(Mt.iso) : l ? Cs(l) : null,
                Ye = (He, zn) =>
                  html`<button
                      tabindex=${v ? -1 : null}
                      onClick=${v ? null : zn}
                    >
                      ${He}</button
                    ><i>›</i>`;
              return html`<div class="mrow">
                <nav class="crumbs" aria-label="Onde você está">
                  ${Ye("Brasil", d)}${renderizarNavegacaoDoBrasil(Mt, de, Ye, f, m)}
                </nav>
              </div>`;
            })()
          : renderizarNavegacaoNacional(ctx)
      }
    </div>
    ${Qo}`;
}
function renderizarNavegacaoDoExterior(Mt, de, Ye, m) {
  return Mt && de && de.cities.length > 1 ? Ye(de.name, () => m(de.iso)) : null;
}
function renderizarNavegacaoDoBrasil(Mt, de, Ye, f, m) {
  return Mt || de
    ? html`${Ye("Exterior", f)}${renderizarNavegacaoDoExterior(Mt, de, Ye, m)}<span
          >${Mt ? Mt.name : de.name}</span
        >`
    : html`<span>Exterior</span>`;
}
function renderizarNavegacaoMunicipal(w, v, S, M, c) {
  return w
    ? html`<button
          tabindex=${v ? -1 : null}
          onClick=${v ? null : () => S && S(M)}
        >
          ${Geo.munis[c].name}</button
        ><i>›</i><span>${w}</span>`
    : html`<span>${Geo.munis[c].name}</span>`;
}
function renderizarEstadoOuMunicipio(c, v, $, i, w, S, M) {
  return c != null
    ? html`<button tabindex=${v ? -1 : null} onClick=${v ? null : $}>
          ${Te[i]}</button
        ><i>›</i>${renderizarNavegacaoMunicipal(w, v, S, M, c)}`
    : html`<span>${Te[i]}</span>`;
}
function renderizarNavegacaoNacional(ctx) {
  const {
    t,
    e,
    n,
    a,
    i,
    c,
    M,
    w,
    rect: h,
    tv: v = false,
    onBrasil: d,
    onState: $,
    setLevel: s,
    setCand: r,
    replay: u = false,
    onBairro: S = null,
  } = ctx;
  return i
    ? html`<div class="mrow">
        ${renderizarCaminhoDoBrasil(ctx)}
        ${e === "pres" ? html`<${rc} list=${sc} level=${n} setLevel=${s} m=${t} cand=${a} setCand=${r} replay=${u} room=${h.y1 - h.y0 - 12} />` : null}
      </div>`
    : e === "pres"
      ? html`<${rc}
          list=${nc}
          level=${n}
          setLevel=${s}
          m=${t}
          cand=${a}
          setCand=${r}
          replay=${u}
          room=${h.y1 - h.y0 - 12}
        />`
      : html`<span></span>`;
}

export function renderizarCaminhoDoBrasil({
  i,
  c,
  tv: v = false,
  onBrasil: d,
  onState: $,
  w,
  onBairro: S,
  M,
  breadcrumbLabel = "Onde você está",
}) {
  return html`<nav class="crumbs" aria-label=${breadcrumbLabel}>
    ${i ? html`<button tabindex=${v ? -1 : null} onClick=${v ? null : d}>Brasil</button><i>›</i>${renderizarEstadoOuMunicipio(c, v, $, i, w, S, M)}` : html`<span>Brasil</span>`}
  </nav>`;
}
