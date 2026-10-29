import { zt } from './municipios-e-distritos-2.js';
import { Geo } from '../geography.js';
import { vn, En } from './municipios-e-distritos-1.js';
import { U } from './formatacao-e-acessibilidade-1.js';
import { desenharExterior } from './desenho-overlay-exterior.js';
import { desenharMunicipios } from './desenho-overlay-municipios.js';
import { desenharDestaques } from './desenho-overlay-destaques.js';
export function prepararSobreposicao({
  Ke,
  Ae,
  be,
  ot,
  ls,
  larguraCanvas,
  alturaCanvas,
  escalaPixels,
}) {
  const A = Ke.current;
  if (!A || !larguraCanvas) return;
  const F = Math.round(larguraCanvas * escalaPixels),
    at = Math.round(alturaCanvas * escalaPixels);
  (A.width !== F && (A.width = F), A.height !== at && (A.height = at));
  const O = A.getContext('2d');
  if (!O) return;
  (O.setTransform(1, 0, 0, 1, 0, 0), O.clearRect(0, 0, F, at));
  const ft = Ae.current;
  if (((be.current = []), (ot.current = []), !ft || ls)) return;
  O.setTransform(escalaPixels, 0, 0, escalaPixels, 0, 0);
  return { O, ft };
}
export function desenharRotulos({
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
}) {
  if (focus === 'ZZ' && zt && !small) {
    desenharExterior({ country, town, ft, O, larguraCanvas, Xe, as });
  } else if ((focus || xs) && !small) {
    desenharMunicipios({ uo, ft, O, rect, xs, focus, town, Qs, be });
  }
}
export function obterDetalhes({ town, focus, mode, cn, modelo }) {
  const podeDetalhar = town != null && focus !== 'ZZ' && mode === 'pres' && !cn;
  const se = podeDetalhar && !vn(modelo, town) ? U(town) : null;
  const Jt = podeDetalhar ? En(modelo, town) : null;
  return { se, Jt };
}
export function desenharContornos({
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
}) {
  O.save();
  O.translate(ft.ox, ft.oy);
  O.scale(ft.k, ft.k);
  O.lineJoin = 'round';
  if (se && !Jt) {
    O.strokeStyle = '#FAFAF9';
    O.lineWidth = 2 / ft.k;
    for (const Zt of new Set([Qo, linkedZ, zone]))
      if (Zt != null && se.has[Zt]) O.stroke(se.paths[Zt]);
  }
  if (Jt) desenharDestaques({ Jt, O, escalaPixels, ft, bairro, He, de });
}
export function desenharFoco({ Ds, town, lo, linked, focus, O, ft }) {
  const Rt = Ds != null && Ds !== town,
    st = lo || linked;
  (st &&
    st !== focus &&
    Geo.ufs[st] &&
    ((O.strokeStyle = Rt ? 'rgba(208,214,224,.35)' : '#FAFAF9'),
    (O.lineWidth = (Rt ? 1 : 1.6) / ft.k),
    O.stroke(Geo.ufs[st].outline)),
    Rt &&
      ((O.strokeStyle = '#FAFAF9'),
      (O.lineWidth = 2 / ft.k),
      O.stroke(Geo.munis[Ds].path)),
    O.restore());
}
