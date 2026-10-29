import { legacyTerritoryDetailsEnabled } from "../territory-details.js";
import { Yo, Qa } from "./estado-e-navegacao-1.js";
import { kd, wd } from "./painel-de-resultados-2.js";
import {
  useState,
  ge,
  useRef,
  useEffect,
  It,
  Xt,
  useMemo,
  b,
} from "./formatacao-e-acessibilidade-1.js";
import { hi } from "./contagem-e-animacao-1.js";
import { Feed } from "../feed.js";
import { useFeedEAvisos } from "./tela-feed-e-avisos.js";
import { useRelogioEHistorico } from "./tela-relogio-e-historico.js";
import { criarNotificacaoDeApurados } from "./tela-notificar-apurados.js";

export function useEstadoInicial() {
  const t = Yo.clock != null ? Yo.clock : kd,
    [e, n] = useState(t),
    [s, a] = useState(t),
    [r, u] = useState(!0),
    [i, c] = useState(Qa),
    [l, d] = useState(!1),
    [$, f] = useState(() => Qa().level),
    [m, h] = useState(() => Qa().cand),
    [g, v] = useState(() => (Yo.tv != null ? Yo.tv : /tv/.test(location.hash))),
    [M, S] = useState(null),
    [x, w] = useState(!1),
    [z, gt] = useState(!ge),
    _ = useRef(t),
    j = useRef(0),
    Y = useRef(!0),
    E = useRef(null),
    T = useRef(null);
  ((Yo.tv = g),
    (Yo.clock = Math.floor(_.current)),
    (hi.on = z),
    useEffect(() => {
      if (!z) return;
      const I = setTimeout(() => gt(!1), 1800);
      return () => clearTimeout(I);
    }, [z]));
  const [Ct, xt] = useState(Feed.status()),
    [Bt, ve] = useState(0),
    [Ke, we] = useState(null),
    [Ae, D] = useState(null);
  useFeedEAvisos({
    _,
    Y,
    n,
    ve,
    xt,
    Ae,
    D,
  });
  const [, q] = useState(0);
  (useEffect(
    () => (Feed.LIVE ? Feed.on("detail", () => q((I) => I + 1)) : void 0),
    [],
  ),
    useEffect(() => {
      const I = () => q((te) => te + 1),
        K = window.APURACAO || {};
      return (
        addEventListener("zonas", I),
        addEventListener("t1mun", I),
        addEventListener("locais", I),
        legacyTerritoryDetailsEnabled() &&
          It(K.zonas, "zonas", () => !!window.ZONAS),
        Xt === 2 && It(K.t1mun, "t1mun", () => !!window.T1MUN),
        () => {
          (removeEventListener("zonas", I),
            removeEventListener("t1mun", I),
            removeEventListener("locais", I));
        }
      );
    }, []));
  const [, le] = useState(0);
  useRelogioEHistorico({
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
  });
  const be = useMemo(
      () =>
        b(
          Feed.LIVE
            ? r
              ? Feed.peek(null) || wd
              : Ke || Feed.empty()
            : Feed.peek(s),
        ),
      [s, Bt, Ke, r],
    ),
    ot = useRef(null);
  useEffect(
    criarNotificacaoDeApurados({
      r,
      ot,
      be,
      S,
    }),
    [be, r],
  );

  return {
    t,
    e,
    n,
    s,
    a,
    r,
    u,
    i,
    c,
    l,
    d,
    $,
    f,
    m,
    h,
    g,
    v,
    M,
    S,
    x,
    w,
    z,
    gt,
    _,
    j,
    Y,
    E,
    T,
    Ct,
    xt,
    Bt,
    ve,
    Ke,
    we,
    Ae,
    D,
    q,
    le,
    be,
    ot,
  };
}
