import { html } from "./formatacao-e-acessibilidade-1.js";
import { zt } from "./municipios-e-distritos-2.js";
import { Ho, mo } from "./hud-e-comunicacao-1.js";
import { ResultadoOficialPainel } from "./official-result-panel.js";

export function ControlesExterior({ country, city, navigate }) {
  const countries = [...zt.countries].sort((a, b) =>
    a.name.localeCompare(b.name, "pt-BR"),
  );
  const cities = zt.cities
    .filter((place) => !country || place.iso === country)
    .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
  return html`<div class="exterior-selectors">
    <label
      >País<select
        aria-label="País no mapa do exterior"
        value=${country || ""}
        onChange=${(event) => navigate(null, event.currentTarget.value || null)}
      >
        <option value="">Todos os países</option>
        ${countries.map((place) => html`<option key=${place.iso} value=${place.iso}>${place.name}</option>`)}
      </select></label
    >
    <label
      >Cidade<select
        aria-label="Cidade no mapa do exterior"
        value=${city == null ? "" : String(city)}
        onChange=${(event) => {
          const value = event.currentTarget.value;
          const index = value === "" ? null : Number(value);
          navigate(index, index == null ? country : zt.cities[index].iso);
        }}
      >
        <option value="">Selecione uma cidade</option>
        ${cities.map((place) => html`<option key=${place.cd} value=${place.i}>${place.name}</option>`)}
      </select></label
    >
  </div>`;
}
export function ResultadoExterior({ model, country, city, navigate }) {
  const { title, item } = recorteExterior(model, country, city);
  const change = navegacaoExterior({ country, city, navigate });
  return html`<aside
    class=${"exterior-detail stc col r" + (country || city != null ? " hasnav" : "")}
    aria-label="Resultado oficial do exterior"
  >
    <section class="card hero enter exterior-result">
      <div class="sh">
        <div>
          <h2>${title}</h2>
          <div class="sub">Presidente · 2º turno</div>
        </div>
        ${
          country || city != null
            ? html`<div class="x tvhide">
                <button
                  class="icon"
                  aria-label=${city != null ? "Cidade anterior" : "País anterior"}
                  onClick=${() => change(-1)}
                >
                  <${Ho} d=${-1} />
                </button>
                <button
                  class="icon"
                  aria-label=${city != null ? "Próxima cidade" : "Próximo país"}
                  onClick=${() => change(1)}
                >
                  <${Ho} d=${1} />
                </button>
                <button
                  class="icon"
                  aria-label=${city != null ? "Voltar ao país" : "Fechar o país"}
                  onClick=${() => navigate(null, city != null ? country : null)}
                >
                  <${mo} />
                </button>
              </div>`
            : null
        }
      </div>
      ${city != null || country ? html`<${ResultadoOficialPainel} item=${item} showHeading=${false} candidates=${model.candidates} />` : html`<p class="note">Selecione um país ou uma cidade para consultar os votos oficiais para Presidente.</p>`}
    </section>
    ${
      country && city == null
        ? html`<section class="card exterior-city-list">
            <h3>Cidades de ${title}</h3>
            ${zt.cities.filter((entry) => entry.iso === country).map((entry) => html`<button class="upto" key=${entry.cd} onClick=${() => navigate(entry.i, country)}>${entry.name}</button>`)}
          </section>`
        : null
    }
  </aside>`;
}

function navegacaoExterior({ country, city, navigate }) {
  const places =
    city == null
      ? [...zt.countries].sort((a, b) => a.name.localeCompare(b.name, "pt-BR"))
      : zt.cities
          .filter((entry) => entry.iso === country)
          .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
  return (direction) => {
    const index = places.findIndex((entry) =>
      city == null ? entry.iso === country : entry.i === city,
    );
    const next = places[(index + direction + places.length) % places.length];
    if (next) navigate(city == null ? null : next.i, next.iso);
  };
}

export function recorteExterior(model, country, city) {
  const place = city == null ? null : zt.cities[city];
  const item = place
    ? model.cities[city]
    : country
      ? model.countries[country]
      : null;
  const title =
    place?.name ||
    zt.countries.find((entry) => entry.iso === country)?.name ||
    "Exterior";
  return { title, item };
}
