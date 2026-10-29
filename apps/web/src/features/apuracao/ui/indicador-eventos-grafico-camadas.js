import { html, lt, nt } from './formatacao-e-acessibilidade-1.js';

export function renderizarGrade({ r, j, i, e, c, gt, z, n }) {
  return html`
    ${r ? j.map((D) => html`<g key=${D}><line x1=${i} x2=${e - c} y1=${gt(D)} y2=${gt(D)} stroke="rgba(250,250,249,.07)" /><text x=${i - 6} y=${gt(D) + 3} text-anchor="end">${Math.round(D * 100)}%</text></g>`) : null}
    ${r ? [0, 0.5, 1].map((D) => html`<text key=${D} x=${z(D)} y=${n - 3} text-anchor=${D === 0 ? 'start' : D === 1 ? 'end' : 'middle'}>${D === 0 ? '0% das seções' : Math.round(D * 100) + '%'}</text>`) : null}
  `;
}

export function renderizarProjecao({ v, E, $, M, z, gt }) {
  return html`
    ${
      v && E
        ? $.map((D) => {
            const q = M(D),
              le = nt(lt[D]),
              be = z(1) - 4;
            return html`<g key=${'pj' + D} class="pj"
              ><line
                x1=${z(E.pst).toFixed(1)}
                y1=${gt(E.sh[D]).toFixed(1)}
                x2=${be}
                y2=${gt(q).toFixed(1)}
                stroke=${le}
                stroke-width="1.4"
                stroke-dasharray="2 3"
                opacity=".55" /><rect
                x=${be - 3}
                y=${gt(q + v.band).toFixed(1)}
                width="6"
                height=${Math.max(2, gt(q - v.band) - gt(q + v.band)).toFixed(1)}
                rx="3"
                fill=${le}
                opacity=".3" /><circle
                cx=${be}
                cy=${gt(q).toFixed(1)}
                r="3"
                fill="var(--panel)"
                stroke=${le}
                stroke-width="1.6"
            /></g>`;
          })
        : null
    }
  `;
}
