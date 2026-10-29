import { useEffect } from "./formatacao-e-acessibilidade-1.js";
import { criarDesenhoSobreposicao } from "./mapa-canvas-sobreposicao.js";
export function useDesenhoSobreposicao({ mapView, props, uo, Qs }) {
  const { xt, cn, As, xo, lo, Ds, as, Qo, de, He, on, ls } = mapView;
  const {
    m: modelo,
    mode: mode,
    focus: focus,
    town: town,
    country = null,
    small = !1,
    tv = !1,
    linked = null,
    zone = null,
    linkedZ = null,
    bairro = null,
  } = props;
  useEffect(
    criarDesenhoSobreposicao({
      mapView,
      props,
      uo,
      Qs,
    }),
    [
      modelo,
      mode,
      cn,
      focus,
      town,
      country,
      zone,
      linked,
      linkedZ,
      bairro,
      lo,
      Ds,
      as,
      Qo,
      de,
      He,
      ls,
      small,
      tv,
      As,
      Qs,
      on,
      xt,
      xo,
    ],
  );
}
