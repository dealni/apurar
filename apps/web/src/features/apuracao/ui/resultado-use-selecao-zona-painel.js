import { blocksPanelShortcut } from "../../../runtime/interaction-guards.ts";
import { useState, useEffect, U } from './formatacao-e-acessibilidade-1.js';
export function useSelecaoZonaPainel(contexto) {
  const { tv, focus, da, openIn, town, zoneN, onZoneN } = contexto;
  const Qe = tv
    ? null
    : {
        open: focus,
        hover: da,
        go: openIn,
      };
  const [js, fs] = useState(null);
  const pn = focus !== 'ZZ' ? town : null;
  const bs = pn != null && zoneN != null ? U(pn) : null;
  const ys = bs ? bs.z.findIndex((Ce) => +Ce === zoneN) : -1;
  const jn = ys >= 0 ? ys : null;
  const eo = js && js.town === pn ? js.j : null;
  const ks = (Ce) => {
    const Mn = pn != null ? U(pn) : null,
      Ws = Mn && Mn.z[Ce] != null ? +Mn.z[Ce] : null;
    onZoneN && onZoneN(Ws == null || Ws === zoneN ? null : Ws);
  };
  const co = (Ce) =>
    fs(
      Ce == null
        ? null
        : {
            town: pn,
            j: Ce,
          },
    );
  useEffect(() => {
    if (jn == null || tv) return;
    const Ce = (Mn) => {
      !blocksPanelShortcut(Mn) &&
        Mn.key === 'Escape' &&
        !document.querySelector('.search,.about,.candpick,.acesso') &&
        (Mn.stopPropagation(), onZoneN && onZoneN(null));
    };
    return (
      addEventListener('keydown', Ce, !0),
      () => removeEventListener('keydown', Ce, !0)
    );
  }, [jn, tv, onZoneN]);
  return {
    Qe,
    pn,
    jn,
    eo,
    ks,
    co,
  };
}
