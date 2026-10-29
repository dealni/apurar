import {
  html,
  re,
  _t,
  nt,
  yt,
  H,
  pt,
} from './formatacao-e-acessibilidade-1.js';
function renderizarResumoDaProjecao(projecao, lideres) {
  return projecao
    ? html`<p
        class=${'then pj tn' + (projecao.call != null ? ' call' : '')}
        title=${re + ' Faixa de 98%: ± ' + _t(projecao.band) + ' pontos.'}
      >
        <span>Projeção</span
        >${lideres.map((q) => html`<span key=${'p' + q.id}><i style=${'background:' + nt(q)}></i>${yt(q)} ${_t(projecao.by[+q.n])}%</span>`)}${projecao.call != null ? html`<b class="pjcall">${yt(H(projecao.call))} ${pt(H(projecao.call)) ? 'deve ser eleita' : 'deve ser eleito'}</b>` : null}
      </p>`
    : null;
}
export { renderizarResumoDaProjecao };
