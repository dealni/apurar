import { html, useEffect, useState } from "./formatacao-e-acessibilidade-1.js";
import { SupplementalFeed } from "../../../integration/supplemental-client.ts";
import { candidatePortrait } from "../../../runtime/candidate-portraits.ts";
import { resultStatus } from "../../../integration/supplemental-data.ts";
import "../styles/36-detalhamento-oficial.css";
const fmt = (value) =>
  value == null ? "Indisponível" : value.toLocaleString("pt-BR");
const percent = (value) =>
  (value * 100).toLocaleString("pt-BR", { maximumFractionDigits: 2 });
const clock = (value) =>
  value
    ? new Date(value).toLocaleString("pt-BR", {
        timeZone: "America/Sao_Paulo",
      }) + " · Brasília"
    : "Horário da fonte indisponível";
export function useSupplemental() {
  const [state, setState] = useState(SupplementalFeed.get());
  useEffect(() => SupplementalFeed.subscribe(setState), []);
  return state;
}
function OfficialCandidate({ candidate, item, color, share, right }) {
  const portrait = candidatePortrait(candidate, {
    office: item.office,
    uf: item.uf,
  });
  const [failed, setFailed] = useState(null);
  const initials = candidate.name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("");
  return html`<div class=${"official-candidate cand" + (right ? " r" : "")}>
    <div class="official-candidate-name who">
      <div class="av official-avatar" style=${`--c:${color};--on:#fff`}>
        ${portrait && failed !== portrait ? html`<img class="official-portrait" src=${portrait} alt="" width="40" height="40" loading="lazy" decoding="async" onError=${() => setFailed(portrait)} />` : html`<span class="ini">${initials}</span>`}
      </div>
      <div>
        <div class="nm">${candidate.name}</div>
        <span class="pm" style=${`color:${color}`}
          >${candidate.party} ${candidate.id}</span
        >
      </div>
    </div>
    ${share != null ? html`<div class="fig" style=${`color:${color}`} aria-label=${percent(share) + "% dos votos computados"}>${percent(share)}<sup>%</sup></div>` : html`<div class="official-share-unavailable">Percentual indisponível</div>`}
    <div class="official-votes tn">
      ${candidate.votes == null ? "Votos indisponíveis" : fmt(candidate.votes) + " votos"}
    </div>
    ${candidate.status ? html`<small>${candidate.status}</small>` : null}
    ${candidate.validity ? html`<small>Destinação: ${candidate.validity}</small>` : null}
  </div>`;
}
export function officialRows(item, candidates) {
  const completeVotes =
    item.status === "available" &&
    !item.stale &&
    !(item.coverage && item.coverage.available < item.coverage.total) &&
    item.candidates.length === 2 &&
    new Set(item.candidates.map((candidate) => candidate.id)).size === 2 &&
    item.candidates.every((candidate) => candidate.votes !== null);
  const total = completeVotes
    ? item.candidates.reduce((sum, candidate) => sum + candidate.votes, 0)
    : null;
  const rows = item.candidates.map((candidate) => ({
    candidate,
    color:
      candidates.find(
        (entry) =>
          entry.id === candidate.id || String(entry.n) === candidate.id,
      )?.color || "#aeb8bd",
    share: total > 0 ? candidate.votes / total : null,
  }));
  return { rows, total };
}
function sectionProgress(item) {
  if (item.sections.counted == null || item.sections.total == null)
    return html`<p class="note" role="status">
      Contagem de seções indisponível nesta atualização.
    </p>`;
  const share =
    item.sections.counted != null && item.sections.total > 0
      ? item.sections.counted / item.sections.total
      : null;
  return html`<div class="official-progress">
    <p class="note tn">
      ${fmt(item.sections.counted)} de ${fmt(item.sections.total)} seções
      totalizadas
    </p>
    ${share != null ? html`<div class="track" role="progressbar" aria-label="Seções totalizadas" aria-valuemin="0" aria-valuemax="100" aria-valuenow=${Number((share * 100).toFixed(2))}><i style=${`width:${Math.min(1, share) * 100}%`}></i></div>` : null}
  </div>`;
}
export function OfficialResult({ item, showHeading = true, candidates = [] }) {
  if (!item)
    return html`<p class="note" role="status">
      Resultado oficial indisponível nesta atualização. Isso não significa zero
      votos.
    </p>`;
  const { rows, total } = officialRows(item, candidates);
  return html`<section class="official-result" data-result-id=${item.id}>
    ${showHeading ? html`<h3>${item.name}</h3>` : null}
    <p class="note" role="status">${resultStatus(item)}</p>
    ${item.coverage && item.coverage.available < item.coverage.total ? html`<p class="note" role="alert">Total parcial: ${item.coverage.available} de ${item.coverage.total} cidades disponíveis. Este resultado não representa o país completo.</p>` : null}
    <p class="note tn">Fonte: ${clock(item.as_of)}</p>
    ${item.kind === "country" || item.scope === "country" ? html`<p class="note">Soma das cidades oficiais disponíveis. Horário do resultado mais antigo incluído; cada cidade pode ter uma atualização diferente.</p>` : null}
    ${sectionProgress(item)}
    <div class=${"official-candidates" + (rows.length === 2 ? " duel" : "")}>
      ${rows.map(({ candidate, color, share }, index) => html`<${OfficialCandidate} key=${item.id + ":" + candidate.id} candidate=${candidate} item=${item} color=${color} share=${share} right=${rows.length === 2 && index === 1} />`)}
    </div>
    ${
      rows.length === 2 && total > 0
        ? html`<div class="goal official-goal" style="--h:6px">
            <div class="gl" aria-hidden="true"><span>50%</span></div>
            <div
              class="gb"
              role="img"
              aria-label=${rows.map(({ candidate, share }) => candidate.name + " " + percent(share) + "% dos votos computados").join(", ")}
            >
              <i
                class="l"
                style=${`width:${rows[0].share * 100}%;background:${rows[0].color}`}
              ></i
              ><i
                class="r"
                style=${`width:${rows[1].share * 100}%;background:${rows[1].color}`}
              ></i
              ><span class="fifty"></span>
            </div>
          </div>`
        : null
    }
    ${total > 0 ? html`<p class="note">Percentuais dos votos computados das candidaturas.</p>` : null}
    ${item.candidates.length === 0 ? html`<p class="note">Candidaturas indisponíveis nesta atualização.</p>` : null}
    <dl class="official-totals kpis">
      ${Object.entries({
        "Votos válidos": item.totals.valid,
        Brancos: item.totals.blank,
        Nulos: item.totals.null,
        Comparecimento: item.totals.turnout,
        Eleitorado: item.totals.electorate,
        Abstenção: item.totals.abstention,
      }).map(
        ([label, value]) =>
          html`<div class="kpi">
            <dt class="k">${label}</dt>
            <dd class="v tn">${fmt(value)}</dd>
          </div>`,
      )}
    </dl>
    ${item.source_url ? html`<a class="upto" href=${item.source_url} target="_blank" rel="noopener noreferrer">Ver resultado no TSE ↗</a>` : null}
    <p class="note">Resultados oficiais.</p>
  </section>`;
}
