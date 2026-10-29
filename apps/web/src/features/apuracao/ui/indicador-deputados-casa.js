import { Ms } from './deputados-1.js';
import { html } from './formatacao-e-acessibilidade-1.js';
import { d1 } from './deputados-1.js';
import { f1 } from './deputados-1.js';
export const implementar = () =>
  Ms.k === 'e' ? html`<${d1} />` : html`<${f1} />`;
