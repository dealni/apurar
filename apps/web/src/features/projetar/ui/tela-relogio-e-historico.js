import { useEffect, je } from "./formatacao-e-acessibilidade-1.js";
import { Feed } from "../feed.js";
import { $rState } from "./contagem-e-animacao-1.js";
import { fi } from "./eventos-e-progresso-2.js";
import { Md, Qa } from "./estado-e-navegacao-1.js";
import { Is } from "./eventos-e-progresso-1.js";
import { Cd } from "./painel-de-resultados-2.js";
export function useRelogioEHistorico({
  e,
  le,
  _,
  n,
  r,
  s,
  j,
  a,
  S,
  M,
  c,
  f,
  h,
  Y,
  T,
}) {
  (useEffect(() => {
    if (Feed.LIVE) return;
    let I = 0;
    const K = (te) => {
      const ne = Math.min(e, je);
      let Je = 0;
      for (; $rState.value < ne && Je < 12;)
        (fi(Feed.peek(++$rState.value)), Je++);
      $rState.value < ne
        ? (I = setTimeout(() => K(!0), 0))
        : te && le((gn) => gn + 1);
    };
    return (K(!1), () => clearTimeout(I));
  }, [e]),
    useEffect(() => {
      if (Feed.LIVE) return;
      let I,
        K = performance.now();
      const te = (ne) => {
        const Je = Math.min(0.25, (ne - K) / 1e3);
        ((K = ne),
          _.current < je &&
            ((_.current = Math.min(je, _.current + Je * Md(_.current))),
            (I = requestAnimationFrame(te))));
        const gn = Math.floor(_.current);
        n((Qe) => (Qe === gn ? Qe : gn));
      };
      return ((I = requestAnimationFrame(te)), () => cancelAnimationFrame(I));
    }, []),
    useEffect(() => {
      // Uma interação pode selecionar histórico antes deste efeito do render anterior.
      if (!r || T.current != null || e === s) return;
      const I = performance.now(),
        K = (ne) => (ne.at != null ? ne.at : ne.t),
        te = Is.filter((ne) => ne.big && K(ne) > s && K(ne) <= e);
      (Feed.LIVE || te.length || I - j.current >= Cd || e >= je) &&
        ((j.current = I), a(e), te.length && S(te[te.length - 1]));
    }, [e, r]),
    useEffect(() => {
      if (!M) return;
      const I = setTimeout(() => S(null), 8e3);
      return () => clearTimeout(I);
    }, [M]),
    useEffect(() => {
      const I = () => {
        const K = Qa();
        (c(K),
          K.office === "pres" && (f(K.level), K.cand != null && h(K.cand)));
      };
      return (
        addEventListener("hashchange", I),
        () => removeEventListener("hashchange", I)
      );
    }, []),
    useEffect(() => {
      Y.current = !1;
    }));
}
