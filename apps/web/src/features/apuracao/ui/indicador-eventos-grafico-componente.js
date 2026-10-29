import {
  html,
  lt,
  ge,
  useRef,
  nt,
  kt,
  _t,
  Wn,
  hn,
} from './formatacao-e-acessibilidade-1.js';
import { al } from './apuracao-e-votos-1.js';
import { ma } from './eventos-e-progresso-1.js';
import { qn } from './contagem-e-animacao-1.js';
import {
  prepararGrafico,
  criarRotulos,
} from './indicador-eventos-grafico-modelo.js';
import {
  renderizarGrade,
  renderizarProjecao,
} from './indicador-eventos-grafico-camadas.js';

function origemDaAnimacao(Ct, t, T, s) {
  if (!Ct.current) Ct.current = { t: t.t, from: t.t };
  else if (Ct.current.t !== t.t) Ct.current = { t: t.t, from: Ct.current.t };
  return T && !s ? Ct.current.from : Infinity;
}

export function GraficoApuracao({
  m: t,
  W: e,
  H: n,
  draw: s = false,
  labels: a = false,
}) {
  const { r, i, c, $, f, m, h, g, v, M, z, gt, _, j } = prepararGrafico(
    t,
    e,
    n,
    a,
  );
  const Y = ma.filter((D) => D.t <= t.t).pop();
  const E = f[f.length - 1];
  const T = qn.on && !ge;
  const Ct = useRef(null);
  const xt = origemDaAnimacao(Ct, t, T, s);
  const Bt = m.filter((D) => D.t <= xt);
  const ve = m.filter((D) => D.t >= xt);
  const Ke = Y && $.includes(Y.to) && $.includes(Y.from);
  const we = Ke && T && t.t - Y.t <= 1;
  const Ae = criarRotulos(a, E, $, v, M, z, gt);
  return html`<svg
    class=${s && T ? 'drawall' : null}
    width=${e}
    height=${n}
    viewBox=${`0 0 ${e} ${n}`}
    style=${'--dd:' + (s ? 1400 : 600) + 'ms'}
    role="img"
    aria-label=${E ? `Evolução até ${hn(E.t)}; ${_t(E.pst)}% das seções. ${$.map((candidate) => `${Wn(lt[candidate])}: ${_t(E.sh[candidate])}% dos votos válidos`).join(". ")}. As curvas mostram os votos observados ao longo da apuração.` : "Evolução da apuração: aguardando observações suficientes."}
  >
    ${renderizarGrade({ r, j, i, e, c, gt, z, n })}
    ${g.length ? $.map((D) => html`<path key=${'w' + D} class="was22" d=${g.map((q, le) => `${le ? 'L' : 'M'}${z(q[0]).toFixed(1)},${gt(al(lt[D], q)).toFixed(1)}`).join('')} fill="none" stroke=${nt(lt[D])} stroke-width="1.4" stroke-dasharray="5 4" opacity=".4" />`) : null}
    ${$.map((D) => html`<path key=${'e' + D} d=${_(D, h)} fill="none" stroke=${nt(lt[D])} stroke-width="1.5" stroke-dasharray="2 4" stroke-linecap="round" opacity=".45" />`)}
    ${$.map((D) => html`<path key=${'m' + D} class=${s && T ? 'seg' : null} pathLength=${s ? 1 : null} d=${_(D, Bt)} fill="none" stroke=${nt(lt[D])} stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round" />`)}
    ${ve.length > 1 ? $.map((D) => html`<path key=${'t' + D + '-' + t.t} class="seg" pathLength="1" d=${_(D, ve)} fill="none" stroke=${nt(lt[D])} stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round" />`) : null}
    ${renderizarProjecao({ v, E, $, M, z, gt })}
    ${E ? $.map((D) => html`<circle key=${'c' + D} class="end" style=${`cx:${z(E.pst).toFixed(1)}px;cy:${gt(E.sh[D]).toFixed(1)}px`} r="3.5" fill=${nt(lt[D])} />`) : null}
    ${Ae.map((D) => html`<text key=${'tag' + D.k} class="endl" x=${D.x.toFixed(1)} y=${(D.y + 4).toFixed(1)} style=${'fill:' + kt(D.c)}>${_t(D.v)}%</text>`)}
    ${Ke ? html`<g class=${'cross' + (we ? ' fresh' : '')} key=${'x' + Y.t}>${[0, 1].map((D) => html`<circle key=${D} class="rg" cx=${z(Y.xpst)} cy=${gt(Y.xsh)} r="5" />`)}<circle class="cc" cx=${z(Y.xpst)} cy=${gt(Y.xsh)} r="5" fill="var(--panel)" stroke="var(--fg)" stroke-width="1.5" /></g>` : null}
  </svg>`;
}
