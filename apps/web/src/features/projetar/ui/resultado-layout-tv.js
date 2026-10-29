import { html } from "./formatacao-e-acessibilidade-1.js";
import { ql } from "./resultados-municipais-1.js";
import { Nl } from "./resultados-estaduais-1.js";
import { yr } from "./paineis-e-projecoes-1.js";
import { Ua, Ll } from "./resultados-e-listas-1.js";
import { Pt } from "./apuracao-e-votos-1.js";
import { Be, $l } from "./hud-e-comunicacao-1.js";
import { ic } from "./mapa-escala-1.js";
import { El } from "./mapa-interativo-1.js";
import { jl, Ul } from "./navegacao-e-patrocinio-1.js";
export function renderTvResultadoTerritorial({
  town,
  office,
  modelo,
  close,
  toState,
  spot,
  tv,
  jn,
  ks,
  is,
  Es,
  focus,
  step,
  rs,
  setOffice,
  pick,
}) {
  return town != null
    ? html`<${ql}
        office=${office}
        m=${modelo}
        i=${town}
        onClose=${close}
        onState=${toState}
        spot=${spot}
        tv=${tv}
        zone=${jn}
        onZone=${ks}
        bairro=${is}
        onBairro=${Es}
        scroll
      />`
    : focus
      ? html`<${Nl}
          m=${modelo}
          uf=${focus}
          office=${office}
          tv=${tv}
          onClose=${close}
          onStep=${step}
          spot=${spot}
          scroll
        />`
      : office === "pres"
        ? html`<div class="pcard">
            <${yr}
              m=${modelo}
              spot=${spot}
              compact=${!rs}
              tv=${tv}
              onNext=${tv ? null : setOffice}
            />
          </div>`
        : html`<section class="card pcard enter">
            <div class="hd">
              <h3>Governadores</h3>
            </div>
            <${Ua} m=${modelo} office="gov" onPick=${pick} size=${20} />
            <div class="sep"></div>
            <div class="lh">
              <h3>Disputas, das mais apertadas</h3>
            </div>
            ${Pt(modelo, office)
              .slice(0, 2)
              .map(
                (pa) =>
                  html`<${Ll}
                    key=${pa.uf}
                    r=${pa}
                    office=${office}
                    onPick=${pick}
                  />`,
              )}
          </section>`;
}
export function renderTvCartao({
  Rn,
  office,
  focus,
  close,
  town,
  modelo,
  toState,
  spot,
  tv,
  jn,
  ks,
  is,
  Es,
  step,
  rs,
  setOffice,
  pick,
}) {
  return (
    Rn({
      scroll: !0,
    }) ||
    renderTvResultadoTerritorial({
      town,
      office,
      modelo,
      close,
      toState,
      spot,
      tv,
      jn,
      ks,
      is,
      Es,
      focus,
      step,
      rs,
      setOffice,
      pick,
    })
  );
}
export function renderTvMapa({
  en,
  fn,
  rs,
  modelo,
  office,
  level,
  setLevel,
  cand,
  setCand,
  replay,
  focus,
  town,
  country,
  close,
  toState,
  toAbroad,
  pickCountry,
  Mn,
  is,
  Es,
  Ws,
  pickCity,
  Ss,
  pick,
  pickTown,
  intro,
  jn,
  ks,
  Je,
}) {
  return html`<div class="mapwrap" ref=${en}>
    ${
      fn.w > 40 && fn.h > 40
        ? html`${rs ? html`<${Be} name="mapa-topo" quiet><${ic} m=${modelo} mode=${office} level=${level} setLevel=${setLevel} cand=${cand} setCand=${setCand} replay=${replay} focus=${focus} town=${town} country=${country} onBrasil=${close} onState=${toState} onAbroad=${toAbroad} onCountry=${pickCountry} rect=${Mn} bairro=${is} onBairro=${Es} /><//>` : null}
            <${Be} name="mapa" quiet retry=${2e3}
              ><${El}
                m=${modelo}
                mode=${office}
                level=${Ws}
                cand=${cand}
                focus=${focus}
                town=${town}
                country=${country}
                onCity=${pickCity}
                cw=${fn.w}
                ch=${fn.h}
                rect=${Mn}
                s=${jl(fn.w, fn.h, Ss)}
                onPick=${pick}
                onTown=${pickTown}
                small=${!rs}
                intro=${intro}
                zone=${jn}
                onZone=${ks}
                bairro=${is}
                onBairro=${Es}
                drev=${Je}
            /><//>`
        : null
    }
  </div>`;
}
export function renderTvTopo({
  modelo,
  tempo,
  live,
  conn,
  office,
  setOffice,
  onTV,
  onSearch,
  onExit,
  onShare,
  about,
  setAbout,
  tv,
  focus,
  toAbroad,
  close,
  Vs,
}) {
  return html`<${Be} name="topo" fallback=${$l}
      ><${Ul}
        m=${modelo}
        t=${tempo}
        live=${live}
        conn=${conn}
        office=${office}
        setOffice=${setOffice}
        onTV=${onTV}
        onSearch=${onSearch}
        onExit=${onExit}
        onShare=${onShare}
        about=${about}
        setAbout=${setAbout}
        tv=${tv}
        abroad=${focus === "ZZ"}
        onAbroad=${toAbroad}
        onBrasil=${close}
        phone /><//
    >${Vs}`;
}
export function renderTvLinhaDoTempo() {
  return null;
}
