import { useLayoutEffect, useEffect } from './formatacao-e-acessibilidade-1.js';
import { criarDesenhoCanvasBase } from './mapa-canvas-base.js';
export function useDesenhoCanvasBase({
  interaction,
  mapView,
  props,
  Ce,
  nr,
  Y,
  gs,
  I,
  Ws,
  wo,
  _o,
  fa,
  K,
  Jr,
}) {
  const { xt, q, ze, As, da, xo } = mapView;
  const {
    m: modelo,
    mode: mode,
    focus: focus,
    town: town,
    country = null,
    drev = 0,
  } = props;
  (useLayoutEffect(
    criarDesenhoCanvasBase({
      interaction,
      mapView,
      props,
      Ce,
      nr,
      Y,
      gs,
      I,
      Ws,
      wo,
      _o,
      fa,
      K,
    }),
    [
      modelo,
      mode,
      Y,
      focus,
      town,
      country,
      As,
      Jr,
      da,
      xt,
      fa,
      K,
      mode === 'dep' ? drev : 0,
      xo,
    ],
  ),
    useEffect(
      () => () => {
        (cancelAnimationFrame(q.current), cancelAnimationFrame(ze.current));
      },
      [],
    ));
}
