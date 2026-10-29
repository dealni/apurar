import { useEffect, useRef, ts } from "./formatacao-e-acessibilidade-1.js";

// O painel não oferece seleção de zonas ou bairros. A estrutura neutra mantém
// a interface dos layouts reaproveitados, sem estado ou eventos dessas seleções.
export function useContextoMunicipalPainel({ tv, focus, da, openIn, town }) {
  const anterior = useRef(focus);
  useEffect(() => {
    const uf = anterior.current;
    anterior.current = focus;
    if (ts.on && uf && !focus)
      document
        .querySelector(`.mk[data-uf="${uf}"]`)
        ?.focus({ preventScroll: true });
  }, [focus]);
  return {
    Qe: tv ? null : { open: focus, hover: da, go: openIn },
    pn: focus !== "ZZ" ? town : null,
    jn: null,
    eo: null,
    ks: null,
    co: null,
    is: null,
    Es: null,
  };
}
