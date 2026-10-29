import { renderizarProjecaoNacional } from './resultado-projecao-painel-previsao.js';
import { renderizarPainelNacional } from './resultado-projecao-painel-nacional.js';
import {
  Vt,
  vt,
  useState,
  useMemo,
  useRef,
  useLayoutEffect,
  _t,
  html,
  nt,
  yt,
  ht,
  hn,
  Te,
} from './formatacao-e-acessibilidade-1.js';
import { ss } from './apuracao-e-votos-1.js';
import { Feed } from '../feed.js';
import { Gr, Hs } from './atualizacoes-1.js';
import { Is } from './eventos-e-progresso-1.js';
import { zu } from './paineis-e-projecoes-1.js';
import { Ia } from './contagem-e-animacao-1.js';
import { ka } from './resultados-e-listas-1.js';
export let _i;
export function initialize() {
  _i = definiri;
}
function definiri({
  m: t,
  t: e,
  h: n = 'tall',
  link: s = null,
  onNext: a = null,
  onTown: r = null,
  fore: u = !0,
}) {
  const i = t.n,
    c = i.valid > 0,
    l = i.status !== 'apurando',
    d = Vt(t),
    $ = [t.pres[0], t.pres[1]].sort(ss),
    f = Feed.LIVE && !vt.on,
    m = Gr(
      c
        ? Is.filter((T) => (T.flip || T.big === 'virada') && (f || T.t <= e))
            .slice(-40)
            .reverse()
        : [],
      e,
    ),
    [h, g] = useState('noite'),
    v = useMemo(() => (c ? zu(t) : null), [t, c]),
    M = (T) => 'c' + T,
    S = Gr(v || [], e, M),
    x = h === 'cid' && v ? S.slice(0, 40) : [],
    w = useRef(null),
    z = () => {
      const T = w.current;
      T &&
        T.classList.toggle(
          'over',
          T.scrollHeight - T.scrollTop > T.clientHeight + 1,
        );
    };
  (useLayoutEffect(z, [h, m.length, x.length]),
    Ia(w, [h + ':' + (h === 'cid' ? x.map(M) : m.map(Hs)).join()], !0));
  const gt = n === 'short' || n === 'tiny',
    _ = (T) => _t(T) + '%',
    j = renderizarProjecaoNacional($, d, gt, t, u),
    Y = c
      ? [
          ['Votos válidos', i.valid, ht],
          ['Comparecimento', i.elDone ? i.votes / i.elDone : 0, _],
          ['Abstenção', i.elDone ? 1 - i.votes / i.elDone : 0, _],
          ['Brancos e nulos', i.votes ? (i.blank + i.nul) / i.votes : 0, _],
        ]
      : [
          ['Eleitorado', i.el, ht],
          ['Seções', i.sections, ht],
        ],
    E = (T) => {
      const Ct = html`<time>${hn(T.shown != null ? T.shown : T.t)}</time
        ><span
          ><b>${T.uf ? Te[T.uf] : 'Brasil'}</b> virou para
          <i style=${'background:' + nt(T.cand)}></i>${yt(T.cand)}</span
        >`;
      return T.uf && s
        ? html`<button
            class="vr"
            data-k=${Hs(T)}
            key=${Hs(T)}
            onClick=${() => s.go('pres', T.uf)}
            ...${ka(s, T.uf)}
          >
            ${Ct}
          </button>`
        : html`<div class="vr" data-k=${Hs(T)} key=${Hs(T)}>${Ct}</div>`;
    };
  return renderizarPainelNacional(
    E,
    M,
    S,
    Y,
    a,
    c,
    g,
    h,
    i,
    j,
    l,
    m,
    r,
    s,
    t,
    v,
    w,
    x,
    z,
  );
}
