import { html, Te } from "./formatacao-e-acessibilidade-1.js";
import { Geo } from "../geography.js";
import { an, hl } from "./candidatos-e-partidos-1.js";
import { Ho, mo } from "./hud-e-comunicacao-1.js";
import {
  ResultadoGovernador,
  resultadoPreservado,
  candidaturasObservadas,
  tituloResultado,
} from "./resultado-governador.js";
import { FaixaDisputa } from "./resultado-faixa-disputa.js";

export function ControlesGovernadores({ focus, town, governor, navigate }) {
  const towns = focus
    ? Geo.munis
        .map((place, index) => ({ place, index }))
        .filter(({ place }) => place.uf === focus)
        .sort((a, b) => a.place.name.localeCompare(b.place.name, "pt-BR"))
    : [];
  return html`<div class="gov-selectors">
    <label
      ><span class="lab">Estado</span
      ><select
        aria-label="Estado no mapa de governadores"
        value=${focus || ""}
        onChange=${(event) => navigate("gov", event.currentTarget.value || null)}
      >
        <option value="">Brasil</option>
        ${Object.keys(Geo.ufs)
          .sort()
          .map(
            (uf) =>
              html`<option key=${uf} value=${uf}>
                ${Te[uf]} · ${uf} ·
                ${governor.states[uf]?.inRace ? "segundo turno" : governor.catalogAvailable ? "sem segundo turno" : "aguardando dados oficiais"}
              </option>`,
          )}
      </select></label
    >${
      focus
        ? html`<label
            ><span class="lab">Município</span
            ><select
              aria-label="Município no mapa de governadores"
              value=${town == null ? "" : String(Geo.munis[town].id)}
              onChange=${(event) => navigate("gov", focus, event.currentTarget.value === "" ? null : Geo.munis.findIndex((place) => String(place.id) === event.currentTarget.value))}
            >
              <option value="">Resultado estadual</option>
              ${towns.map(({ place, index }) => html`<option key=${place.id} value=${String(place.id)}>${place.name}</option>`)}
            </select></label
          >`
        : null
    }
  </div>`;
}
export function ResumoGovernadores({ governor, navigate, focus }) {
  const states = Object.entries(governor.states).filter(
    ([, state]) => state.inRace,
  );
  return html`<section
    class="card gov-races"
    aria-label="Disputas de governadores"
  >
    <div class="lab">
      <span>Disputas de 2º turno</span
      ><span class="aside tn">${states.length} UFs</span>
    </div>
    <div class="klist">
      ${states.map(([uf, state]) => {
        const ranked = state.available
          ? [...state.candidates].sort((a, b) => b.votes - a.votes)
          : [];
        const leader =
          ranked[0]?.votes > (ranked[1]?.votes ?? 0) ? ranked[0] : null;
        const progress = state.row?.pst;
        const summary = !state.available
          ? "aguardando"
          : !state.row?.base
            ? "sem votos"
            : "empate";
        return html`<button
          type="button"
          class=${"gov-race krow" + (focus === uf ? " active on" : "")}
          aria-pressed=${focus === uf}
          aria-label=${Te[uf] + ": " + state.status}
          onClick=${() => navigate("gov", uf)}
          key=${uf}
        >
          <span class="uft" style=${"--bg:" + state.color + ";--fg:#fff"}
            >${uf}</span
          >
          <span class="kn"
            ><span class="nm">${Te[uf]}</span
            ><small>${state.status}</small></span
          >
          <span class="kv"
            >${leader && leader.share != null ? html`<${an} c=${leader} size=${24} round color=${leader.color} context=${{ office: "governor", uf }} /><b class="tn" style=${"color:" + leader.color}>${(leader.share * 100).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%</b>` : html`<small>${summary}</small>`}</span
          >
          <span class="rbar" aria-hidden="true"
            ><i
              style=${"width:" + Math.max(0, Math.min(100, (progress || 0) * 100)) + "%"}
            ></i
          ></span>
        </button>`;
      })}
    </div>
    ${!governor.catalogAvailable ? html`<p class="note">Lista oficial de disputas indisponível. Ausência de dados não é zero.</p>` : null}
  </section>`;
}

