import { html, Te } from "./formatacao-e-acessibilidade-1.js";
import { renderizarCaminhoDoBrasil } from "./modelo-mapa-legenda-escala-navegacao.js";
import { Geo } from "../geography.js";
import { El } from "./mapa-interativo-1.js";
import { jl } from "./navegacao-e-patrocinio-1.js";
import { ControlesGovernadores } from "./governadores-principal-paineis.js";

export function MapaGovernadores({
  flow,
  mobile,
  tabs,
  selected,
  governor,
  status,
  estado,
  focus,
  town,
  model,
  size,
  holder,
  mapRect,
}) {
  const place =
    town != null
      ? Geo.munis[town].name + " · " + focus
      : focus
        ? Te[focus]
        : "Brasil";
  return html`<div class="gov-map-column">
    ${
      mobile
        ? html`<div class="gov-map-context">
            <div class="gov-map-title">
              <h1>Governadores</h1>
              <span>2º turno</span>
            </div>
            <p class="note gov-map-source" role="status">${status}</p>
            <details class="gov-location" key=${place}>
              <summary>
                <span>${place}</span
                ><span class="gov-location-action">Alterar local</span>
              </summary>
              <${ControlesGovernadores}
                focus=${focus}
                town=${town}
                governor=${governor}
                navigate=${estado.De}
              />
            </details>
          </div>`
        : null
    }
    <div class="gov-breadcrumb mrow">
      ${renderizarCaminhoDoBrasil({
        i: focus,
        c: town,
        onBrasil: () => estado.De("gov", null),
        onState: () => estado.De("gov", focus),
        breadcrumbLabel: "Recorte do mapa",
      })}
    </div>
    <div class="gov-stage" ref=${holder}>
      ${size.width > 40 && size.height > 40 ? html`<${El} m=${model} mode="gov" level=${focus ? "mun" : "uf"} focus=${focus} town=${town} cw=${size.width} ch=${size.height} rect=${mapRect} s=${jl(size.width, size.height, devicePixelRatio || 1)} onPick=${(uf) => estado.De("gov", uf)} onTown=${(index) => estado.De("gov", Geo.munis[index].uf, index)} small=${size.width < 700} flow=${flow} tv=${estado.g} intro=${false} />` : null}
    </div>
    ${
      mobile
        ? html`<div class="gov-map-followup">
            ${
              selected
                ? html`<a
                    class="btn"
                    href="#gov-resultado"
                    onClick=${(event) => {
                      event.preventDefault();
                      const result = document.getElementById("gov-resultado");
                      result?.scrollIntoView({
                        behavior: "instant",
                        block: "start",
                      });
                      result?.focus({ preventScroll: true });
                    }}
                    >Ver resultado oficial ↓</a
                  >`
                : null
            }
            <${AjudaMapaGovernadores} />
          </div>`
        : !tabs
          ? html`<${AjudaMapaGovernadores} />`
          : null
    }
  </div>`;
}

export function AjudaMapaGovernadores() {
  return html`<details class="gov-map-help">
    <summary>Como ler o mapa</summary>
    <p class="note">
      Cores por candidatura em cada UF. Cinza: empate, sem votos, sem dados
      disponíveis ou sem segundo turno. Selecione um estado para ver as
      candidaturas e os municípios.
    </p>
    <p class="note">
      Cada disputa tem seus próprios totais. Resultados oficiais ou histórico.
    </p>
  </details>`;
}
