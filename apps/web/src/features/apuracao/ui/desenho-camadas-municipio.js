import { html, U } from './formatacao-e-acessibilidade-1.js';

import { zt } from './municipios-e-distritos-2.js';
import { Geo } from '../geography.js';

export function desenharMunicipio(contexto) {
  const { on, ls, focus, town, small } = contexto;
  return town != null && on && !ls && !small && !(focus !== 'ZZ' && U(town))
    ? (() => {
        const A = focus === 'ZZ' && zt ? zt.cities[town] : Geo.munis[town];
        return html`<span
          class="townpill"
          style=${`left:${on.ox + A.c[0] * on.k}px;top:${on.oy + A.c[1] * on.k}px`}
          >${A.name}</span
        >`;
      })()
    : null;
}
