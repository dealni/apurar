import { useEffect, ie } from "./formatacao-e-acessibilidade-1.js";
import { Feed } from "../feed.js";
import { ho, $u, pu } from "./contagem-e-animacao-1.js";
import { fi } from "./eventos-e-progresso-2.js";
export function useFeedEAvisos({ _, Y, n, ve, xt, Ae, D }) {
  (useEffect(() => {
    if (!Feed.LIVE) return;
    let I = 0,
      K = 0;
    const te = Feed.on("snap", (gn) => {
        const Qe = performance.now();
        (I && (K = K ? K * 0.7 + (Qe - I) * 0.3 : Qe - I),
          (I = Qe),
          (ho.dur = ie((K || Feed.CFG.intervalo * 1e3) * 0.85, 1500, 2e4)),
          gn.t - _.current > 10 && (Y.current = !0),
          $u(gn),
          fi(gn),
          (_.current = gn.t),
          n(gn.t),
          ve((js) => js + 1));
      }),
      ne = Feed.on("status", xt),
      Je = Feed.on("history", (gn) => {
        pu(gn) && ve((Qe) => Qe + 1);
      });
    return (
      Feed.start(),
      () => {
        (te(), ne(), Je());
      }
    );
  }, []),
    useEffect(() => {
      if (!Ae) return;
      const I = setTimeout(() => D(null), 5e3);
      return () => clearTimeout(I);
    }, [Ae]));
}
