import { html } from './formatacao-e-acessibilidade-1.js';
import { Streets } from '../streets.js';

export function desenharCreditos(contexto) {
  const { le, Js, rect, small, tv, te } = contexto;
  return te
    ? html`<div
        class="credit"
        style=${`left:${rect.x1 - (small ? (Js ? 52 : 0) : 44)}px;top:${rect.y1 - (small ? 4 : 6)}px`}
      >
        ${Streets.credit.map(([A, F]) => html`<a key=${F} href=${F} target="_blank" rel="noopener">${A}</a>`)}
      </div>`
    : null;
}
