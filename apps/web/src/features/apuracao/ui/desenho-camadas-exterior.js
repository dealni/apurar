import {
  rotuloDeResultado,
  porcentagemExterior,
} from './desenho-camadas-valores.js';
import { html } from './formatacao-e-acessibilidade-1.js';

import { _eState, Fs } from './mapa-dados-1.js';

import { Ml } from './mapa-dados-2.js';
import { So } from './hud-e-comunicacao-1.js';

export function desenharExterior(contexto) {
  const { small, linked, A, F, at, O, ft, se } = contexto;
  const Wt = Ml(F, 'pres'),
    Ut = _eState.value && O ? _eState.value.uf(F) : null,
    oe = O && Wt.ink !== '#FAFAF9';
  return html`<button
    class=${'mk box ext' + (oe ? ' dark' : '') + (linked === 'ZZ' ? ' on' : '')}
    key="ZZ"
    style=${`left:${A.x}px;top:${A.y}px;--bg:${O ? Wt.fill : Fs};--fg:${O ? Wt.ink : '#8a8f98'};--d:${ft}ms`}
    aria-label=${rotuloDeResultado('Exterior', O, Ut, at)}
    ...${se}
  >
    <${So} />${porcentagemExterior(small, O, Ut, at)}
  </button>`;
}
