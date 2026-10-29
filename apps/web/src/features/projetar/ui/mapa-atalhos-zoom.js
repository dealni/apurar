import { blocksPanelShortcut } from "../../../runtime/interaction-guards.ts";
import { useEffect } from "./formatacao-e-acessibilidade-1.js";
export function useAtalhosDeZoom({ interaction, mapView, props }) {
  const { fs, ks, co, el, Ta, nl } = interaction;
  const { Bt } = mapView;
  const { tv = !1 } = props;
  ((co.current = {
    wheel: el,
    nudge: Ta,
    reset: nl,
  }),
    useEffect(() => {
      const A = [Bt.current, fs.current].filter(Boolean),
        F = (at) => co.current.wheel(at);
      return (
        A.forEach((at) =>
          at.addEventListener("wheel", F, {
            passive: !1,
          }),
        ),
        () => {
          (A.forEach((at) => at.removeEventListener("wheel", F)),
            clearTimeout(ks.current));
        }
      );
    }, []),
    useEffect(() => {
      if (tv) return;
      const A = (F) => {
        blocksPanelShortcut(F) ||
          F.metaKey ||
          F.ctrlKey ||
          F.altKey ||
          document.querySelector(".search,.about,.candpick,.acesso") ||
          (F.key === "+" || F.key === "="
            ? co.current.nudge(1.6)
            : F.key === "-" || F.key === "_"
              ? co.current.nudge(1 / 1.6)
              : F.key === "0" && co.current.reset());
      };
      return (
        addEventListener("keydown", A),
        () => removeEventListener("keydown", A)
      );
    }, [tv]));
}
