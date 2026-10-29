import { useEventosDaTV } from './tela-tv-e-eventos.js';
import { Hc } from './estado-e-navegacao-1.js';
import { useFullscreenEWakeLock } from './tela-fullscreen.js';

export function useModoTV({
  Ds,
  g,
  Ye,
  s,
  de,
  ro,
  as,
  Mt,
  _,
  Y,
  j,
  n,
  a,
  we,
  u,
  S,
  w,
  yo,
  i,
  v,
  E,
}) {
  useEventosDaTV({
    Ds,
    g,
    Ye,
    s,
    de,
    ro,
    as,
    Mt,
  });
  const Vs = () => {
      const I = _.current;
      ((Y.current = !0),
        (j.current = performance.now()),
        n(I),
        a(I),
        we(null),
        u(!0),
        S(null),
        w(!1),
        (de.current = new Set()),
        (Ye.current = I),
        yo(Hc(i)),
        ro(null),
        v(!0));
      const K = document.documentElement,
        te = K.requestFullscreen || K.webkitRequestFullscreen;
      if (te)
        try {
          const ne = te.call(K, {
            navigationUI: 'hide',
          });
          ne && ne.catch && ne.catch(() => {});
        } catch {
          /* Fallback opcional preservado da captura; a interface continua disponível. */
        }
    },
    ls = () => document.fullscreenElement || document.webkitFullscreenElement,
    On = () => {
      (v(!1), ro(null));
      const I = document.exitFullscreen || document.webkitExitFullscreen;
      if (ls() && I)
        try {
          const K = I.call(document);
          K && K.catch && K.catch(() => {});
        } catch {
          /* Fallback opcional preservado da captura; a interface continua disponível. */
        }
      E.current && (E.current.release().catch(() => {}), (E.current = null));
    };
  useFullscreenEWakeLock({
    ls,
    g,
    On,
    E,
  });

  return { Vs, ls, On };
}
