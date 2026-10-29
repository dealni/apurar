import {
  renderTvCartao,
  renderTvMapa,
  renderTvTopo,
  renderTvLinhaDoTempo,
} from "./resultado-layout-tv.js";
import { html, ge } from "./formatacao-e-acessibilidade-1.js";
import { Be } from "./hud-e-comunicacao-1.js";
import { Ya } from "./busca-e-preferencias-1.js";
import { qn, ho } from "./contagem-e-animacao-1.js";
export function renderPainelTV({
  props,
  Rn,
  jn,
  ks,
  is,
  Es,
  rs,
  fn,
  en,
  Ss,
  Je,
  Vs,
  Us,
  Bn,
  ye,
  yn,
  On,
}) {
  const { onForward = null, playing = !1, onPlay = null } = props;
  const Ce = renderTvCartao({
      Rn,
      office: props.office,
      focus: props.focus,
      close: props.close,
      town: props.town,
      modelo: props.m,
      toState: props.toState,
      spot: props.spot,
      tv: props.tv,
      jn,
      ks,
      is,
      Es,
      step: props.step,
      rs,
      setOffice: props.setOffice,
      pick: props.pick,
    }),
    Mn = {
      x0: 4,
      x1: fn.w - 4,
      y0: rs ? 48 : 4,
      y1: fn.h - 4,
    },
    Ws =
      rs && props.office === "pres" ? props.level : props.focus ? "mun" : "uf",
    _o = renderTvMapa({
      en,
      fn,
      rs,
      modelo: props.m,
      office: props.office,
      level: props.level,
      setLevel: props.setLevel,
      cand: props.cand,
      setCand: props.setCand,
      replay: props.replay,
      focus: props.focus,
      town: props.town,
      country: props.country,
      close: props.close,
      toState: props.toState,
      toAbroad: props.toAbroad,
      pickCountry: props.pickCountry,
      Mn,
      is,
      Es,
      Ws,
      pickCity: props.pickCity,
      Ss,
      pick: props.pick,
      pickTown: props.pickTown,
      intro: props.intro,
      jn,
      ks,
      Je,
    }),
    wo = renderTvTopo({
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
    qs = html`<${Ya}
      office=${props.office}
      set=${props.setOffice}
      tv=${props.tv}
      m=${props.m}
    />`,
    uo = renderTvLinhaDoTempo({
      tv: props.tv,
      tempo: props.t,
      live: props.live,
      clock: props.clock,
      onScrub: props.onScrub,
      onLive: props.onLive,
      onForward,
      playing,
      onPlay,
    }),
    zo =
      "hud phone" +
      (Us ? " land" : "") +
      (rs ? " tablet" : "") +
      (props.intro ? " intro" : ""),
    Do = `width:${Bn}px;height:${ye}px;--tw:${qn.on && !ge ? ho.dur : 300}ms;--tb:${qn.on && !ge ? Math.min(1600, ho.dur) : 300}ms`,
    Qs = html`<${Be} name="cartao">${Ce}<//>`;
  return Us
    ? html`<div class=${zo} data-h="short" style=${Do}>
        ${wo}${_o}
        <div class="side">${qs}${Qs}</div>
        ${uo}${yn}${On}
      </div>`
    : html`<div class=${zo} data-h="short" style=${Do}>
        ${wo}${qs}${Qs}${_o}${uo}${yn}${On}
      </div>`;
}
