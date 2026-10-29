import { html, Te, ht } from "./formatacao-e-acessibilidade-1.js";
import { Geo } from "../geography.js";
import { wr, Xs } from "./paineis-e-projecoes-1.js";
import { Ci } from "./candidatos-e-partidos-1.js";
import { CandidaturasDuelo } from "./resultado-candidaturas-duelo.js";

const count = (value) => (value == null ? "Indisponível" : ht(value));
const clock = (value) =>
  value
    ? new Date(value).toLocaleString("pt-BR", {
        timeZone: "America/Sao_Paulo",
      }) + " · Brasília"
    : "Horário da fonte indisponível";

export function ResultadoGovernador({ selected, focus, town, heading = null }) {
  const title = town != null ? Geo.munis[town].name : Te[focus];
  const { result, row, available } = selected;
  const preserved = resultadoPreservado(selected);
  const candidates = candidaturasObservadas(selected, preserved);
  const known = available || preserved;
  const sections = known ? result.sections : null;
  const hasVotes = available && row.base > 0;
  const headline = tituloResultado(selected, candidates, hasVotes);
  return html`<section
    class=${"card hero enter gov-result" + (hasVotes ? "" : " pre")}
    aria-label=${"Governador · " + title}
  >
    ${heading}
    <div class="kick">
      <span>${title} · ${focus}</span
      ><span class="chip">Resultado oficial</span>
    </div>
    <div class="sentbox"><h2 class="sent">${headline}</h2></div>
    ${
      !selected.inRace
        ? html`<p class="note" role="status">${selected.status}</p>`
        : html`<div class="official-result" data-result-id=${result?.id}>
            <p class="note" role="status">${selected.status}</p>
            ${avisoComparacao(selected, known)}
            <p class="note tn">Fonte: ${clock(selected.asOf)}</p>
            ${sections?.counted != null && sections.total > 0 ? html`<${wr} r=${{ pst: sections.counted / sections.total, sections: sections.total, secDone: sections.counted, left: null }} />` : html`<p class="note">Contagem de seções indisponível nesta atualização.</p>`}
            ${candidates.length ? html`<${CandidaturasDuelo} candidates=${candidates} official context=${{ office: "governor", uf: focus }} />` : html`<p class="note">Candidaturas indisponíveis nesta atualização.</p>`}
            ${
              hasVotes
                ? html`<div class="sharebox">
                      <${Ci}
                        left=${candidates[0]}
                        right=${candidates[1]}
                        colors=${candidates.map((candidate) => candidate.color)}
                        showThresholdHints=${false}
                      />
                    </div>
                    <p class="note">
                      Percentuais dos votos computados das candidaturas.
                    </p>`
                : null
            }
            ${row?.voteDestinationWarning ? html`<p class="note">Destinações especiais podem diferir dos votos válidos. Os percentuais consideram os votos computados das candidaturas.</p>` : null}
            <div class="ns ns-pa">
              <div class="nsh"><h3>Participação</h3></div>
              <div class="official-totals kpis2">
                ${Object.entries({ "Votos válidos": result?.totals.valid, Brancos: result?.totals.blank, Nulos: result?.totals.null, Comparecimento: result?.totals.turnout, Eleitorado: result?.totals.electorate, Abstenção: result?.totals.abstention }).map(([label, value]) => html`<${Xs} key=${label} k=${label} n=${known ? value : null} fmt=${count} still />`)}
              </div>
              <div class="kpi1 tn">
                <${Xs}
                  k="Seções totalizadas"
                  v=${sections ? count(sections.counted) + " de " + count(sections.total) : "Indisponível"}
                  still
                />
              </div>
            </div>
            ${result?.source_url ? html`<a class="upto" href=${result.source_url} target="_blank" rel="noopener noreferrer">Ver resultado no TSE ↗</a>` : null}
            <p class="note">Resultados oficiais.</p>
          </div>`
    }
  </section>`;
}

export function tituloResultado(selected, candidates, hasVotes) {
  const available = selected.available;
  const tied = hasVotes && candidates[0].votes === candidates[1].votes;
  return !selected.inRace || !available
    ? selected.status
    : !hasVotes
      ? "Nenhum voto computado ainda"
      : tied
        ? "Empate nos votos computados"
        : html`<b style=${"color:" + candidates[0].color}
              >${candidates[0].name}</b
            >${" lidera a apuração"}`;
}

/** Observações válidas não dependem de uma paleta completa para manter contagens. */
export function resultadoPreservado(selected) {
  const result = selected.result;
  return !!(
    result?.status === "available" &&
    new Set(result.candidates.map((candidate) => candidate.id)).size ===
      result.candidates.length
  );
}
export function candidaturasObservadas(selected, preserved) {
  return selected.candidates
    .map((candidate) => {
      const observation = preserved
        ? selected.result.candidates.find(
            (value) => candidate.id === `g${selected.result.uf}-${value.id}`,
          )
        : null;
      return observation
        ? {
            ...candidate,
            votes: observation.votes,
            share: selected.available ? candidate.share : null,
          }
        : candidate;
    })
    .sort((a, b) => (b.votes ?? 0) - (a.votes ?? 0));
}

function avisoComparacao(selected, known) {
  return known && !selected.available && !selected.result.stale
    ? html`<p class="note">
        Dados oficiais disponíveis; comparação entre candidaturas indisponível
        nesta publicação.
      </p>`
    : null;
}
