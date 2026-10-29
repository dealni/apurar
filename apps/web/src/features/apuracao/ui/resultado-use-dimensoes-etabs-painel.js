import {
  useState,
  useEffect,
  useRef,
} from './formatacao-e-acessibilidade-1.js';
import { vi } from './hud-e-comunicacao-1.js';
import { ad, Dc, Vc } from './navegacao-e-patrocinio-1.js';
import { Ao } from './contagem-e-animacao-1.js';
import { Is } from './eventos-e-progresso-1.js';
import { Rs } from './composicao-legislativa-1.js';
import { wa } from './deputados-1.js';
export function useDimensoesETabsPainel(contexto) {
  const { tv, toast, ev, office } = contexto;
  const { W: Bn, H: ye } = ad();
  const cn = ye >= Bn;
  const As = Bn < 1e3 && (cn || ye < 640);
  const Us = As && !cn && Bn >= 700;
  const rs = As && cn && Bn >= 700;
  const Ss = Math.min(2, devicePixelRatio || 1);
  const [en, fn] = Ao();
  const [vs, io] = vi(tv ? null : toast, 320);
  const [xs, Ge] = vi(tv ? ev : null, 450);
  const [Js, da] = useState(null);
  const [gs, fa] = useState(() => {
    try {
      const Ce = Dc && sessionStorage.getItem('apuracao.tab');
      return Vc.some((Mn) => Mn[0] === Ce) ? Ce : 'mapa';
    } catch {
      return 'mapa';
    }
  });
  const I = (Ce) => {
    fa(Ce);
    try {
      sessionStorage.setItem('apuracao.tab', Ce);
    } catch {
      /* Fallback opcional preservado da captura; a interface continua disponível. */
    }
  };
  const [K, te] = useState(!1);
  const ne = useRef(Is.length);
  const [Je, gn] = useState(0);
  useEffect(() => {
    if (office !== 'dep') return;
    const Ce = () => gn((Ws) => Ws + 1);
    (Rs.subs.add(Ce), wa('br'));
    const Mn = 0;
    return () => {
      (Rs.subs.delete(Ce), clearInterval(Mn));
    };
  }, [office]);
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
