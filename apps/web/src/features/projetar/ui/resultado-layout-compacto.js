import { Geo } from "../geography.js";
import { html, _t } from "./formatacao-e-acessibilidade-1.js";
import { ql } from "./resultados-municipais-1.js";
import { Nl } from "./resultados-estaduais-1.js";
import { yr } from "./paineis-e-projecoes-1.js";
import { Ua, Ll } from "./resultados-e-listas-1.js";
import { Pt } from "./apuracao-e-votos-1.js";
import { Be, $l } from "./hud-e-comunicacao-1.js";
import { Ul } from "./navegacao-e-patrocinio-1.js";
export function renderCompactoResultadoTerritorial({
  town,
  office,
  modelo,
  close,
  toState,
  spot,
  jn,
  ks,
  is,
  Es,
  focus,
  step,
  tv,
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
              .slice(0, 6)
              .map(
                (Qs) =>
                  html`<${Ll}
                    key=${Qs.uf}
                    r=${Qs}
                    office=${office}
                    onPick=${pick}
                  />`,
              )}
          </section>`;
}
export function renderCompactoCartao({
  Jn,
  Rn,
  office,
  focus,
  close,
  town,
  modelo,
  toState,
  spot,
  jn,
  ks,
  is,
  Es,
  step,
  tv,
  setOffice,
  pick,
}) {
  return (
    Jn ||
    Rn({
      scroll: !0,
    }) ||
    renderCompactoResultadoTerritorial({
      town,
      office,
      modelo,
      close,
      toState,
      spot,
      jn,
      ks,
      is,
      Es,
      focus,
      step,
      tv,
      setOffice,
      pick,
    })
  );
}
export function renderCompactoTopo({
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
export function renderCompactoLinhaDoTempo() {
  return null;
}

export function renderCompactoContextoMapa({ modelo, focus, town }) {
  const municipio = town != null ? Geo.munis[town] : null;
  const resultado = municipio ? null : focus ? modelo.ufs[focus] : modelo.n;
  const nome = municipio
    ? `${municipio.nome || municipio.name} · ${municipio.uf}`
    : focus
      ? resultado?.name || focus
      : "Brasil";
  const disponivel =
    !modelo.empty &&
    (resultado?.base > 0 ||
      resultado?.valid > 0 ||
      resultado?.sections > 0 ||
      resultado?.pres?.some((candidato) => candidato.votes > 0));
  const contexto = municipio
    ? "Explore o mapa ou veja o resultado municipal."
    : disponivel
      ? Number.isFinite(resultado.pst)
        ? `${_t(resultado.pst, 1)}% das seções totalizadas`
        : "Totalização indisponível"
      : "Aguardando dados oficiais";
  const verResultados = (event) => {
    const painel = event.currentTarget
      .closest(".hud")
      .querySelector(".pres-results");
    if (!painel) return;
    const selector = painel.closest(".hud").querySelector(".swbar");
    const offset = (selector?.getBoundingClientRect().height || 0) + 12;
    painel.style.scrollMarginTop = `${offset}px`;
    painel.focus({ preventScroll: true });
    painel.scrollIntoView({ block: "start", behavior: "auto" });
  };
  return html`<section class="pres-map-context" aria-label="Local no mapa">
    <div>
      <h2>${nome}</h2>
      <p>${contexto}</p>
    </div>
    <button type="button" class="pres-results-link" onClick=${verResultados}>
      Ver resultados <span aria-hidden="true">↓</span>
    </button>
  </section>`;
}

export function renderCompactoConteudoMapa({
  props,
  mapaPresidencial,
  Zn,
  mapa,
  linha,
  cartao,
}) {
  if (!mapaPresidencial)
    return Zn ? html`${mapa}${linha}${cartao}` : html`${cartao}${mapa}${linha}`;
  return html`${renderCompactoContextoMapa({ modelo: props.m, focus: props.focus, town: props.town })}
    ${mapa}${linha}
    <section
      class="pres-results"
      tabindex="-1"
      aria-label="Resultados detalhados"
    >
      ${cartao}
    </section>`;
}
