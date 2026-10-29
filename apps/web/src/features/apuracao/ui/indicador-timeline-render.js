import { html, hn, Oe } from './formatacao-e-acessibilidade-1.js';
import { renderPlayButton } from './indicador-timeline-play.js';

export function renderTimeline({
  i,
  u,
  w,
  cc,
  t,
  v,
  xt,
  Bt,
  ve,
  g,
  Ke,
  T,
  _,
  z,
  gt,
  e,
  Y,
  be,
  c,
  s,
  h,
  we,
  le,
  a,
}) {
  return html`<div class="tlp">
    <div class="tl">
      ${renderPlayButton(i, u)}
      <span class="now tn">${w != null ? cc(w) : hn(t)}</span>
      <div
        class="track"
        ref=${v}
        onPointerLeave=${() => g(null)}
      >
        <div
        class="timeline-control"
        tabindex="0"
        onPointerDown=${xt}
        onPointerMove=${Bt}
        onPointerUp=${ve}
        onPointerCancel=${ve}
        onKeyDown=${Ke}
        role="slider"
        aria-label="Hora da apuração"
        aria-valuemin=${Oe}
        aria-valuemax=${T ? _ : Math.floor(z)}
        aria-valuenow=${Math.floor(gt)}
        aria-valuetext=${(w != null ? cc(w) : hn(t)) + (e ? ', observação mais recente' : '')}
      >
        <div class="rail"></div>
        <div class="avail" style=${'width:' + Y(z) + '%'}></div>
        <div class="done" style=${'width:' + Y(gt) + '%'}></div>
        <i
          class="livept"
          key=${e ? 'l' + t : 'r'}
          style=${'left:' + Y(z) + '%'}
        ></i>
        </div>
        ${be.map((ot) => {
          const ke =
            (ot.big === 'virada'
              ? 'Virada às '
              : ot.big === 'eleito'
                ? 'Eleição definida às '
                : '2º turno definido às ') + hn(ot.t);
          return html`<button
            class=${'pin' + (ot.t === c ? ' new' : '')}
            key=${ot.t}
            style=${'left:' + Y(ot.t) + '%'}
            aria-label=${ke}
            onClick=${() => s(ot.t)}
          >
            <span class="pl">${ke}</span>
          </button>`;
        })}
        <div class="thumb" style=${'left:' + Y(gt) + '%'}></div>
        ${h != null ? html`<span class="bubble tn" style=${'left:' + Y(h) + '%'}>${hn(h)}</span>` : null}
        <div class="hours">
          ${we.filter((ot, ke) => ke % le === 0 && ot * 60 <= _).map((ot) => html`<span key=${ot} style=${'left:' + Y(ot * 60) + '%'}>${ot % 24}</span>`)}
        </div>
      </div>
      ${e ? html`<span class="livechip"><i></i>Mais recente</span>` : html`<button class="btn golive" onClick=${a}>Mais recente</button>`}
    </div>
  </div>`;
}
