import { renderizarCarrosselDeProjecoes } from './resultado-projecao-carrossel.js';
import {
  useState,
  useRef,
  useEffect,
  Vt,
  Xt,
  useLayoutEffect,
  html,
  ge,
} from './formatacao-e-acessibilidade-1.js';
import { Oo, qr, $1, Rl } from './historico-e-graficos-1.js';
import { Ca, w1, g1, y1 } from './projecoes-graficos-1.js';
import { Feed } from '../feed.js';
export let Zl;
export function initialize() {
  Zl = definirZl;
}
function definirZl({ m: t, own: e = !1, fore: n = !0 }) {
  const [, s] = useState(0),
    [a, r] = useState(0),
    u = useRef(null),
    i = useRef(!1);
  useEffect(() => {
    const v = () => s((S) => S + 1);
    (Oo.subs.add(v), Ca('mercados', 0), Ca('pesquisas', 0), Ca('projecao', 0));
    const M = 0;
    return () => {
      (Oo.subs.delete(v), clearInterval(M));
    };
  }, []);
  const c = (v) =>
      Oo.data[v] || (!Feed.LIVE && window.PREVISAO ? window.PREVISAO[v] : null),
    l = n
      ? [
          Vt(t) || (Xt === 2 && t.n.pst >= 0.15) ? null : w1(c('projecao'), e),
          g1(c('mercados')),
          y1(c('pesquisas')),
        ].filter(Boolean)
      : [],
    d = [
      Xt === 2 && (qr(t) || (e && !l.length)) ? $1(t, e) : null,
      ...l,
    ].filter(Boolean),
    $ = d.map((v) => v.id).join();
  if (
    (useLayoutEffect(() => {
      i.current || !u.current || ((u.current.scrollLeft = 0), r(0));
    }, [$]),
    !d.length)
  )
    return e ? null : html`<${Rl} m=${t} />`;
  const f = Math.min(a, d.length - 1),
    m = (v) => {
      i.current = !0;
      const M = u.current;
      if (!M) return;
      const S = (v + d.length) % d.length;
      (M.scrollTo({
        left: S * M.clientWidth,
        behavior: ge ? 'auto' : 'smooth',
      }),
        r(S));
    },
    h = (v) => {
      v.isTrusted !== !1 && v.currentTarget.scrollLeft > 4 && (i.current = !0);
      const M = v.currentTarget,
        S = Math.round(M.scrollLeft / Math.max(1, M.clientWidth));
      S !== a && r(S);
    };
  return renderizarCarrosselDeProjecoes(d, e, f, h, m, u);
}
