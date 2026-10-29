import { br, Ei } from "./paineis-e-projecoes-1.js";
import { html, _t } from "./formatacao-e-acessibilidade-1.js";
import { os } from "./candidatos-e-partidos-1.js";
function renderizarDemaisCandidaturas(
  botaoTodos,
  candidatoDestacado,
  compacto,
  definido,
  primeirosAdicionais,
  demaisCandidatos,
  aoProximo,
  modelo,
  destaqueAdicional,
  restantes,
) {
  return !compacto && definido && aoProximo && br(modelo).length
    ? html`<${Ei} m=${modelo} onNext=${aoProximo} />${botaoTodos}`
    : compacto || !demaisCandidatos.length
      ? destaqueAdicional
      : html`<div class="others">
            ${primeirosAdicionais.map((q) => html`<${os} key=${q.id} c=${q} size=${28} cls=${q.id === candidatoDestacado ? "spot" : ""} />`)}${destaqueAdicional}
          </div>
          ${restantes.length ? html`<div class="more tn">Mais ${restantes.length} candidaturas somam ${_t(restantes.reduce((q, le) => q + le.share, 0))}%</div>` : null}${botaoTodos} `;
}
export { renderizarDemaisCandidaturas };
