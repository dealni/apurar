import { html } from "./formatacao-e-acessibilidade-1.js";
import { prepararContexto, prepararLocais } from "./modelo-mapa-legenda-escala-contexto.js";
import { contarEscala } from "./modelo-mapa-legenda-escala-contagem.js";
import { prepararConteudo } from "./modelo-mapa-legenda-escala-conteudo.js";

export function LegendaCompactaMapa({ m, mode, focus, town, country }) {
  const contexto = prepararContexto({
    m, mode, focus, town, country,
    level: focus ? "mun" : "uf",
    rect: { x0: 0, y0: 0, x1: 400, y1: 0 },
  });
  const { Qo } = prepararConteudo(contarEscala(prepararLocais(contexto)));
  if (!Qo) return null;
  return html`<aside class="compact-map-legend" aria-label="Como ler o mapa">
    <p>${focus === "ZZ" ? "Mapa do exterior" : focus ? "Liderança por município" : "Liderança por estado"}</p>
    ${Qo}
  </aside>`;
}
