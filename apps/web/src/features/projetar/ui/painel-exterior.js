import { zt } from "./municipios-e-distritos-2.js";
import { html } from "./formatacao-e-acessibilidade-1.js";
import { mo } from "./hud-e-comunicacao-1.js";
import { Z1 } from "./resultados-municipais-1.js";
import { OfficialResult, useSupplemental } from "./official-result.js";
function DetalheExterior({ city, country, onClose, onUp, onCity }) {
  const { payload, error } = useSupplemental();
  const geography = city == null ? null : zt.cities[city];
  const cityCode = geography ? String(geography.cd).padStart(5, "0") : null;
  const item = cityCode
    ? payload?.exterior.cities.find(
        (row) => String(row.tse_code).padStart(5, "0") === cityCode,
      )
    : payload?.exterior.countries.find((row) => row.country_code === country);
  const places =
    city == null && country
      ? zt.cities.filter((place) => place.iso === country)
      : [];
  return html`<section class="card grow stc ext enter">
    <div class="sh">
      <div>
        <h2>
          ${geography?.name || zt.countries.find((row) => row.iso === country)?.name || "Exterior"}
        </h2>
        <div class="sub">Presidente · resultado oficial</div>
      </div>
      <button
        class="icon tvhide"
        aria-label="Fechar detalhe do exterior"
        onClick=${onClose}
      >
        <${mo} />
      </button>
    </div>
    ${error ? html`<p class="note" role="alert">Falha de conexão no detalhamento. Último resultado preservado quando disponível.</p>` : null}
    <${OfficialResult} item=${item} />
    ${
      places.length
        ? html`<section>
            <h3>Cidades</h3>
            ${places.map((place) => html`<button class="upto" key=${place.cd} onClick=${() => onCity(place.i)}>${place.name}</button>`)}
          </section>`
        : null
    }
    <button class="upto" onClick=${onUp}>‹ Voltar ao exterior</button>
  </section>`;
}
function ExteriorOficial({ model, onCountry, onClose, spot, tv, ...props }) {
  const { payload } = useSupplemental();
  return html`<${Z1}
      m=${model}
      onCountry=${onCountry}
      onClose=${onClose}
      spot=${spot}
      tv=${tv}
      ...${props}
    />
    ${
      tv
        ? null
        : html`<section class="card ext">
            <h3>Resultados por país</h3>
            ${zt.countries.map((country) => {
              const item = payload?.exterior.countries.find(
                (row) => row.country_code === country.iso,
              );
              return html`<button
                class="upto"
                key=${country.iso}
                onClick=${() => onCountry(country.iso)}
              >
                ${country.name}${item?.as_of ? " · " + new Date(item.as_of).toLocaleTimeString("pt-BR", { timeZone: "America/Sao_Paulo" }) : " · aguardando dados"}
              </button>`;
            })}
          </section>`
    }`;
}
function ExteriorHistorico({ onClose }) {
  return html`<section class="card grow stc ext enter">
    <div class="sh">
      <h2>Exterior · histórico</h2>
      <button
        class="icon tvhide"
        aria-label="Fechar detalhe do exterior"
        onClick=${onClose}
      >
        <${mo} />
      </button>
    </div>
    <p class="note" role="status">
      Detalhamento do exterior indisponível neste recorte histórico. Consulte
      uma observação própria no arquivo oficial.
    </p>
  </section>`;
}
export function criarPainelExterior({ l, d, e, w, ot, W, $, h, m, f, replay }) {
  return (props) =>
    l === "ZZ" && zt
      ? replay
        ? html`<${ExteriorHistorico} onClose=${w} />`
        : d != null || $
          ? html`<${DetalheExterior}
              city=${d}
              country=${$}
              onClose=${w}
              onUp=${h}
              onCity=${f}
            />`
          : html`<${ExteriorOficial}
              model=${e}
              onCountry=${m}
              onClose=${w}
              spot=${ot}
              tv=${W}
              ...${props}
            />`
      : null;
}
