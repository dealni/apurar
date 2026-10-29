import { zt } from './municipios-e-distritos-2.js';
import { html } from './formatacao-e-acessibilidade-1.js';
import { V1, D1 } from './resultados-municipais-2.js';
import { Z1 } from './resultados-municipais-1.js';
export function criarPainelExterior({ l, d, e, g, w, ot, W, $, f, h, m }) {
  return (Ce) =>
    l === 'ZZ' && zt
      ? d != null
        ? html`<${V1}
            m=${e}
            i=${d}
            onUp=${g}
            onClose=${w}
            spot=${ot}
            tv=${W}
            ...${Ce}
          />`
        : $
          ? html`<${D1}
              m=${e}
              iso=${$}
              onCity=${f}
              onUp=${h}
              onClose=${w}
              ...${Ce}
            />`
          : html`<${Z1}
              m=${e}
              onCountry=${m}
              onClose=${w}
              spot=${ot}
              tv=${W}
              ...${Ce}
            />`
      : null;
}
