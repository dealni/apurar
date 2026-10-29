import { useState } from './formatacao-e-acessibilidade-1.js';
import { Feed } from '../feed.js';
import { html } from './formatacao-e-acessibilidade-1.js';
import { rt } from './formatacao-e-acessibilidade-1.js';
import { c1 } from './deputados-1.js';
export const implementar = ({ uf: t, sq: e, name: n, sg: s }) => {
  const [a, r] = useState(null),
    u = (Feed.CFG.feed && Feed.CFG.feed[0]) || '/feed/',
    i = t && e ? `${u}fotos/${t.toLowerCase()}/${e}.jpeg` : null;
  return html`<span class="dph" style=${'--pc:' + rt(s).cor}
    >${i && a !== i ? html`<img src=${i} alt="" loading="lazy" decoding="async" onError=${() => r(i)} />` : html`<span class="ini">${c1(n)}</span>`}</span
  >`;
};
