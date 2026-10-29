import { StateFlag } from "./state-flag.js";
import { html, _t } from "./formatacao-e-acessibilidade-1.js";
import { Geo } from "../geography.js";
import { Fs, Pi } from "./mapa-dados-1.js";
import { Al } from "./mapa-geometria-1.js";
import { Sim } from "../simulation.js";
import { resultStatus } from "../../../integration/supplemental-data.ts";

const neutral = "#aeb8bd";
const governorFill = (color) => (!color || color === neutral ? Fs : color);
export function paintGovernorMap(ctx, camera, model, focus, town) {
  ctx.save();
  ctx.translate(camera.ox, camera.oy);
  ctx.scale(camera.k, camera.k);
  for (const uf of Sim.UFS) {
    ctx.globalAlpha = focus && uf !== focus ? 0.13 : 1;
    ctx.fillStyle = governorFill(model.states[uf]?.color);
    ctx.fill(Al(uf));
  }
  if (focus && Geo.ufs[focus])
    paintGovernorMunicipalities(ctx, camera, model, focus, town);
  ctx.globalAlpha = 1;
  ctx.strokeStyle = "rgba(8,9,10,.65)";
  ctx.lineWidth = 1.2 / camera.k;
  ctx.stroke(Geo.lines.uf);
  ctx.strokeStyle = "rgba(245,247,250,.45)";
  ctx.lineWidth = 0.8 / camera.k;
  ctx.stroke(Geo.lines.edge);
  if (town != null && Geo.munis[town]) {
    ctx.strokeStyle = "#f5f7fa";
    ctx.lineWidth = 2 / camera.k;
    ctx.stroke(Geo.munis[town].path);
  }
  ctx.restore();
}
function paintGovernorMunicipalities(ctx, camera, model, focus, town) {
  for (const index of Geo.ufs[focus].munis) {
    ctx.globalAlpha = town != null && index !== town ? 0.38 : 1;
    ctx.fillStyle = governorFill(model.municipalities[index]?.color);
    ctx.fill(Geo.munis[index].path);
  }
  ctx.globalAlpha = 1;
  ctx.strokeStyle = "rgba(8,9,10,.45)";
  ctx.lineWidth = 0.65 / camera.k;
  ctx.stroke(Geo.ufs[focus].muniLines);
}
export function governorMarker(context) {
  const { modelo, A, linked, ft, se, small } = context;
  if (A.ext) return null;
  const state = modelo.governor.states[A.uf];
  const name = state?.result?.name || modelo.ufs[A.uf]?.name || A.uf;
  const leader = state?.available
    ? [...state.candidates].sort((a, b) => b.votes - a.votes)[0]
    : null;
  const hasVotes = leader?.votes > 0 && state.color !== neutral;
  const label = hasVotes
    ? `${name}, ${leader.name}, ${_t(leader.share, 2)}% dos votos computados`
    : `${name}, ${state?.status || "Resultado indisponível"}`;
  return html`<button
    class=${"mk " + (A.side ? "box" : "lbl") + (linked === A.uf ? " on" : "")}
    key=${A.uf}
    style=${`left:${A.x}px;top:${A.y}px;--bg:${governorFill(state?.color)};--fg:${!state?.color || state.color === neutral ? Pi : "#08090a"};--d:${ft}ms`}
    aria-label=${label}
    ...${se}
  >
    <b><${StateFlag} uf=${A.uf} /></b
    >${!small && hasVotes ? html`<span class="tn">${_t(leader.share, 0)}%</span>` : null}
  </button>`;
}
function completeResult(item) {
  return (
    !!item &&
    item.status === "available" &&
    !item.stale &&
    !!item.as_of &&
    item.sections.counted > 0 &&
    item.candidates.length === 2 &&
    new Set(item.candidates.map((c) => c.id)).size === 2 &&
    item.candidates.every((c) => c.votes !== null) &&
    !(item.coverage && item.coverage.available < item.coverage.total)
  );
}
export function exteriorCityColor(model, index) {
  const item = model.exterior.cities[index];
  if (!completeResult(item) || model.exterior.catalogError) return neutral;
  const ranked = [...item.candidates].sort((a, b) => b.votes - a.votes);
  if (!ranked[0].votes || ranked[0].votes === ranked[1].votes) return neutral;
  return (
    model.exterior.candidates.find((candidate) => candidate.id === ranked[0].id)
      ?.color || neutral
  );
}
export function officialMapTip(item, name, status, side, position, uf = null) {
  const count = item?.sections.counted;
  const total = item?.sections.total;
  const sum = completeResult(item)
    ? item.candidates.reduce((n, c) => n + c.votes, 0)
    : 0;
  const time = item?.as_of
    ? new Date(item.as_of).toLocaleString("pt-BR", {
        timeZone: "America/Sao_Paulo",
      }) + " · Brasília"
    : "Horário da fonte indisponível";
  return position(
    side,
    5,
    html`<div class="th">
        ${uf ? html`<${StateFlag} uf=${uf} />` : null}
        <div>
          <span class="nm">${name}</span
          ><small>${item ? resultStatus(item) : status}</small>
        </div>
      </div>
      <p class="note">${time}</p>
      ${
        item
          ? html`<p class="note">
                ${count == null ? "Indisponível" : count.toLocaleString("pt-BR")}
                de
                ${total == null ? "indisponível" : total.toLocaleString("pt-BR")}
                seções totalizadas
              </p>
              ${item.candidates.map((candidate) => html`<p class="note" key=${candidate.id}>${candidate.name}: ${candidate.votes == null ? "votos indisponíveis" : candidate.votes.toLocaleString("pt-BR") + " votos"}${sum ? " · " + _t(candidate.votes / sum, 2) + "% dos votos computados" : ""}</p>`)}${item.coverage && item.coverage.available < item.coverage.total ? html`<p class="note">Cobertura parcial: ${item.coverage.available} de ${item.coverage.total} cidades.</p>` : null}`
          : null
      }`,
  );
}
