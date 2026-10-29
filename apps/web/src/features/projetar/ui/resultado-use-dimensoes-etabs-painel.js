import { layoutDoPainel } from "./shell-layout.js";
import { useState, useRef } from "./formatacao-e-acessibilidade-1.js";
import { vi } from "./hud-e-comunicacao-1.js";
import { ad, Dc, Vc } from "./navegacao-e-patrocinio-1.js";
import { Ao } from "./contagem-e-animacao-1.js";
import { Is } from "./eventos-e-progresso-1.js";
export function useDimensoesETabsPainel(contexto) {
  const { tv, toast, ev, office } = contexto;
  const { W: Bn, H: ye } = ad();
  const {
    mobile: As,
    landscape: Us,
    tablet: rs,
  } = layoutDoPainel({
    width: Bn,
    height: ye,
    tv,
    shell: Dc,
  });
  const Ss = Math.min(2, devicePixelRatio || 1);
  const [en, fn] = Ao();
  const [vs, io] = vi(tv ? null : toast, 320);
  const [xs, Ge] = vi(tv ? ev : null, 450);
  const [Js, da] = useState(null);
  const [gs, fa] = useState(() => {
    try {
      const Ce = Dc && sessionStorage.getItem("apuracao.tab");
      return Vc.some((Mn) => Mn[0] === Ce) ? Ce : "mapa";
    } catch {
      return "mapa";
    }
  });
  const I = (Ce) => {
    fa(Ce);
    try {
      sessionStorage.setItem("apuracao.tab", Ce);
    } catch {
      /* Fallback opcional preservado da captura; a interface continua disponível. */
    }
  };
  const [K, te] = useState(!1);
  const ne = useRef(Is.length);
  const Je = 0;
  return {
    Bn,
    ye,
    As,
    Us,
    rs,
    Ss,
    en,
    fn,
    vs,
    io,
    xs,
    Ge,
    Js,
    da,
    gs,
    fa,
    I,
    K,
    te,
    ne,
    Je,
  };
}
