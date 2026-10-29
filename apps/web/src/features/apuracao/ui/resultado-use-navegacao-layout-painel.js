import { useEffect, useRef, ge } from './formatacao-e-acessibilidade-1.js';
import { Dc } from './navegacao-e-patrocinio-1.js';
import { Is } from './eventos-e-progresso-1.js';
export function useNavegacaoLayoutPainel(contexto) {
  const { As, Us, rs, tv, focus, town, country, fa, te, gs, ne } = contexto;
  const no = Dc && As && !Us && !rs && !tv;
  const ko = As && !Us && !rs && !tv && !no;
  const Zn = focus
    ? focus + (town == null ? '' : '-' + town) + (country || '')
    : '';
  useEffect(() => {
    no && Zn && (fa('mapa'), te(!1));
  }, [Zn]);
  useEffect(() => {
    gs === 'ultimas' && (ne.current = Is.length);
  });
  useEffect(
    () => (
      document.documentElement.classList.toggle('flow', ko),
      () => document.documentElement.classList.remove('flow')
    ),
    [ko],
  );
  const ta = useRef(Zn);
  useEffect(() => {
    if (ta.current === Zn) return;
    ta.current = Zn;
    if (!ko) return;
    if (contexto.office === "pres" && focus !== "ZZ") {
      const mapa = document.querySelector(".pres-map-first > .mapwrap");
      if (!mapa) return;
      const bounds = mapa.getBoundingClientRect();
      const sticky = document.querySelector(".pres-map-first > .swbar");
      const limite = (sticky?.getBoundingClientRect().bottom || 0) + 16;
      if (bounds.bottom > limite && bounds.top < innerHeight - 80) return;
      mapa.scrollIntoView({ block: "center", behavior: ge ? "auto" : "smooth" });
      return;
    }
    scrollTo({ top: 0, behavior: ge ? "auto" : "smooth" });
  }, [Zn, ko]);
  return {
    no,
    ko,
    Zn,
  };
}
