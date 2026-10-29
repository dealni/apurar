import { ie, ge } from './formatacao-e-acessibilidade-1.js';
import { criarConfirmacaoDeViewport } from './mapa-confirmar-viewport.js';
export function criarControlesDoMapa({
  mapView,
  pn,
  Qn,
  ks,
  ws,
  is,
  tv,
  Ns,
  xa,
  ea,
  no,
  ko,
}) {
  const Ea = () => {
      (mapView.On(!0),
        mapView.Jn(null),
        mapView.ms(null),
        mapView.yo(null),
        mapView.ro(null),
        mapView.Mt(null),
        mapView.zn(null));
    },
    _a = (A) => {
      ((pn.current = A), Qn(A), Ea());
    },
    Zo = criarConfirmacaoDeViewport({
      interaction: {
        ks,
        pn,
        ws,
        is,
      },
      mapView,
    }),
    za = (A) => {
      (clearTimeout(ks.current), (ks.current = setTimeout(Zo, A)));
    },
    el = (A) => {
      if (tv || !mapView.Ae.current || (A.preventDefault(), mapView.dn.current))
        return;
      const [F, at] = Ns(A),
        O = ie(
          A.deltaY * (A.deltaMode === 1 ? 16 : A.deltaMode === 2 ? 400 : 1),
          -300,
          300,
        ),
        ft = xa(ea(), Math.exp(-O * (A.ctrlKey ? 0.01 : 0.0022)), F, at);
      (ft === mapView.en && !mapView.Js && !pn.current) || (_a(ft), za(170));
    },
    Ta = (A) => {
      if (tv || mapView.dn.current || !mapView.Ae.current) return;
      const F = xa(ea(), A, no, ko);
      (F === mapView.en && !mapView.Js && !pn.current) ||
        ((pn.current = F), Qn(F, ge ? 0 : 200), Ea(), za(ge ? 0 : 215));
    },
    nl = () => {
      tv ||
        mapView.dn.current ||
        (!mapView.Js && !pn.current) ||
        ((pn.current = mapView.en),
        Qn(mapView.en, ge ? 0 : 240),
        Ea(),
        za(ge ? 0 : 255));
    };
  return {
    Ea,
    _a,
    Zo,
    za,
    el,
    Ta,
    nl,
  };
}