export function resultadoBuscaGovernadores(item, governor) {
  const result =
    item.t === "town"
      ? governor.municipalities[item.i]
      : governor.states[item.uf];
  const kind = item.t === "town" ? "Município" : "Estado";
  return {
    ...item,
    unavailable: false,
    sub: kind + " · " + (result?.status || "Aguardando dados oficiais"),
  };
}

export function DetalheGovernador({ selected, focus, town, navigate }) {
  const title = town != null ? Geo.munis[town].name : Te[focus];
  const change = (direction) => {
    if (town != null) {
      const places = Geo.munis
        .map((place, index) => ({ place, index }))
        .filter(({ place }) => place.uf === focus)
        .sort((a, b) => a.place.name.localeCompare(b.place.name, "pt-BR"));
      const index = places.findIndex((place) => place.index === town);
      navigate(
        "gov",
        focus,
        places[(index + direction + places.length) % places.length].index,
      );
    } else {
      const states = Object.keys(Geo.ufs).sort();
      navigate(
        "gov",
        states[
          (states.indexOf(focus) + direction + states.length) % states.length
        ],
      );
    }
  };
  const heading = html`<div class="sh">
    <${hl} uf=${focus} size=${40} />
    <div>
      <h2>${title}</h2>
      <div class="sub sub2 tn">
        <span>${focus}</span
        ><span
          >${town != null ? "Município · IBGE " + Geo.munis[town].id : "Governador · 2º turno"}</span
        >
      </div>
    </div>
    <div class="x tvhide">
      <button
        class="icon"
        aria-label=${town != null ? "Município anterior" : "Estado anterior"}
        onClick=${() => change(-1)}
      >
        <${Ho} d=${-1} />
      </button>
      <button
        class="icon"
        aria-label=${town != null ? "Próximo município" : "Próximo estado"}
        onClick=${() => change(1)}
      >
        <${Ho} d=${1} />
      </button>
      <button
        class="icon"
        aria-label=${town != null ? "Voltar ao estado" : "Fechar o estado"}
        onClick=${() => navigate("gov", town != null ? focus : null)}
      >
        <${mo} />
      </button>
    </div>
  </div>`;
  return html`<${ResultadoGovernador}
    heading=${heading}
    selected=${selected}
    focus=${focus}
    town=${town}
  />`;
}

export function FaixaGovernadores({
  selected,
  governor,
  focus,
  town,
  navigate,
}) {
  if (!selected) {
    const states = Object.entries(governor.states).filter(
      ([, state]) => state.inRace,
    );
    return html`<${FaixaDisputa}
      m=${{ pres: [], n: {} }}
      label="Governadores · Brasil"
      official
      headline="Governadores · 2º turno"
      summary=${html`<span
          >${states.length} UFs com disputa · Cada estado tem seus próprios
          totais.</span
        >
        <div class="gov-banner-races">
          ${states.map(([uf]) => html`<button class="btn" key=${uf} onClick=${() => navigate?.("gov", uf)}>${uf}</button>`)}
        </div>`}
    />`;
  }
  const known = resultadoPreservado(selected);
  const candidates = candidaturasObservadas(selected, known);
  const sections = known ? selected.result.sections : null;
  const row = selected.available
    ? selected.row
    : {
        base: 0,
        pst: sections?.total > 0 ? sections.counted / sections.total : null,
        secDone: sections?.counted,
        sections: sections?.total,
      };
  const name = town != null ? Geo.munis[town].name : Te[focus];
  const hasVotes = selected.available && row.base > 0;
  const headline = html`${name + " · "}${tituloResultado(selected, candidates, hasVotes)}`;
  const source = selected.asOf
    ? new Date(selected.asOf).toLocaleString("pt-BR", {
        timeZone: "America/Sao_Paulo",
      }) + " · Brasília"
    : "Horário da fonte indisponível";
  return html`<${FaixaDisputa}
    m=${{ pres: candidates, n: { ...row, left: null } }}
    label=${"Governadores · " + name}
    official
    headline=${headline}
    summary=${selected.status + " · Fonte: " + source}
    context=${{ office: "governor", uf: focus }}
  />`;
}
