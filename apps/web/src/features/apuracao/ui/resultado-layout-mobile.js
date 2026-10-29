import { El } from './mapa-interativo-1.js';
import { html, Xt } from './formatacao-e-acessibilidade-1.js';
import { Ol } from './deputados-2.js';
import { ql } from './resultados-municipais-1.js';
import { Nl } from './resultados-estaduais-1.js';
import { gd, bd } from './cidades-e-painel-1.js';
import { Be, $l } from './hud-e-comunicacao-1.js';
import { Ul, jl } from './navegacao-e-patrocinio-1.js';
import { Ya } from './busca-e-preferencias-1.js';
import { Ur, Ka } from './regioes-1.js';
import { _i } from './paineis-e-projecoes-2.js';
import { Zl } from './projecoes-graficos-2.js';
import { Rl } from './historico-e-graficos-1.js';
import { Fl } from './deputados-1.js';
import { Pl } from './composicao-legislativa-1.js';
import { Ua, Ll } from './resultados-e-listas-1.js';
import { Pt } from './apuracao-e-votos-1.js';
export function renderMobileAbaAtiva({
  gs,
  office,
  setOffice,
  modelo,
  Qe,
  tempo,
  pickTown,
  tv,
  pick,
  onSearch,
  toAbroad,
}) {
  return gs === 'resultados'
    ? html`<div class="sh-pane" key="res">
        <div class="sh-sw">
          <${Ya} office=${office} set=${setOffice} m=${modelo} />
        </div>
        ${
          office === 'pres'
            ? html`<${Be} name="regioes"
                  ><${Ur}
                    m=${modelo}
                    onAbroad=${Qe ? () => Qe.go('pres', 'ZZ') : null}
                    onState=${Qe ? (fo) => Qe.go('pres', fo) : null} /><//
                >${Xt === 2 ? html`<${Be} name="pais"><${_i} m=${modelo} t=${tempo} link=${Qe} onNext=${setOffice} onTown=${pickTown} fore=${Ka(modelo, tv)} /><//>` : html`<${Be} name="mais">${Ka(modelo, tv) ? html`<${Zl} m=${modelo} />` : html`<${Rl} m=${modelo} />`}<//>`}`
            : office === 'dep'
              ? html`<${Be} name="deputados"><${Fl} /><//>`
              : html`<section class="card enter">
                  <div class="hd">
                    <h3>${office === 'gov' ? 'Governadores' : 'Senado'}</h3>
                  </div>
                  ${office === 'sen' ? html`<${Pl} m=${modelo} />` : html`<${Ua} m=${modelo} office="gov" onPick=${pick} size=${20} />`}
                  <div class="sep"></div>
                  <div class="lh">
                    <h3>
                      ${office === 'gov' ? 'Disputas, das mais apertadas' : 'A disputa pela 2ª vaga'}
                    </h3>
                  </div>
                  ${Pt(modelo, office).map((fo) => html`<${Ll} key=${fo.uf} r=${fo} office=${office} onPick=${pick} />`)}
                </section>`
        }
      </div>`
    : gs === 'explorar'
        ? html`<${Be} name="explorar"
            ><${bd}
              m=${modelo}
              onSearch=${onSearch}
              onState=${pick}
              onTown=${pickTown}
              onAbroad=${toAbroad}
          /><//>`
        : null;
}
export function renderMobileCartao({
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
  pickTown,
}) {
  return (
    Jn ||
    Rn({
      scroll: !0,
    }) ||
    (office === 'dep' && focus
      ? html`<${Ol} uf=${focus} onClose=${close} />`
      : null) ||
    (town != null
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
            /><${gd} m=${modelo} uf=${focus} onTown=${pickTown} />`
        : null)
  );
}
export function renderMobileTopo({
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
      abroad=${focus === 'ZZ'}
      onAbroad=${toAbroad}
      onBrasil=${close}
      phone
      find=${!1}
  /><//>`;
}
export function renderMobileLinhaDoTempo() { return null; }
export function renderMobileMapa({
  gs,
  en,
  wo,
  qs,
  props,
  uo,
  Ss,
  jn,
  ks,
  is,
  Es,
  Je,
  Zn,
}) {
  return gs === 'mapa'
    ? html`<div class="sh-stage" ref=${en}>
        ${wo > 40 && qs > 40 ? html`<${Be} name="mapa" quiet retry=${2e3}><${El} m=${props.m} mode=${props.office} level=${props.focus ? 'mun' : 'uf'} cand=${props.cand} focus=${props.focus} town=${props.town} country=${props.country} onCity=${props.pickCity} cw=${wo} ch=${qs} rect=${uo} s=${jl(wo, qs, Ss)} onPick=${props.pick} onTown=${props.pickTown} small intro=${props.intro} zone=${jn} onZone=${ks} bairro=${is} onBairro=${Es} drev=${Je} /><//>` : null}
        ${Zn ? null : html`<div class="sh-ctl"><${Ya} office=${props.office} set=${props.setOffice} m=${props.m} /></div>`}
      </div>`
    : null;
}
