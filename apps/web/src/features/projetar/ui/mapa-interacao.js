import { criarMovimentoDoPonteiro } from "./desenho-interacao-mover.js";
import { criarControlesDoMapa } from "./desenho-interacao-controles.js";
import { criarLimitesDoMapa } from "./desenho-interacao-limites.js";
import { ie, useRef } from "./formatacao-e-acessibilidade-1.js";
import { criarInicioDeGesto } from "./mapa-iniciar-gesto.js";
import { criarFimDeGesto } from "./mapa-finalizar-gesto.js";
export function useMapPointerInteraction({ props, mapView }) {
  const {
    focus: focus,
    town: town,
    cw: larguraCanvas,
    ch: alturaCanvas,
    rect: rect,
    tv = !1,
  } = props;
  const ne = (A, F, at) => {
      const O = ie((at - A) / (F - A), 0, 1);
      return O * O * (3 - 2 * O);
    },
    Je = useRef([]),
    gn = (A) =>
      Je.current[A] || (Je.current[A] = document.createElement("canvas")),
    Qe = useRef("mouse"),
    js = useRef(null),
    fs = useRef(null),
    pn = useRef(null),
    bs = useRef(new Map()),
    ys = useRef(null),
    jn = useRef(null),
    eo = useRef(!1),
    ks = useRef(0),
    co = useRef(null),
    Ns = (A) => {
      const F = fs.current.getBoundingClientRect();
      return [
        ((A.clientX - F.left) * larguraCanvas) / F.width,
        ((A.clientY - F.top) * alturaCanvas) / F.height,
      ];
    },
    Qn = (A, F = 0) => {
      const at = mapView.Ae.current,
        O = js.current;
      if (!at || !O) return;
      const ft = A.k / at.k;
      ((O.style.transition = F
        ? `transform ${F}ms cubic-bezier(.2,.7,.2,1)`
        : "none"),
        (O.style.transform = `translate(${A.ox - at.ox * ft}px,${A.oy - at.oy * ft}px) scale(${ft})`));
    },
    is = () => {
      const A = js.current;
      A && ((A.style.transition = "none"), (A.style.transform = ""));
    },
    { Es, cs, no, ko, Zn, ta, Dn, Gs, ws, _s, xa } = criarLimitesDoMapa({
      focus,
      town,
      rect,
      mapView,
    }),
    ea = () => pn.current || mapView.Ae.current,
    { Ea, _a, Zo, za, el, Ta, nl } = criarControlesDoMapa({
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
    }),
    er = criarInicioDeGesto({
      interaction: {
        Qe,
        bs,
        Ns,
        jn,
        ea,
        ys,
        eo,
      },
      v: tv,
      mapView,
    }),
    Gn = criarMovimentoDoPonteiro({
      bs,
      mapView,
      Ns,
      jn,
      xa,
      _a,
      _s,
      ys,
      ea,
      ta,
      getFim: () => Eo,
    }),
    Eo = criarFimDeGesto({
      interaction: {
        bs,
        ys,
        Ns,
        jn,
        eo,
        Zo,
      },
    });
  return {
    ne,
    Je,
    gn,
    Qe,
    js,
    fs,
    pn,
    bs,
    ys,
    jn,
    eo,
    ks,
    co,
    Ns,
    Qn,
    is,
    Es,
    cs,
    no,
    ko,
    Zn,
    ta,
    Dn,
    Gs,
    ws,
    _s,
    xa,
    ea,
    Ea,
    _a,
    Zo,
    za,
    el,
    Ta,
    nl,
    er,
    Gn,
    Eo,
  };
}
