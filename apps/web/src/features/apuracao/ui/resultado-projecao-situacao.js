import { html, pt, hn } from './formatacao-e-acessibilidade-1.js';
import { qoState } from './eventos-e-progresso-1.js';
function renderizarSituacaoDefinida(definido, lider, reduzido, apuracao) {
  return definido && !reduzido
    ? html`<span
        class="chip done"
        title=${apuracao.conta ? 'A vantagem já é maior que todos os votos que faltam apurar' : null}
        ><i></i
        >${apuracao.status === 'eleito' ? (pt(lider) ? 'Eleita' : 'Eleito') : '2º turno'}${qoState.value && qoState.value.t != null ? ' · definido às ' + hn(qoState.value.t) : ''}</span
      >`
    : null;
}
export { renderizarSituacaoDefinida };
