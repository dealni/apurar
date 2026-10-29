import { useReferenciasDoMapa } from "./desenho-interacao-referencias.js";
import { derivarContextoDoMapa } from "./desenho-interacao-contexto.js";
import { Gt } from "./municipios-e-distritos-1.js";
import { useState } from "./formatacao-e-acessibilidade-1.js";
import { ga, bl } from "./mapa-dados-1.js";
export function useMapViewState({ props, Y }) {
  const {
    m: modelo,
    mode: mode,
    focus: focus,
    town: town,
    country = null,
    cw: larguraCanvas,
    ch: alturaCanvas,
    rect: rect,
    s: escalaPixels,
    small = !1,
    tv = !1,
    bairro = null,
  } = props;
  const { E, T, Ct, xt } = derivarContextoDoMapa({
      town,
      focus,
      mode,
      Y,
      modelo,
      bairro,
    }),
    referencias = useReferenciasDoMapa(),
    Bn = small ? 52 : tv ? 112 : 92,
    ye = focus ? 0 : Bn,
    cn = mode === "pres" && Y === "votes",
    As = [larguraCanvas, alturaCanvas, escalaPixels].join(),
    Us = bairro != null && T ? Gt(T, bairro) : null,
    rs = Us ? bairro : null,
    Ss = Us ? ga(Us, rect, ye) : null,
    en = ga(bl(focus, town, country, T && T.geo), rect, ye),
    fn = [
      focus || "",
      town == null ? "" : town,
      country || "",
      rs == null ? "" : rs,
      As,
    ].join("|"),
    [vs, io] = useState(null),
    { xs, Ge, Js, da } = derivarViewportDoMapa({
      vs,
      fn,
      Ss,
      en,
    });
  return {
    E,
    T,
    Ct,
    xt,
    ...referencias,
    Bn,
    ye,
    cn,
    As,
    Us,
    rs,
    Ss,
    en,
    fn,
    xs,
    Ge,
    Js,
    da,
    vs,
    io,
  };
}
function derivarViewportDoMapa({ vs, fn, Ss, en }) {
  const xs = !!vs && vs.key === fn,
    Ge = xs ? vs.v : Ss || en,
    Js =
      Ge !== en &&
      (Math.abs(Ge.k - en.k) > en.k * 0.002 ||
        Math.abs(Ge.ox - en.ox) > 0.5 ||
        Math.abs(Ge.oy - en.oy) > 0.5),
    da = Ge.k + "," + Ge.ox + "," + Ge.oy;
  return {
    xs,
    Ge,
    Js,
    da,
  };
}
