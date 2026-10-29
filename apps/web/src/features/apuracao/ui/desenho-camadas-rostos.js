import { StateFlag } from "./state-flag.js";
import { html, yt, _t, Ne } from './formatacao-e-acessibilidade-1.js';

import { Kn, Ks } from './apuracao-e-votos-1.js';

import { Lr } from './mapa-geometria-1.js';
import { gr, an } from './candidatos-e-partidos-1.js';

export function desenharRostos(contexto) {
  const { mode, tv, linked, A, F, at, O, ft, se } = contexto;
  const Wt = Kn(F, mode),
    Ut = Lr(F, mode),
    oe = mode === 'sen' || Ut === 'run' ? Wt.slice(0, 2) : Wt.slice(0, 1),
    [nn, Ze] = gr(F, mode);
  return html`<button
    class=${'mk face' + (A.side ? ' box' : '') + (Ut === 'done' ? ' done' : '') + (linked === A.uf ? ' on' : '')}
    key=${A.uf}
    style=${`left:${A.x}px;top:${A.y}px;--bg:${nn};--fg:${A.side ? Ze : '#FAFAF9'};--d:${ft}ms`}
    aria-label=${O ? `${F.name}, ${oe.map((rn) => `${yt(rn)} ${_t(rn.share)}%`).join(', ')}` : Ks(F, mode) || Ne.has(A.uf) ? `${F.name}, sem dados` : `${F.name}, sem disputa neste turno`}
    ...${se}
  >
    ${O ? html`<span class="fs">${oe.map((rn) => html`<${an} key=${rn.id} c=${rn} size=${A.side ? (tv ? 24 : 20) : tv ? 34 : 28} round />`)}</span>` : null}<b><${StateFlag} uf=${A.uf} /></b>${O && oe.length === 1 ? html`<span class="tn">${_t(at.share, 0)}%</span>` : null}
  </button>`;
}
