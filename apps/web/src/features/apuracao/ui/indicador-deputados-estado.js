import { Vr } from './deputados-1.js';
import { Te } from './formatacao-e-acessibilidade-1.js';
import { useState } from './formatacao-e-acessibilidade-1.js';
import { useEffect } from './formatacao-e-acessibilidade-1.js';
import { Yn } from './avisos-e-ticker-1.js';
import { Aa } from './busca-e-preferencias-1.js';
import { html } from './formatacao-e-acessibilidade-1.js';
import { X } from './formatacao-e-acessibilidade-1.js';
import { Ms } from './deputados-1.js';
import { Ga } from './deputados-1.js';
import { ht } from './formatacao-e-acessibilidade-1.js';
import { ct } from './formatacao-e-acessibilidade-1.js';
import { Pe } from './formatacao-e-acessibilidade-1.js';
import { rt } from './formatacao-e-acessibilidade-1.js';
import { Wo } from './composicao-legislativa-1.js';
import { Feed } from '../feed.js';
import { Oe } from './formatacao-e-acessibilidade-1.js';
import { hl } from './candidatos-e-partidos-1.js';
import { Nr } from './deputados-1.js';
import { Il } from './deputados-1.js';
export const implementar = ({ uf: t, onClose: e }) => {
  const n = Vr(t),
    s = {
      name: Te[t],
    },
    [a, r] = useState(null),
    [u, i] = useState(''),
    [c, l] = useState(100),
    [, d] = useState(0);
  (useEffect(() => {
    const g = () => d((v) => v + 1);
    return (
      Yn.subs.add(g),
      Aa(),
      () => {
        Yn.subs.delete(g);
      }
    );
  }, []),
    useEffect(() => {
      (r(null), i(''), l(100));
    }, [t]));
  const $ = (g) =>
      (Yn.list || [])
        .filter((v) => v.uf === t && v.casa === g)
        .sort((v, M) => M.votos - v.votos || v.label.localeCompare(M.label)),
    f = (g) => {
      if (!Yn.list)
        return html`<p class="note">Carregando a lista de candidatos…</p>`;
      const v = $(g),
        M = X(u.trim()),
        S = M
          ? v
              .map((w, z) => [w, z])
              .filter(([w]) => w.key.includes(M) || String(w.n).startsWith(M))
          : v.map((w, z) => [w, z]),
        x =
          Ms.spot && Ms.spot.uf === t && Ms.spot.casa === g ? Ms.spot.n : null;
      return html`<div class="dall">
        <div class="dfilt">
          <input
            type="search"
            value=${u}
            placeholder="Nome ou número"
            aria-label="Filtrar candidatos por nome ou número"
            onInput=${(w) => {
              (i(w.target.value), l(100));
            }}
          /><button
            type="button"
            class="dless"
            onClick=${() => {
              (r(null), i(''));
            }}
          >
            Só os 10
          </button>
        </div>
        ${S.slice(0, c).map(([w, z]) => html`<${Ga} key=${w.n} x=${[w.n, w.label, w.sg, w.votos, w.eleito]} rank=${z + 1} fu=${t} sq=${w.sq} cls=${w.n === x ? 'spot' : ''} />`)}
        ${S.length > c ? html`<button type="button" class="dmore" onClick=${() => l((w) => w + 100)}>Mostrar mais ${Math.min(100, S.length - c)} · faltam ${ht(S.length - c)}</button>` : null}
        ${S.length ? null : html`<p class="note">Ninguém com “${u.trim()}” ${g === 'f' ? 'para deputado federal' : 'para deputado estadual'} ${ct(t)}.</p>`}
      </div>`;
    },
    m = (g, v) => {
      const M = Ms.spot;
      if (
        !M ||
        M.uf !== t ||
        M.casa !== g ||
        (v.top || []).slice(0, 10).some((z) => z[0] === M.n)
      )
        return null;
      const S = (Yn.list || [])
          .filter((z) => z.uf === t && z.casa === g)
          .sort((z, gt) => gt.votos - z.votos),
        x = S.findIndex((z) => z.n === M.n),
        w = S[x];
      return w
        ? html`<${Ga}
            key=${'s' + w.n}
            x=${[w.n, w.label, w.sg, w.votos, w.eleito]}
            rank=${x + 1}
            fu=${t}
            sq=${w.sq}
            cls="spot"
          />`
        : null;
    },
    h = (g, v) => {
      const M = n && n[g];
      if (!M) return null;
      const S = M.secoes ? M.totalizadas / M.secoes : 0,
        x = M.cadeiras || {},
        w = M.parcial || {},
        z = M.eleitos < M.vagas && Object.keys(w).length > 0,
        gt = [...new Set([...Object.keys(x), ...Object.keys(w)])]
          .map((_) => [_, Math.max(x[_] || 0, w[_] || 0)])
          .filter((_) => _[1] > 0)
          .sort((_, j) => j[1] - _[1]);
      return html`<section class="dsec" key=${g}>
        <div class="lab">
          <span>${v} · ${M.vagas} vagas</span
          ><span class="aside tn">${Pe(S)}%</span>
        </div>
        ${gt.length ? html`<div class="dseats">${gt.map(([_, j]) => html`<span key=${_}><i style=${'background:' + rt(_).cor}></i>${Wo(_)} <b class="tn">${j}</b></span>`)}<span class="k">${M.eleitos} de ${M.vagas} eleitos${z ? ' · conta parcial do TSE' : ''}</span></div>` : null}
        ${
          a === g
            ? f(g)
            : html`${m(g, M)}${M.top && M.top.length ? M.top.slice(0, 10).map((_, j) => html`<${Ga} key=${_[0]} x=${_} rank=${j + 1} fu=${t} sq=${_[5]} cls=${Ms.spot && Ms.spot.uf === t && Ms.spot.casa === g && Ms.spot.n === _[0] ? 'spot' : ''} />`) : html`<p class="note">${Feed.minuteOf(Date.now()) < Oe ? 'Os votos saem a partir das 17h.' : 'Aguardando os primeiros votos.'}</p>`}${
                possuiRanking(M)
                  ? html`<button
                      type="button"
                      class="dmore"
                      onClick=${() => {
                        (r(g), i(''), l(100), Aa());
                      }}
                    >
                      Ver todos os
                      ${Yn.list ? ht($(g).length) + ' ' : ''}candidatos
                    </button>`
                  : null
              }`
        }
      </section>`;
    };
  return html`<section class="card grow stc depst enter" key=${'d' + t}>
    <div class="sh">
      <${hl} uf=${t} size=${40} />
      <div>
        <h2>${s.name}</h2>
        <small>Deputados</small>
      </div>
      <button class="icon" onClick=${e} aria-label="Fechar">
        <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
          <path
            d="M3 3l8 8M11 3l-8 8"
            stroke="currentColor"
            stroke-width="1.6"
            stroke-linecap="round"
          />
        </svg>
      </button>
    </div>
    <${Nr} />
    ${n ? (Ms.k === 'e' ? html`${h('e', Il('e', t))}${h('f', Il('f', t))}` : html`${h('f', Il('f', t))}${h('e', Il('e', t))}`) : html`<p class="note">Carregando…</p>`}
  </section>`;
};

function possuiRanking(dados) {
  return dados.top && dados.top.length > 0;
}
