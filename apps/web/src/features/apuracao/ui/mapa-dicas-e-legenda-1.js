import {
  renderDeputados,
  renderZona,
  renderBairro,
  renderLocal,
  renderTerritorio,
  criarPosicionador,
} from './modelo-mapa-legenda-dicas.js';
import { useRef, html, Xt } from './formatacao-e-acessibilidade-1.js';
import { zt, $e } from './municipios-e-distritos-2.js';
import { wt, En, $t } from './municipios-e-distritos-1.js';
export let t1, nc, sc, oc, ac, lc, ya, e1;
export function initialize() {
  t1 = ({
    tip: t,
    m: e,
    mode: n,
    town: s,
    rect: a,
    padR: r,
    cand: u = null,
    val: i = null,
  }) => {
    const c = useRef(null);
    if (!t)
      return c.current
        ? html`<div class="tip" style=${c.current.style}>
            ${c.current.inner}
          </div>`
        : html`<div class="tip"></div>`;
    const l = t,
      d = e.ufs[l.uf],
      $ = l.city != null && zt,
      f = temMunicipio($, s, l),
      m = a.x1 - r,
      h = criarPosicionador(c, l, a, m);
    if (ehTooltipDeputados(n, $, d)) {
      return renderDeputados(l, d, h);
    }
    const g = f && l.zone != null ? wt(e, l.muni) : null,
      v = g ? g.rows[l.zone] : null;
    if (v) {
      return renderZona(l, v, h, u, i);
    }
    const M = obterLocaisBairro(f, l, e),
      S = M ? $e(e, l.muni, M)[l.bairro] : null;
    if (S) {
      return renderBairro(l, S, M, h, u);
    }
    const x = f && l.local != null ? En(e, l.muni) : null,
      w = x ? $t(e, l.muni, x)[l.local] : null;
    if (x) {
      return renderLocal(l, x, w, h, u, i, e);
    }
    return renderTerritorio(l, e, n, d, $, f, u, i, h);
  };
  nc = [
    ['mun', 'Municípios'],
    ['uf', 'Estados'],
    ['votes', 'Vantagem'],
    ['apur', 'Apurado'],
    ...(Xt === 2
      ? [
          ['abst', 'Abstenção'],
          ['mud', 'Mudança'],
          ['t1r', '1º turno'],
        ]
      : [['cand', 'Candidato']]),
  ];
  sc = [
    ['mun', 'Cor'],
    ['votes', 'Vantagem'],
    ['apur', 'Apurado'],
    ...(Xt === 2
      ? [
          ['abst', 'Abstenção'],
          ['mud', 'Mudança'],
          ['t1r', '1º turno'],
        ]
      : [['cand', 'Candidato']]),
  ];
  oc = new Set(['cand', 'abst']);
  ac = () =>
    html`<svg
      class="caret"
      width="9"
      height="9"
      viewBox="0 0 10 10"
      aria-hidden="true"
    >
      <path
        d="M2 3.5 5 6.5l3-3"
        fill="none"
        stroke="currentColor"
        stroke-width="1.5"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </svg>`;
  lc = new Set(['mun', 'apur']);
  ya = {
    votes: [0, 'O tamanho da vantagem, em picos'],
    mud: [1, 'O que mudou desde o 1º turno'],
    t1r: [1, 'O resultado de 4 de outubro em cada lugar'],
    uf: [2, 'Quem lidera em cada estado'],
    cand: [2, 'Onde cada candidato vai melhor'],
    abst: [3, 'Quem não foi votar'],
  };
  e1 = () =>
    html`<svg
      class="lyr"
      width="14"
      height="14"
      viewBox="0 0 14 14"
      aria-hidden="true"
    >
      <path
        d="M7 1.6 12.6 4.5 7 7.4 1.4 4.5Z"
        fill="none"
        stroke="currentColor"
        stroke-width="1.3"
        stroke-linejoin="round"
      />
      <path
        d="M1.4 7.1 7 10 12.6 7.1M1.4 9.7 7 12.6 12.6 9.7"
        fill="none"
        stroke="currentColor"
        stroke-width="1.3"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </svg>`;
}
function obterLocaisBairro(f, l, e) {
  return f && l.bairro != null && l.local == null ? En(e, l.muni) : null;
}
function temMunicipio($, s, l) {
  return !$ && s && l.muni != null;
}
function ehTooltipDeputados(n, $, d) {
  return n === 'dep' && !$ && d;
}
