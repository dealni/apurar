import { html } from './formatacao-e-acessibilidade-1.js';
import { Ms } from './deputados-1.js';
import { i1 } from './deputados-1.js';
export const implementar = () =>
  html`<div class="seg2 dhouse" role="group" aria-label="Deputados">
    ${[
      ['f', 'Federais'],
      ['e', 'Estaduais'],
    ].map(
      ([t, e]) =>
        html`<button
          key=${t}
          type="button"
          aria-pressed=${Ms.k === t ? 'true' : 'false'}
          onClick=${() => i1(t)}
        >
          ${e}
        </button>`,
    )}
  </div>`;
