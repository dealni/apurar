import { LegendaCompactaMapa } from "./modelo-mapa-legenda-compacta.js";
import {
  renderCompactoCartao,
  renderCompactoConteudoMapa,
  renderCompactoTopo,
  renderCompactoLinhaDoTempo,
} from "./resultado-layout-compacto.js";
import { html, ie, ge } from "./formatacao-e-acessibilidade-1.js";
import { Be } from "./hud-e-comunicacao-1.js";
import { El } from "./mapa-interativo-1.js";
import { jl } from "./navegacao-e-patrocinio-1.js";
import { Ur, Ka } from "./regioes-1.js";
import { Zl } from "./projecoes-graficos-2.js";
import { Rl } from "./historico-e-graficos-1.js";
import { Tc } from "./atualizacoes-1.js";
import { qn, ho } from "./contagem-e-animacao-1.js";
import { Ya } from "./busca-e-preferencias-1.js";
export function renderPainelCompacto({
  props,
  Jn,
  Rn,
  jn,
  ks,
  is,
  Es,
  Bn,
  fn,
  en,
  Ss,
  Je,
  Vs,
  Zn,
  Qe,
  yn,
  On,
}) {
  const { onForward = null, playing = !1, onPlay = null } = props;
  const Ce = renderCompactoCartao({
      Jn,
      Rn,
      office: props.office,
      focus: props.focus,
      close: props.close,
      town: props.town,
      modelo: props.m,
      toState: props.toState,
      spot: props.spot,
      jn,
      ks,
      is,
      Es,
      step: props.step,
      tv: props.tv,
      setOffice: props.setOffice,
      pick: props.pick,
    }),
    Mn = ie(Math.round((Bn - 32) * 0.94), 240, 560),
    Ws = {
      x0: 4,
      x1: fn.w - 4,
      y0: 4,
      y1: fn.h - 4,
    },
    _o = html`<div class="mapwrap" ref=${en} style=${`height:${Mn}px`}>
        ${fn.w > 40 && fn.h > 40 ? html`<${Be} name="mapa" quiet retry=${2e3}><${El} m=${props.m} mode=${props.office} level=${props.focus ? "mun" : "uf"} cand=${props.cand} focus=${props.focus} town=${props.town} country=${props.country} onCity=${props.pickCity} cw=${fn.w} ch=${fn.h} rect=${Ws} s=${jl(fn.w, fn.h, Ss)} onPick=${props.pick} onTown=${props.pickTown} small intro=${props.intro} zone=${jn} onZone=${ks} bairro=${is} onBairro=${Es} flow drev=${Je} /><//>` : null}
      </div>
      <${LegendaCompactaMapa}
        m=${props.m}
        mode=${props.office}
        focus=${props.focus}
        town=${props.town}
        country=${props.country}
      />`,
    wo = renderCompactoTopo({
      modelo: props.m,
      tempo: props.t,
      live: props.live,
      conn: props.conn,
      office: props.office,
      setOffice: props.setOffice,
      onTV: props.onTV,
      onSearch: props.onSearch,
      onExit: props.onExit,
      onShare: props.onShare,
      about: props.about,
      setAbout: props.setAbout,
      tv: props.tv,
      focus: props.focus,
      toAbroad: props.toAbroad,
      close: props.close,
      Vs,
    }),
    qs = renderCompactoLinhaDoTempo({
      tempo: props.t,
      live: props.live,
      clock: props.clock,
      onScrub: props.onScrub,
      onLive: props.onLive,
      onForward,
      playing,
      onPlay,
    }),
    uo = Zn
      ? null
      : html`<${Be} name="mais"
          >${props.office === "pres" ? html`<${Ur} m=${props.m} key="reg" onAbroad=${Qe ? () => Qe.go("pres", "ZZ") : null} onState=${Qe ? (Qs) => Qe.go("pres", Qs) : null} />${Ka(props.m, props.tv) ? html`<${Zl} m=${props.m} key="fc" />` : html`<${Rl} m=${props.m} key="trend" />`}` : null}<${Tc}
            t=${props.t}
            link=${Qe}
            m=${props.m}
            onTown=${props.pickTown}
            key="feed"
        /><//>`,
    mapaPresidencial = temMapaPresidencial(props),
    zo = html`<${Be} name="cartao">${Ce}<//>`;
  return html`<div
    class=${"hud phone flow" + (props.intro ? " intro" : "") + (mapaPresidencial ? " pres-map-first" : "")}
    data-h="tall"
    style=${`--tw:${qn.on && !ge ? ho.dur : 300}ms;--tb:${qn.on && !ge ? Math.min(1600, ho.dur) : 300}ms`}
  >
    ${wo}
    <div class="swbar">
      <${Ya} office=${props.office} set=${props.setOffice} m=${props.m} />
    </div>
    ${renderCompactoConteudoMapa({ props, mapaPresidencial, Zn, mapa: _o, linha: qs, cartao: zo })}${uo}${yn}${On}
  </div>`;
}

function temMapaPresidencial(props) {
  return props.office === "pres" && props.focus !== "ZZ";
}
