import { html } from './formatacao-e-acessibilidade-1.js';

export function desenharZoom(contexto) {
  const { Zn, Gs, Ta, nl, Ge, Js, rect, small, tv } = contexto;
  return tv
    ? null
    : html`<div
        class=${'zoomctl' + (small ? ' touch' : '')}
        style=${`left:${rect.x1}px;top:${rect.y1 - (small ? 0 : 4)}px`}
        role="group"
        aria-label="Zoom do mapa"
      >
        <button
                  aria-label="Aproximar o mapa"
                  title="Aproximar (+)"
                  disabled=${Ge.k >= Zn * 0.998}
                  onClick=${() => Ta(1.6)}
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 14 14"
                    aria-hidden="true"
                  >
                    <path
                      d="M7 2.5v9M2.5 7h9"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="1.6"
                      stroke-linecap="round"
                    />
                  </svg>
                </button>
                <button
                  aria-label="Afastar o mapa"
                  title="Afastar (−)"
                  disabled=${Ge.k <= Gs * 1.002}
                  onClick=${() => Ta(1 / 1.6)}
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 14 14"
                    aria-hidden="true"
                  >
                    <path
                      d="M2.5 7h9"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="1.6"
                      stroke-linecap="round"
                    />
                  </svg>
                </button>
        ${
          Js
            ? html`<button
                class="rs"
                aria-label="Voltar ao enquadramento"
                title="Voltar ao enquadramento (0)"
                onClick=${nl}
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 14 14"
                  aria-hidden="true"
                >
                  <path
                    d="M5.5 2v3.5H2M12 5.5H8.5V2M8.5 12V8.5H12M2 8.5h3.5V12"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="1.5"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                </svg>
              </button>`
            : null
        }
      </div>`;
}
