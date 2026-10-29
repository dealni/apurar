import { useState } from './formatacao-e-acessibilidade-1.js';
import { Kr } from './busca-e-preferencias-1.js';
import { Vr } from './deputados-1.js';
import { html } from './formatacao-e-acessibilidade-1.js';
import { ht } from './formatacao-e-acessibilidade-1.js';
import { Nr } from './deputados-1.js';
import { rt } from './formatacao-e-acessibilidade-1.js';
import { Wo } from './composicao-legislativa-1.js';
import { gc } from './deputados-1.js';
export const implementar = () => {
  const [t, e] = useState(!1);
  Kr();
  const n = Vr('br'),
    s = campoOuVazio(n, 'partidosE'),
    a = campoOuVazio(n, 'parcialE'),
    u = [...new Set([...Object.keys(s), ...Object.keys(a)])]
      .map((h) => [h, Math.max(s[h] || 0, a[h] || 0)])
      .filter((h) => h[1] > 0)
      .sort((h, g) => g[1] - h[1]),
    i = u.slice(0, 6),
    c = u.slice(6).reduce((h, g) => h + g[1], 0),
    l = (n && n.vagasE) || 1059,
    d = (n && n.eleitosE) || 0,
    $ = u.length > 0 && d < l,
    f = n ? n.topE || [] : [],
    _m = u.reduce((h, g) => h + g[1], 0) || 1;
  return html`<section class="card grow depc enter">
    <div class="hd">
      <h3>Assembleias Legislativas</h3>
      <span class="aside tn">${ht(l)} vagas</span>
    </div>
    <${Nr} />
    <div class="dtot">
      <b class="tn">${ht(d)}</b
      ><span
        >eleitos de ${ht(l)} nas 27
        assembleias${$ ? ', e o resto na conta parcial do TSE' : ''}</span
      >
    </div>
    ${
      u.length
        ? html`<div class="dbar" aria-hidden="true">
              ${u.map(([h, g]) => html`<i key=${h} style=${`flex-grow:${g};background:${rt(h).cor}`}></i>`)}
            </div>
            <div class="seatlegend">
              ${i.map(([h, g]) => html`<span key=${h}><i style=${'background:' + rt(h).cor}></i>${Wo(h)} <b class="tn">${g}</b></span>`)}${c ? html`<span>Outros <b class="tn">${c}</b></span>` : null}
            </div>`
        : null
    }
    <div class="sep"></div>
    <div class="lh"><h3>Mais votados para deputado estadual</h3></div>
    ${gc(f, 'e', t, e)}
  </section>`;
};

function campoOuVazio(dados, campo) {
  return (dados && dados[campo]) || {};
}
