import { useFecharBairroAoEsc } from './painel-fechar-bairro.js';
import {
  useState,
  useEffect,
  useRef,
  ts,
} from './formatacao-e-acessibilidade-1.js';
export function useSelecaoBairroPainel(contexto) {
  const { tv, pn, focus } = contexto;
  const [Ns, Qn] = useState(null);
  const is = !tv && Ns && Ns.town === pn ? Ns.b : null;
  const Es = (Ce) =>
    Qn(
      Ce == null || Ce === is
        ? null
        : {
            town: pn,
            b: Ce,
          },
    );
  useFecharBairroAoEsc({
    is,
    Qn,
  });
  const cs = useRef(focus);
  useEffect(() => {
    const Ce = cs.current;
    if (((cs.current = focus), ts.on && Ce && !focus)) {
      const Mn = document.querySelector(`.mk[data-uf="${Ce}"]`);
      Mn &&
        Mn.focus({
          preventScroll: !0,
        });
    }
  }, [focus]);
  return {
    is,
    Es,
  };
}
