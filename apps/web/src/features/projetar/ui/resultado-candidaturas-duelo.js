import { html, yt, _t, kt, ht } from "./formatacao-e-acessibilidade-1.js";
import { Io, Po, an, oo } from "./candidatos-e-partidos-1.js";
import { tn } from "./contagem-e-animacao-1.js";

/** O mesmo placar para os dois cargos; identidade e contagens vêm do próprio recorte. */
export function CandidaturasDuelo({
  candidates,
  spot = null,
  decimals = 2,
  official = false,
  context,
}) {
  return html`<div
    class=${"leaders" + (official && candidates.some((candidate) => candidate.validity) ? " has-validity" : "")}
  >
    ${candidates.map((candidate, index) => {
      const color = official ? candidate.color : kt(candidate);
      return html`<div
        class=${"leader" + (index ? " r" : "") + (candidate.id === spot ? " spot" : "") + (official ? "" : Io(candidate))}
        key=${candidate.id}
        ...${official ? {} : Po(candidate)}
      >
        <div class="who">
          <${an}
            c=${candidate}
            size=${52}
            color=${official ? color : null}
            context=${context}
          />
          <div>
            <div class="nm">${yt(candidate)}</div>
            <${oo} c=${candidate} color=${official ? color : null} />
          </div>
        </div>
        ${Number.isFinite(candidate.share) ? html`<div class="fig"><${tn} n=${candidate.share} fmt=${(value) => _t(value, decimals)} /><sup style=${"color:" + color}>%</sup></div>` : html`<div class="note">Percentual indisponível</div>`}
        <div class="votes tn">
          ${Number.isFinite(candidate.votes) ? html`<${tn} n=${candidate.votes} fmt=${ht} /> votos` : "Votos indisponíveis"}
        </div>
        ${official && candidate.validity ? html`<small class="validity">Destinação: ${candidate.validity}</small>` : null}
      </div>`;
    })}
  </div>`;
}
