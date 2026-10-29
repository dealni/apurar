import {
  html,
  re,
  _t,
  nt,
  yt,
  H,
  pt,
} from './formatacao-e-acessibilidade-1.js';
import { Zl } from './projecoes-graficos-2.js';
function renderizarProjecaoNacional(
  lideres,
  projecao,
  curto,
  modelo,
  mostrarPrevisao,
) {
  return curto
    ? projecao
      ? html`<div class="ns">
          <div class="nsh"><h3>Projeção</h3></div>
          <p
            class=${'then pj tn' + (projecao.call != null ? ' call' : '')}
            title=${re + ' Faixa de 98%: ± ' + _t(projecao.band) + ' pontos.'}
          >
            ${lideres.map((T) => html`<span key=${'p' + T.id}><i style=${'background:' + nt(T)}></i>${yt(T)} ${_t(projecao.by[+T.n])}%</span>`)}${projecao.call != null ? html`<b class="pjcall">${yt(H(projecao.call))} ${pt(H(projecao.call)) ? 'deve ser eleita' : 'deve ser eleito'}</b>` : null}
          </p>
        </div>`
      : null
    : html`<${Zl} m=${modelo} own fore=${mostrarPrevisao} />`;
}
export { renderizarProjecaoNacional };
