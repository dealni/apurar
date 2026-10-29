import { je } from "./formatacao-e-acessibilidade-1.js";
import { Feed } from "../feed.js";

// A interface acompanha apenas a última publicação; não há seleção temporal.
export function useReproducaoDoHistorico({ Y, j, T, we, u, a, _ }) {
  const ke = () => {
    Y.current = true;
    j.current = performance.now();
    T.current = null;
    we(null);
    u(true);
    a(Math.floor(Feed.LIVE ? _.current : Math.min(_.current, je)));
  };
  return { ke, W: null, ze: false, Pn: () => {}, dn: 1000, In: null, sn: null };
}
