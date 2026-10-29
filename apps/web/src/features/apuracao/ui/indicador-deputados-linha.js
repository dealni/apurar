import { html } from './formatacao-e-acessibilidade-1.js';
import { vc } from './deputados-1.js';
import { rt } from './formatacao-e-acessibilidade-1.js';
import { Wo } from './composicao-legislativa-1.js';
import { ht } from './formatacao-e-acessibilidade-1.js';
export const implementar = ({
  x: t,
  rank: e,
  uf: n = null,
  sq: s = null,
  fu: a = null,
  cls: r = '',
}) =>
  html`<div class=${'drow' + (r ? ' ' + r : '')}>
    <span class="dr tn">${e}</span
    ><${vc} uf=${a || n} sq=${s} name=${t[1]} sg=${t[2]} /><span class="dn"
      ><b>${t[1]}</b
      ><small style=${'color:' + rt(t[2]).txt}
        >${Wo(t[2])}${n ? ' · ' + n : ''}</small
      ></span
    ><span class="dv tn"
      >${ht(t[3])}${t[4] ? html`<em>eleito</em>` : null}</span
    >
  </div>`;
