import { Yo } from "./estado-e-navegacao-1.js";
import { useEffect } from "./formatacao-e-acessibilidade-1.js";
import { Feed } from "../feed.js";
import { Fn } from "./apuracao-e-votos-1.js";
import { Is } from "./eventos-e-progresso-1.js";
export function useEventosDaTV({ Ds, g, Ye, s, de, ro, as, Mt }) {
  ((Yo.at = Ds),
    useEffect(() => {
      if (!g) return;
      if (Ye.current == null) {
        if (Feed.LIVE && !Fn.length) return;
        Ye.current = s;
      }
      const I = Is.find(
        (K) =>
          K.big &&
          K.t <= s &&
          (K.at != null ? K.at : K.t) > Ye.current &&
          !de.current.has(K.t + K.big),
      );
      I && (de.current.add(I.t + I.big), ro(I));
    }, [s, g]),
    useEffect(() => {
      if (!as) return;
      const I = setTimeout(() => ro(null), 12e3);
      return () => clearTimeout(I);
    }, [as]),
    useEffect(() => {
      if (!g) return;
      let I;
      const K = () => {
        (Mt(!1), clearTimeout(I), (I = setTimeout(() => Mt(!0), 2500)));
      };
      K();
      const te = ["mousemove", "pointerdown", "touchstart", "keydown"];
      return (
        te.forEach((ne) =>
          addEventListener(ne, K, {
            passive: !0,
          }),
        ),
        () => {
          (te.forEach((ne) => removeEventListener(ne, K)), clearTimeout(I));
        }
      );
    }, [g]));
}
