import { useState } from './formatacao-e-acessibilidade-1.js';
import { Kr } from './busca-e-preferencias-1.js';
import { Vr } from './deputados-1.js';
import { $c } from './composicao-legislativa-1.js';
import { Ko } from './composicao-legislativa-1.js';
import { rt } from './formatacao-e-acessibilidade-1.js';
import { qa } from './mapa-dados-1.js';
import { html } from './formatacao-e-acessibilidade-1.js';
import { Nr } from './deputados-1.js';
import { hc } from './composicao-legislativa-1.js';
import { r1 } from './composicao-legislativa-1.js';
import { Wo } from './composicao-legislativa-1.js';
import { Pe } from './formatacao-e-acessibilidade-1.js';
import { gc } from './deputados-1.js';
export const implementar = () => {
  const [t, e] = useState(!1);
  Kr();
  const n = Vr('br'),
    s = (n && n.partidos) || {},
    a = (n && n.parcial) || {},
    r = [...new Set([...Object.keys(s), ...Object.keys(a)])],
    u = $c,
    i = (E, T) => u(E) - u(T),
    c = r.filter((E) => Ko(E) === 'l').sort(i),
    l = r.filter((E) => Ko(E) === 'c').sort(i),
    d = r.filter((E) => Ko(E) === 'r').sort(i),
    $ = r.filter((E) => Ko(E) == null),
    f = n ? n.eleitos : 0,
    m = (E) => s[E] || 0,
    h = (E) => Math.max(0, (a[E] || 0) - m(E)),
    g = (E) => m(E) + h(E),
    v = [],
    M = (E, T) => {
      for (let Ct = 0; Ct < (T ? m(E) : h(E)); Ct++)
        v.push(T ? rt(E).cor : qa(rt(E).cor));
    },
    S = Math.max(0, 513 - r.reduce((E, T) => E + g(T), 0));
  (c.forEach((E) => {
    (M(E, 1), M(E, 0));
  }),
    l.forEach((E) => {
      (M(E, 1), M(E, 0));
    }),
    $.forEach((E) => {
      (M(E, 1), M(E, 0));
    }));
  for (let E = 0; E < S; E++) v.push('#2A2825');
  d.forEach((E) => {
    (M(E, 0), M(E, 1));
  });
  const x = (E, T) => E.reduce((Ct, xt) => Ct + T(xt), 0),
    w = r
      .map((E) => [E, g(E)])
      .filter((E) => E[1] > 0)
      .sort((E, T) => T[1] - E[1]),
    z = w.slice(0, 5),
    gt = w.slice(5).reduce((E, T) => E + T[1], 0),
    _ = r.some((E) => h(E) > 0),
    j = proporcaoSecoes(n),
    Y = n ? n.top || [] : [];
  return html`<section class="card grow depc enter">
    <div class="hd">
      <h3>Câmara dos Deputados</h3>
      <span class="aside">513 vagas</span>
    </div>
    <${Nr} />
    <${hc}
      fills=${v}
      done=${f}
      left=${x(c, m)}
      right=${x(d, m)}
      leftLead=${x(c, h)}
      rightLead=${x(d, h)}
      center=${x(l, m)}
      centerLead=${x(l, h)}
      nl=${x(c, g)}
      nr=${x(d, g)}
      nc=${x(l, g)}
      layout=${r1}
      total=${513}
      maj=${257}
      dot
      label="eleitos de 513"
      aria=${_ ? `Câmara: ${f} de 513 deputados eleitos; ${x(c, g)} cadeiras à esquerda, ${x(l, g)} do Centrão e ${x(d, g)} à direita` : `Câmara: ${f} de 513 deputados eleitos`}
    />
    <div class="seatlegend">
      ${z.map(([E, T]) => html`<span key=${E}><i style=${'background:' + rt(E).cor}></i>${Wo(E)} <b class="tn">${T}</b></span>`)}${gt ? html`<span>Outros <b class="tn">${gt}</b></span>` : null}${S ? html`<span><i class="hatch"></i>A definir <b class="tn">${S}</b></span>` : null}${_ ? html`<span><i class="pal"></i>claro: conta parcial do TSE</span>` : null}
    </div>
    <div class="sep"></div>
    <div class="lh">
      <h3>Mais votados do Brasil</h3>
      ${n ? html`<span class="aside tn">${Pe(j)}% das seções</span>` : null}
    </div>
    ${gc(Y, 'f', t, e)}
  </section>`;
};

function proporcaoSecoes(dados) {
  return dados && dados.secoes ? dados.totalizadas / dados.secoes : 0;
}
