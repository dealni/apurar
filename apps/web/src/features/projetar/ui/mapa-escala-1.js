import {
  prepararContexto,
  prepararLocais,
} from "./modelo-mapa-legenda-escala-contexto.js";
import { contarEscala } from "./modelo-mapa-legenda-escala-contagem.js";
import { prepararConteudo } from "./modelo-mapa-legenda-escala-conteudo.js";
import { renderizarEscala } from "./modelo-mapa-legenda-escala-navegacao.js";
export let ic;
export function initialize() {
  ic = (props) =>
    renderizarEscala(
      prepararConteudo(contarEscala(prepararLocais(prepararContexto(props)))),
    );
}
