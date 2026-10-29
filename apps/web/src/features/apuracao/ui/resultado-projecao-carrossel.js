import { html } from './formatacao-e-acessibilidade-1.js';
function renderizarCarrosselDeProjecoes(
  paineis,
  integrado,
  indiceAtivo,
  aoRolar,
  navegar,
  referencia,
) {
  return html`<${integrado ? 'div' : 'section'}
    class=${integrado ? 'ns ns-pj chart fc' : 'card chart fc enter'}
    aria-roledescription="carrossel"
    aria-label=${integrado ? 'Projeção' : '2º turno'}
  >
    <div class=${integrado ? 'nsh' : 'hd'}>
      <h3>${integrado ? 'Projeção' : paineis[indiceAtivo].title}</h3>
      ${
        paineis.length > 1
          ? html`<div class="fcnav">
              <button
                class="fcarr"
                type="button"
                aria-label="Anterior"
                onClick=${() => navegar(indiceAtivo - 1)}
              >
                ‹
              </button>
              ${paineis.map((v, M) => html`<button key=${v.id} type="button" class=${'fcdot' + (M === indiceAtivo ? ' on' : '')} aria-label=${v.title} aria-current=${M === indiceAtivo ? 'true' : null} onClick=${() => navegar(M)}></button>`)}
              <button
                class="fcarr"
                type="button"
                aria-label="Próximo"
                onClick=${() => navegar(indiceAtivo + 1)}
              >
                ›
              </button>
            </div>`
          : null
      }
    </div>
    <div class="fcbox" ref=${referencia} onScroll=${aoRolar}>
      ${paineis.map(
        (v) =>
          html`<div class="fcp" key=${v.id} role="group" aria-label=${v.title}>
            ${v.top ? html`<div class="fct">${v.top}</div>` : null}
            <div class=${'fcv' + (v.foot ? '' : ' nf')}>${v.vis}</div>
            ${v.foot || null}
          </div>`,
      )}
    </div>
  <//>`;
}
export { renderizarCarrosselDeProjecoes };
