import { l1 } from './composicao-legislativa-1.js';
import { rt } from './formatacao-e-acessibilidade-1.js';
import { html } from './formatacao-e-acessibilidade-1.js';
import { pc } from './composicao-legislativa-1.js';
import { Bo } from './contagem-e-animacao-1.js';
import { qa } from './mapa-dados-1.js';
export const implementar = ({
  fills: t,
  done: e,
  left: n,
  right: s,
  leftLead: a = 0,
  rightLead: r = 0,
  center: u = 0,
  centerLead: i = 0,
  layout: c = l1,
  total: l = 81,
  maj: d = 41,
  dot: $ = !1,
  label: f = 'de 54 definidas',
  aria: m = null,
  nl: h = null,
  nr: g = null,
  nc: v = null,
}) => {
  const gt = rt('PT').cor,
    _ = rt('PL').cor,
    j = '#A3967D',
    Y = l - n - s - a - r - u - i,
    E = (T, Ct, xt) => {
      const Bt = 150 + 144 * T.r * Math.cos(T.a),
        ve = 147 - 144 * T.r * Math.sin(T.a);
      return $
        ? html`<circle
            key=${xt}
            cx=${Bt.toFixed(2)}
            cy=${ve.toFixed(2)}
            r="2.75"
            fill=${Ct}
          />`
        : html`<rect
            key=${xt}
            x=${(Bt - 6.5).toFixed(2)}
            y=${(ve - 5).toFixed(2)}
            width="13"
            height="10"
            rx="2.5"
            fill=${Ct}
            transform=${`rotate(${(90 - (T.a * 180) / Math.PI).toFixed(2)} ${Bt.toFixed(2)} ${ve.toFixed(2)})`}
          />`;
    };
  return html`<div class="hemi">
    <div
      class="ideo"
      title=${'Esquerda e direita: a posição média de cada partido segundo cientistas políticos (Bolognesi, Ribeiro, Codato e Silva, Opinião Pública, 2025), cujo centro está vazio desde 2022. ' + pc + ', o núcleo que a imprensa chama assim.'}
    >
      <div class="il">
        <span>Esquerda</span
        ><b class="tn"><${Bo} v=${String(h != null ? h : n)} /></b>
      </div>
      <div class="ic">
        <span>Centrão</span
        ><b class="tn"><${Bo} v=${String(v != null ? v : u + i)} /></b>
      </div>
      <div class="ir">
        <b class="tn"><${Bo} v=${String(g != null ? g : s)} /></b
        ><span>Direita</span>
      </div>
      <div class="ibar">
        <i style=${`flex-grow:${n};background:${gt}`}></i
        ><i style=${`flex-grow:${a};background:${qa(gt)}`}></i
        ><i style=${`flex-grow:${u};background:${j}`}></i
        ><i style=${`flex-grow:${i};background:${qa(j)}`}></i
        ><i style=${`flex-grow:${Y};background:#2A2825`}></i
        ><i style=${`flex-grow:${r};background:${qa(_)}`}></i
        ><i style=${`flex-grow:${s};background:${_}`}></i><em></em>
      </div>
      <div class="imaj">maioria ${d} · ${pc}</div>
    </div>
    <svg
      viewBox=${'0 0 300 150'}
      role="img"
      aria-label=${m || `Senado: ${n} cadeiras à esquerda e ${s} à direita; ${e} de 54 vagas de 2026 definidas`}
    >
      ${c.map((T, Ct) => E(T, t[Ct] || '#2A2825', Ct))}
    </svg>
    <div class="hemic">
      <div class="big"><${Bo} v=${String(e)} /></div>
      <div class="k">${f}</div>
    </div>
  </div>`;
};
