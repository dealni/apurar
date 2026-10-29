import {
  html,
  yt,
  kt,
  ie,
  rt,
  nt,
  _t,
  ht,
} from "./formatacao-e-acessibilidade-1.js";
import { ss } from "./apuracao-e-votos-1.js";
import { Io, Po, an, oo, vl } from "./candidatos-e-partidos-1.js";
import { tn } from "./contagem-e-animacao-1.js";
import { Za } from "./candidatos-e-partidos-2.js";
import { kl } from "./mapa-dados-1.js";
import { Da, kr } from "./paineis-e-projecoes-1.js";
const color = (candidate, official) =>
  official ? candidate.color : nt(candidate);
const interactions = (candidate, official) => (official ? {} : Po(candidate));

/** Faixa de placar comum aos cargos; o adaptador fornece apenas observações próprias. */
export function FaixaDisputa({
  m,
  label = "Presidente",
  official = false,
  headline = null,
  summary = null,
  context,
}) {
  const candidates = m.pres.slice(0, 2).sort(ss);
  const row = m.n;
  const counted = candidates.length === 2 && (row.base ?? row.valid) > 0;
  const key = official ? label : vl(m);
  const title =
    headline ||
    Za(
      m,
      (candidate) =>
        html`<b style=${"color:" + kt(candidate)}>${yt(candidate)}</b>`,
    );
  return html`<section class="card rbanner" aria-label=${label}>
    <${FaceFaixa}
      candidate=${candidates[0]}
      official=${official}
      context=${context}
    />
    <div class="rb-mid">
      <div class="rb-top">
        <${NomeFaixa} candidate=${candidates[0]} official=${official} />
        <h2 class="rb-head" key=${key}>${title}</h2>
        <${NomeFaixa} candidate=${candidates[1]} right official=${official} />
      </div>
      ${counted || !official ? html`<${BarraFaixa} candidates=${candidates} row=${row} official=${official} counted=${counted} />` : null}
      ${summary ? html`<div class="note">${summary}</div>` : null}
      ${row.voteDestinationWarning ? html`<p class="note">Percentuais calculados sobre votos computados das candidaturas. Destinações especiais podem diferir dos votos válidos.</p>` : null}
    </div>
    <${FaceFaixa}
      candidate=${candidates[1]}
      official=${official}
      context=${context}
    />
    <${ProgressoFaixa} row=${row} />
  </section>`;
}
function FaceFaixa({ candidate, official, context }) {
  if (!candidate) return null;
  return html`<div
    class=${"rb-face" + (official ? "" : Io(candidate))}
    ...${interactions(candidate, official)}
  >
    <${an}
      c=${candidate}
      size=${72}
      color=${official ? candidate.color : null}
      context=${context}
    />
  </div>`;
}
function NomeFaixa({ candidate, right = false, official }) {
  if (!candidate) return null;
  return html`<div
    class=${"rb-nm" + (right ? " r" : "") + (official ? "" : Io(candidate))}
    ...${interactions(candidate, official)}
  >
    <b>${yt(candidate)}</b
    ><${oo} c=${candidate} color=${official ? candidate.color : null} />
  </div>`;
}
function SegmentoFaixa({ candidate, right, official, counted }) {
  const share = counted ? ie(candidate.share, 0, 1) : 0;
  const fill = color(candidate, official);
  const ink = kl(fill, "#FAFAF9") >= 3 ? "#FAFAF9" : rt(candidate.partido).on;
  const percentage =
    share >= 0.1
      ? html`<b class="tn" key="f"
          ><${tn} n=${candidate.share} fmt=${(value) => _t(value, 2)} /><small
            >%</small
          ></b
        >`
      : null;
  const votes =
    share >= 0.3
      ? html`<span class="rb-v tn" key="v"
          ><${tn} n=${candidate.votes} fmt=${ht} /> votos</span
        >`
      : null;
  return html`<i
    class=${right ? "r" : "l"}
    style=${`width:${share * 100}%;background:${fill};color:${ink}`}
    >${right ? [votes, percentage] : [percentage, votes]}</i
  >`;
}
function BarraFaixa({ candidates, row, official, counted }) {
  const [left, right] = candidates;
  const description = candidates
    .map((candidate) => `${yt(candidate)} ${_t(candidate.share, 2)}%`)
    .join(", ");
  return html`<div
    class="rb-bar"
    role="img"
    aria-label=${!counted ? "Nenhum voto apurado ainda" : description + " dos votos " + (official || row.voteDestinationWarning ? "computados das candidaturas" : "válidos") + "; a linha do meio marca 50%"}
  >
    <div class="rb-track">
      <${SegmentoFaixa}
        candidate=${left}
        official=${official}
        counted=${counted}
      />
      <${SegmentoFaixa}
        candidate=${right}
        right
        official=${official}
        counted=${counted}
      />
      ${counted && left.share + right.share > 0.995 ? html`<span class="rb-fire" style=${"left:" + ie(left.share, 0, 1) * 100 + "%"} aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></span>` : null}
    </div>
    <span class="rb-50"><em>50%</em></span>
  </div>`;
}
function ProgressoFaixa({ row }) {
  if (row.pst == null) return null;
  const progress = ie(row.pst, 0, 1);
  return html`<i class="rb-foot" aria-hidden="true"
      ><i style=${"width:" + progress * 100 + "%"}></i
    ></i>
    <span
      class="rb-apl tn"
      style=${"--p:" + progress}
      role="progressbar"
      aria-label="Seções totalizadas"
      aria-valuemin="0"
      aria-valuemax="100"
      aria-valuenow=${Math.floor(progress * 1e3) / 10}
      title=${row.sections ? ht(row.secDone) + " de " + ht(row.sections) + " seções" : null}
      ><b><${tn} n=${progress} fmt=${Da} /></b>
      totalizado${progress >= 1 || !(row.left >= 1) ? null : html`<span class="rb-left">· <${tn} n=${row.left} fmt=${kr} /></span>`}</span
    >`;
}
