import { criarDetectorDeAlvo } from './mapa-detectar-alvo.js';
import { zr } from './mapa-dados-2.js';
import { xn } from './municipios-e-distritos-1.js';
import { Feed } from '../feed.js';
export function criarSelecaoDoMapa({ interaction, mapView, props, Y }) {
  const {
    m: modelo,
    mode,
    focus,
    town,
    cw: larguraCanvas,
    ch: alturaCanvas,
    onPick,
    onTown,
    onCity,
    small = false,
    tv = false,
    onZone = null,
    flow = false,
    onBairro = null,
  } = props;
  function selecionarAlvo(F) {
    if (F)
      if (!F.uf) onPick(null);
      else if (F.city != null) onCity && onCity(F.city);
      else if (F.zone != null && onZone) onZone(F.zone);
      else if (F.bairro != null && onBairro) onBairro(F.bairro);
      else if (F.local != null) {
        const at = xn(town),
          O = at ? at.b[F.local] : -1;
        onBairro && onBairro(O >= 0 ? O : null);
      } else selecionarMunicipioOuEstado(F);
  }
  function selecionarMunicipioOuEstado(F) {
    F.uf !== focus &&
    !(sl && onTown && F.muni != null && interaction.Qe.current === 'mouse')
      ? onPick(F.uf)
      : fo && onTown && F.muni != null && onTown(F.muni);
  }
  const or = criarDetectorDeAlvo({
      interaction,
      mapView,
      props,
    }),
    sl = mode === 'pres' && (Y !== 'uf' || !!focus) && modelo.towns && !zr(),
    fo = sl || (Feed.LIVE && (mode === 'gov' || mode === 'sen') && !!focus),
    qd = !focus && !mapView.xs,
    Xc = (A) =>
      A && qd && A.muni != null && A.city == null
        ? {
            uf: A.uf,
            x: A.x,
            y: A.y,
          }
        : A,
    Bd = (A, F) =>
      A === F ||
      (!!A &&
        !!F &&
        A.uf === F.uf &&
        A.muni === F.muni &&
        A.city === F.city &&
        A.zone === F.zone &&
        A.local === F.local &&
        A.bairro === F.bairro),
    Hd = (A) => {
      if (small || tv) return;
      const F = Xc(or(A)),
        at = F && F.uf ? F : null;
      (mapView.Jn((O) => (Bd(O, at) ? O : at)),
        mapView.ms(F ? F.uf : null),
        mapView.yo(F && F.uf && fo && F.muni != null ? F.muni : null),
        atualizarDetalhesDeHover(mapView, F));
    },
    Ud = (A) => {
      if (tv) return;
      if (interaction.eo.current) {
        interaction.eo.current = !1;
        return;
      }
      const F = Xc(or(A, !0));
      selecionarAlvo(F);
    },
    ar =
      `width:${larguraCanvas}px;height:${alturaCanvas}px` +
      (flow && !mapView.Js ? ';touch-action:pan-y' : '');
  return {
    sl,
    fo,
    Hd,
    Ud,
    ar,
  };
}
function atualizarDetalhesDeHover(mapView, F) {
  mapView.ro(F && F.city != null ? F.city : null);
  mapView.Mt(F && F.zone != null ? F.zone : null);
  mapView.Ye(F && F.local != null ? F.local : null);
  mapView.zn(F && F.bairro != null ? F.bairro : null);
}
