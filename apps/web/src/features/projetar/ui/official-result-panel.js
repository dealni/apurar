import { html, ht } from "./formatacao-e-acessibilidade-1.js";
import { officialRows } from "./official-result.js";
import { resultStatus } from "../../../integration/supplemental-data.ts";
import { CandidaturasDuelo } from "./resultado-candidaturas-duelo.js";
import { Ci } from "./candidatos-e-partidos-1.js";
import { wr, Xs } from "./paineis-e-projecoes-1.js";

const count = (value) => (value == null ? "Indisponível" : ht(value));
const clock = (value) =>
  value
    ? new Date(value).toLocaleString("pt-BR", {
        timeZone: "America/Sao_Paulo",
      }) + " · Brasília"
    : "Horário da fonte indisponível";

/** Apresentação compartilhada com os painéis principais, com dados do próprio local. */
export function ResultadoOficialPainel({ item, candidates = [] }) {
  if (!item)
    return html`<p class="note" role="status">
      Resultado oficial indisponível nesta atualização. Isso não significa zero
      votos.
    </p>`;
  const { rows, total } = officialRows(item, candidates);
  const observed = rows.map(({ candidate, color, share }) => ({
    ...candidate,
    partido: candidate.party,
    n: candidate.id,
    color,
    share,
  }));
  const sections = item.sections;
  return html`<section class="official-result" data-result-id=${item.id}>
    <div class="kick">
      <span>Presidente no exterior</span
      ><span class="chip">Resultado oficial</span>
    </div>
    <p class="note" role="status">${resultStatus(item)}</p>
    ${item.coverage && item.coverage.available < item.coverage.total ? html`<p class="note" role="alert">Total parcial: ${item.coverage.available} de ${item.coverage.total} cidades disponíveis. Este resultado não representa o país completo.</p>` : null}
    <p class="note tn">Fonte: ${clock(item.as_of)}</p>
    ${item.kind === "country" || item.scope === "country" ? html`<p class="note">Soma das cidades oficiais disponíveis. Horário do resultado mais antigo incluído; cada cidade pode ter uma atualização diferente.</p>` : null}
    ${sections.counted != null && sections.total > 0 ? html`<${wr} r=${{ pst: sections.counted / sections.total, sections: sections.total, secDone: sections.counted, left: null }} />` : html`<p class="note">Contagem de seções indisponível nesta atualização.</p>`}
    ${observed.length ? html`<${CandidaturasDuelo} candidates=${observed} official context=${{ office: item.office, uf: item.uf }} />` : html`<p class="note">Candidaturas indisponíveis nesta atualização.</p>`}
    ${
      rows.length === 2 && total > 0
        ? html`<div class="sharebox">
              <${Ci}
                left=${observed[0]}
                right=${observed[1]}
                colors=${observed.map((candidate) => candidate.color)}
                showThresholdHints=${false}
              />
            </div>
            <p class="note">
              Percentuais dos votos computados das candidaturas.
            </p>`
        : null
    }
    ${observed.filter((candidate) => candidate.status).map((candidate) => html`<p class="note" key=${candidate.id}>${candidate.name}: ${candidate.status}</p>`)}
    <div class="ns ns-pa">
      <div class="nsh"><h3>Participação</h3></div>
      <div class="official-totals kpis2">
        ${Object.entries({ "Votos válidos": item.totals.valid, Brancos: item.totals.blank, Nulos: item.totals.null, Comparecimento: item.totals.turnout, Eleitorado: item.totals.electorate, Abstenção: item.totals.abstention }).map(([label, value]) => html`<${Xs} key=${label} k=${label} n=${value} fmt=${count} still />`)}
      </div>
      <div class="kpi1 tn">
        <${Xs}
          k="Seções totalizadas"
          v=${count(sections.counted) + " de " + count(sections.total)}
          still
        />
      </div>
    </div>
    ${item.source_url ? html`<a class="upto" href=${item.source_url} target="_blank" rel="noopener noreferrer">Ver resultado no TSE ↗</a>` : null}
    <p class="note">Resultados oficiais.</p>
  </section>`;
}
