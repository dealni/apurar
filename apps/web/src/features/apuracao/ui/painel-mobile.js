import {
  renderMobileAbaAtiva,
  renderMobileCartao,
  renderMobileTopo,
  renderMobileLinhaDoTempo,
  renderMobileMapa,
} from './resultado-layout-mobile.js';
import { html, ge } from './formatacao-e-acessibilidade-1.js';
import { hd } from './cidades-e-painel-1.js';
import { Be } from './hud-e-comunicacao-1.js';
import { $d, fd } from './navegacao-e-patrocinio-1.js';
import { qn, ho } from './contagem-e-animacao-1.js';
export function renderPainelMobile({
  props,
  Zn,
  Jn,
  Rn,
  jn,
  ks,
  is,
  Es,
  fn,
  gs,
  en,
  Ss,
  Je,
  Qe,
  K,
  te,
  I,
  Bn,
  ye,
  Vs,
  yn,
  On,
}) {
  const { onForward = null, playing = !1, onPlay = null } = props;
  const Ce = Zn ? 60 : 124,
    Mn = Zn ? 0 : 60,
    Ws = 196,
    _o = renderMobileCartao({
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
      pickTown: props.pickTown,
    }),
    wo = fn.w,
    qs = fn.h,
    uo = {
      x0: 4,
      x1: wo - 4,
      y0: Ce - 60 + (Zn ? 8 : 52),
      y1: qs - (Zn ? Ws + 8 : Mn + 8),
    },
    zo = renderMobileMapa({
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
    }),
    Do = renderMobileTopo({
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
    }),
    Qs = html`<${Be} name="disputa" quiet
      ><${$d} m=${props.m} compact=${!!Zn}
    /><//>`,
    pa = renderMobileAbaAtiva({
      gs,
      office: props.office,
      setOffice: props.setOffice,
      modelo: props.m,
      Qe,
      tempo: props.t,
      pickTown: props.pickTown,
      tv: props.tv,
      pick: props.pick,
      onSearch: props.onSearch,
      toAbroad: props.toAbroad,
    }),
    sr = renderMobileLinhaDoTempo({
      gs,
      Zn,
      tempo: props.t,
      live: props.live,
      clock: props.clock,
      onScrub: props.onScrub,
      onLive: props.onLive,
      onForward,
      playing,
      onPlay,
    }),
    or =
      gs === 'mapa' && Zn && _o
        ? html`<${hd} full=${K} setFull=${te} onClose=${props.close} peek=${Ws}
            ><${Be} name="cartao">${_o}<//><//
          >`
        : null,
    sl = (fo) => {
      (fo === gs && fo === 'mapa' && Zn && props.close(), I(fo));
    };
  return html`<div
    class=${'hud phone shell' + (props.intro ? ' intro' : '')}
    data-h="tall"
    style=${`width:${Bn}px;height:${ye}px;--rbh:${Ce}px;--tlh:${Mn}px;--tw:${qn.on && !ge ? ho.dur : 300}ms;--tb:${qn.on && !ge ? Math.min(1600, ho.dur) : 300}ms`}
  >
    ${Do}${Qs}${Vs}${zo}${pa}${sr}${or}<${fd}
      tab=${gs}
      setTab=${sl}
    />${yn}${On}
  </div>`;
}
