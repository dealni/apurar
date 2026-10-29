import { Feed } from "../feed.js";
import { html, hn, Oe } from "./formatacao-e-acessibilidade-1.js";
import { renderPlayButton } from "./indicador-timeline-play.js";

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
  const timeline = timelineSourceState({ w, cc, t, e, T, _, z, gt });
  const available = timeline.available;
  const interaction = available ? { xt, Bt, ve, Ke } : {};
  return html`<div class="tlp">
    <div class="tl">
      ${available ? renderPlayButton(i, u) : null}
      <span class="now tn">${timeline.time}</span>
      <div class="track" ref=${v} onPointerLeave=${() => g(null)}>
        <div
          class="timeline-control"
          tabindex=${available ? "0" : "-1"}
          aria-disabled=${!available}
          onPointerDown=${interaction.xt}
          onPointerMove=${interaction.Bt}
          onPointerUp=${interaction.ve}
          onPointerCancel=${interaction.ve}
          onKeyDown=${interaction.Ke}
          role="slider"
          aria-label="Hora da apuração"
          aria-valuemin=${timeline.minimum}
          aria-valuemax=${timeline.maximum}
          aria-valuenow=${timeline.current}
          aria-valuetext=${timeline.description}
        >
          <div class="rail"></div>
          <div class="avail" style=${"width:" + Y(z) + "%"}></div>
          <div class="done" style=${"width:" + Y(gt) + "%"}></div>
          <i
            class="livept"
            key=${e ? "l" + t : "r"}
            style=${"left:" + Y(z) + "%"}
          ></i>
        </div>
        ${be.map((ot) => {
          const ke =
            (ot.big === "virada"
              ? "Virada às "
              : ot.big === "eleito"
                ? "Eleição definida às "
                : "2º turno definido às ") + hn(ot.t);
          return html`<button
            class=${"pin" + (ot.t === c ? " new" : "")}
            key=${ot.t}
            style=${"left:" + Y(ot.t) + "%"}
            aria-label=${ke}
            onClick=${() => s(ot.t)}
          >
            <span class="pl">${ke}</span>
          </button>`;
        })}
        <div class="thumb" style=${"left:" + Y(gt) + "%"}></div>
        ${h != null ? html`<span class="bubble tn" style=${"left:" + Y(h) + "%"}>${hn(h)}</span>` : null}
        <div class="hours">
          ${we.filter((ot, ke) => ke % le === 0 && ot * 60 <= _).map((ot) => html`<span key=${ot} style=${"left:" + Y(ot * 60) + "%"}>${ot % 24}</span>`)}
        </div>
      </div>
      ${e ? html`<span class="livechip"><i></i>${Feed.sourceSnapshot?.()?.mode === "demo" ? "Demonstração" : "Mais recente"}</span>` : html`<button class="btn golive" onClick=${a}>Mais recente</button>`}
    </div>
  </div>`;
}

function timelineSourceState({ w, cc, t, e, T, _, z, gt }) {
  const source = Feed.sourceSnapshot?.();
  const state = {
    available: !!source,
    minimum: Oe,
    maximum: T ? _ : Math.floor(z),
    current: Math.floor(gt),
    time: "—",
    description: "Horário indisponível: aguardando dados da fonte",
  };
  if (!source) return state;
  const minute = Math.floor(Feed.minuteOf(Date.parse(source.source.as_of)));
  if (Feed.LIVE && minute < Oe) {
    const time = formatSourceTime(source.source.as_of);
    return {
      available: false,
      minimum: minute,
      maximum: minute,
      current: minute,
      time,
      description: `Fonte de ${time} (Brasília); histórico indisponível antes do início da apuração`,
    };
  }
  state.time = w != null ? cc(w) : hn(t);
  state.description = describeTimeline(source, state.time, e);
  return state;
}

function formatSourceTime(value) {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    dateStyle: "short",
    timeStyle: "medium",
  }).format(new Date(value));
}

function describeTimeline(source, time, latest) {
  if (!source) return "Horário indisponível: aguardando dados da fonte";
  if (source.mode === "demo") return `${time}, demonstração`;
  return `${time}, ${latest ? "atualização mais recente" : "histórico"}`;
}
