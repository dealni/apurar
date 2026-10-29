import { html } from './formatacao-e-acessibilidade-1.js';
import { u1 } from './deputados-1.js';
import { Ga } from './deputados-1.js';
import { Feed } from '../feed.js';
import { Oe } from './formatacao-e-acessibilidade-1.js';
import { Yn } from './avisos-e-ticker-1.js';
import { ht } from './formatacao-e-acessibilidade-1.js';
import { Me } from './formatacao-e-acessibilidade-1.js';
export const implementar = (t, e, n, s) =>
  n
    ? html`<div class="dscroll">
        <${u1} k=${e} onBack=${() => s(!1)} />
      </div>`
    : html`<div class="dscroll">
          ${t.length ? t.slice(0, 10).map((a, r) => html`<${Ga} key=${a[0] + a[5]} x=${a} rank=${r + 1} uf=${a[5]} sq=${a[6]} />`) : html`<p class="note">${Feed.minuteOf(Date.now()) < Oe ? 'Os votos saem a partir das 17h.' : 'Aguardando os primeiros votos.'}</p>`}
        </div>
        ${
          t.length
            ? html`<button type="button" class="dmore" onClick=${() => s(!0)}>
                  Ver todos os
                  ${Yn.list ? ht(Yn.list.filter((a) => a.casa === e).length) + ' ' : ''}candidatos
                </button>
                <p class="dhint">
                  ${Me ? 'ou toque' : 'ou clique'} num estado no mapa para ver
                  só os dele
                </p>`
            : null
        }`;
