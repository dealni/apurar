import { useState } from './formatacao-e-acessibilidade-1.js';
import { Kr } from './busca-e-preferencias-1.js';
import { html } from './formatacao-e-acessibilidade-1.js';
import { X } from './formatacao-e-acessibilidade-1.js';
import { Sim } from '../simulation.js';
import { Ga } from './deputados-1.js';
import { ht } from './formatacao-e-acessibilidade-1.js';
export const implementar = ({ k: t, onBack: e }) => {
  const [n, s] = useState(''),
    [a, r] = useState(100),
    u = Kr();
  if (!u) return html`<p class="note">Carregando a lista de candidatos…</p>`;
  const i = u
      .filter(($) => $.casa === t)
      .sort(($, f) => f.votos - $.votos || $.label.localeCompare(f.label)),
    c = X(n.trim()),
    l =
      c.length === 2 && Sim.UFS.includes(c.toUpperCase())
        ? c.toUpperCase()
        : null,
    d = i
      .map(($, f) => [$, f])
      .filter(
        ([$]) =>
          !c ||
          (l ? $.uf === l : $.key.includes(c) || String($.n).startsWith(c)),
      );
  return html`<div class="dall">
    <div class="dfilt">
      <input
        type="search"
        value=${n}
        placeholder="Nome, número ou UF"
        aria-label="Filtrar candidatos por nome, número ou estado"
        onInput=${($) => {
          (s($.target.value), r(100));
        }}
      /><button type="button" class="dless" onClick=${e}>Só os 10</button>
    </div>
    ${d.slice(0, a).map(([$, f], m) => html`<${Ga} key=${$.uf + $.n} x=${[$.n, $.label, $.sg, $.votos, $.eleito]} rank=${l ? m + 1 : f + 1} uf=${$.uf} sq=${$.sq} />`)}
    ${d.length > a ? html`<button type="button" class="dmore" onClick=${() => r(($) => $ + 100)}>Mostrar mais ${Math.min(100, d.length - a)} · faltam ${ht(d.length - a)}</button>` : null}
    ${d.length ? null : html`<p class="note">Ninguém com “${n.trim()}”.</p>`}
  </div>`;
};
