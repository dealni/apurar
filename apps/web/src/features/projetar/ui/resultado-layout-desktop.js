import { B1, W1, j1 } from "./avisos-e-ticker-1.js";
import { ic } from "./mapa-escala-1.js";
import { El } from "./mapa-interativo-1.js";
import { qn, ho } from "./contagem-e-animacao-1.js";
import { html, ge } from "./formatacao-e-acessibilidade-1.js";
import { Be, gi, $l } from "./hud-e-comunicacao-1.js";
import { Zs, Zc, Wl, jl, Ul } from "./navegacao-e-patrocinio-1.js";
import { _u } from "./paineis-e-projecoes-1.js";
export function renderDesktopFaixaApuracao({ Zo, za, modelo }) {
  return Zo
    ? html`<div
        class="rbwrap"
        style=${`left:${Zs}px;right:${Zs}px;top:${Zc}px;height:${za}px`}
      >
        <${Be} name="faixa-topo" quiet><${_u} m=${modelo} /><//>
      </div>`
    : null;
}
export function renderDesktopLinhaDoTempo() {
  return null;
}
export function renderDesktopEspacoCamera({ Ta, nl, er }) {
  return Ta
    ? html`<div
        class="camslot"
        style=${`right:${Zs}px;bottom:${Zs + Wl + 12}px;width:${nl}px;height:${er}px`}
        aria-hidden="true"
      >
        <span><${gi} /> Espaço da câmera</span>
      </div>`
    : null;
}
export function classesDesktop({ props }) {
  return props.tv && props.idle ? " idle" : "";
}
export function duracaoDesktopTransicao() {
  return qn.on && !ge ? Math.min(1600, ho.dur) : 300;
}
export function renderDesktopMapa({
  Gn,
  props,
  Gs,
  ws,
  Dn,
  Ss,
  Js,
  jn,
  eo,
  ks,
  is,
  Es,
  Je,
}) {
  return Gn.x1 - Gn.x0 > 80 && Gn.y1 - Gn.y0 > 80
    ? html`<${Be} name="mapa" quiet retry=${2e3}
        ><${El}
          m=${props.m}
          mode=${props.office}
          level=${props.office === "pres" ? props.level : "uf"}
          cand=${props.cand}
          focus=${props.focus}
          town=${props.town}
          country=${props.country}
          onCity=${props.pickCity}
          cw=${Gs}
          ch=${ws}
          rect=${Gn}
          s=${jl(Gs, ws, Dn * Ss)}
          onPick=${props.pick}
          onTown=${props.pickTown}
          intro=${props.intro}
          tv=${props.tv}
          linked=${Js}
          zone=${jn}
          linkedZ=${eo}
          onZone=${ks}
          bairro=${is}
          onBairro=${Es}
          drev=${Je}
      /><//>`
    : null;
}
export function renderDesktopEstrutura(estado) {
  const {
    onForward = null,
    playing = !1,
    onPlay = null,
    cam = !1,
    onCam = null,
  } = estado.props;
  return html`<div
    class=${
      "hud" +
      (estado.props.tv ? " tv" : "") +
      classesDesktop({
        props: estado.props,
      }) +
      (estado.props.intro ? " intro" : "")
    }
    data-h=${estado.Eo}
    style=${`width:${estado.Gs}px;height:${estado.ws}px;zoom:${estado.Dn};--lw:${estado._s}px;--tw:${qn.on && !ge ? ho.dur : 300}ms;--tb:${duracaoDesktopTransicao()}ms`}
  >
    <${Be} name="topo" fallback=${$l}
      ><${Ul}
        m=${estado.props.m}
        t=${estado.props.t}
        live=${estado.props.live}
        conn=${estado.props.conn}
        office=${estado.props.office}
        setOffice=${estado.props.setOffice}
        onTV=${estado.props.onTV}
        onSearch=${estado.props.onSearch}
        onExit=${estado.props.onExit}
        cam=${cam}
        onCam=${estado.props.tv ? onCam : null}
        onShare=${estado.props.onShare}
        about=${estado.props.about}
        setAbout=${estado.props.setAbout}
        tv=${estado.props.tv}
        abroad=${estado.props.focus === "ZZ"}
        onAbroad=${estado.props.toAbroad}
        onBrasil=${estado.props.close}
        apurTop=${!estado.Zo} /><//
    >${estado.Vs}
    <${Be} name="mapa-topo" quiet
      ><${ic}
        m=${estado.props.m}
        mode=${estado.props.office}
        level=${estado.props.level}
        setLevel=${estado.props.setLevel}
        cand=${estado.props.cand}
        setCand=${estado.props.setCand}
        replay=${estado.props.replay}
        focus=${estado.props.focus}
        town=${estado.props.town}
        country=${estado.props.country}
        onBrasil=${estado.props.close}
        onState=${estado.props.toState}
        onAbroad=${estado.props.toAbroad}
        onCountry=${estado.props.pickCountry}
        rect=${estado.Gn}
        hush=${!!estado.vs && !estado.io}
        tv=${estado.props.tv}
        bairro=${estado.is}
        onBairro=${estado.Es}
    /><//>
    ${renderDesktopFaixaApuracao({
      Zo: estado.Zo,
      za: estado.za,
      modelo: estado.props.m,
    })}
    ${estado._a ? null : html`<aside class="col l" key=${"l" + estado.props.office} style=${`left:${Zs}px;top:${estado.el}px;bottom:${estado.nr}px;width:${estado._s}px`}><${Be} name="coluna">${estado.Jr}<//></aside>`}
    ${estado.Ea ? html`<aside class="col r" style=${`right:${Zs}px;top:${estado.el}px;bottom:${estado.nr}px;width:${estado.xa}px`}><${Be} name="cartao">${estado.Qr}<//></aside>` : null}
    ${renderDesktopLinhaDoTempo({
      tv: estado.props.tv,
      Gn: estado.Gn,
      tempo: estado.props.t,
      live: estado.props.live,
      clock: estado.props.clock,
      onScrub: estado.props.onScrub,
      onLive: estado.props.onLive,
      onForward,
      playing,
      onPlay,
      toast: estado.props.toast,
    })}
    ${renderDesktopMapa({
      Gn: estado.Gn,
      props: estado.props,
      Gs: estado.Gs,
      ws: estado.ws,
      Dn: estado.Dn,
      Ss: estado.Ss,
      Js: estado.Js,
      jn: estado.jn,
      eo: estado.eo,
      ks: estado.ks,
      is: estado.is,
      Es: estado.Es,
      Je: estado.Je,
    })}
    ${estado.vs ? html`<${Be} name="aviso" quiet><${B1} e=${estado.vs} out=${estado.io} x=${(estado.Gn.x0 + estado.Gn.x1) / 2} y=${estado.Gn.y0 - 48} w=${estado.Gn.x1 - estado.Gn.x0 - 32} onClose=${estado.props.onToast} key=${estado.vs.t} /><//>` : null}
    ${estado.props.tv ? html`<${Be} name="faixa" quiet><${W1} t=${estado.props.t} style=${`left:${Zs}px;right:${Zs}px;bottom:${Zs}px;height:${Wl}px`} /><//>` : null}
    ${renderDesktopEspacoCamera({
      Ta: estado.Ta,
      nl: estado.nl,
      er: estado.er,
    })}
    ${
      estado.xs
        ? html`<div
            class=${"evover" + (estado.Ge ? " out" : "")}
            key=${"ev" + estado.xs.t}
          >
            <${Be} name="evento" quiet
              ><${j1} e=${estado.xs} m=${estado.props.m}
            /><//>
          </div>`
        : null
    }
    ${estado.yn ? html`<${Be} name="busca" quiet>${estado.yn}<//>` : null}${estado.On}
  </div>`;
}
