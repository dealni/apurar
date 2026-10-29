import { desenharBairros } from "./desenho-overlay-bairros.js";
import { desenharZonas } from "./desenho-overlay-zonas.js";
import {
  prepararSobreposicao,
  desenharRotulos,
  obterDetalhes,
  desenharContornos,
  desenharFoco,
} from "./desenho-overlay-camadas.js";
export function criarDesenhoSobreposicao({ mapView, props, uo, Qs }) {
  const { Ke, Ae, be, ot, Xe, cn, xs, lo, Ds, as, Qo, de, He, ls } = mapView;
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
    linked = null,
    zone = null,
    linkedZ = null,
    bairro = null,
  } = props;
  return () => {
    const tela = prepararSobreposicao({
      Ke,
      Ae,
      be,
      ot,
      ls,
      larguraCanvas,
      alturaCanvas,
      escalaPixels,
    });
    if (!tela) return;
    const { O, ft } = tela;
    desenharRotulos({
      focus,
      small,
      country,
      town,
      ft,
      O,
      larguraCanvas,
      Xe,
      as,
      xs,
      uo,
      rect,
      Qs,
      be,
    });
    const { se, Jt } = obterDetalhes({ town, focus, mode, cn, modelo });
    if (Jt) desenharBairros({ O, rect, Jt, bairro, small, ft, ot, He });
    if (se && !small && !Jt) desenharZonas({ O, ft, rect, se });
    desenharContornos({
      O,
      ft,
      se,
      Jt,
      Qo,
      linkedZ,
      zone,
      escalaPixels,
      bairro,
      He,
      de,
    });
    desenharFoco({ Ds, town, lo, linked, focus, O, ft });
  };
}
