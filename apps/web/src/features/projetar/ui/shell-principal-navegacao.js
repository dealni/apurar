import { criarNavegacaoPorHash } from "./tela-navegar-hash.js";
import { zt } from "./municipios-e-distritos-2.js";
import { Cs } from "./apuracao-e-votos-1.js";
import { useState, useRef } from "./formatacao-e-acessibilidade-1.js";
import { Yo, Hc, Qa } from "./estado-e-navegacao-1.js";

export function useNavegacaoECamera({ m, be, $, f, h, i, g }) {
  const Xe = m != null ? m : be.pres[0].k,
    De = criarNavegacaoPorHash({
      $,
      Xe,
    }),
    xo = (I) => {
      (f(I),
        I === "cand" && h(Xe),
        De(i.office, i.focus, i.town, I, i.country, Xe, i.zone));
    },
    ds = (I) => {
      (h(I),
        f("cand"),
        De(i.office, i.focus, i.town, "cand", i.country, I, i.zone));
    },
    Ro = (I) => De(i.office, i.focus, i.town, $, i.country, Xe, I),
    go = (I) => {
      if (I !== "pres" && I !== "gov") return;
      if (I !== "pres" && i.focus === "ZZ") De(I, null);
      else De(I, i.focus, i.town, $, i.country);
    },
    bo = (I) => {
      g || De("pres", "ZZ", I === i.town && i.focus === "ZZ" ? null : I);
    },
    Jn = (I) => {
      g || De("pres", "ZZ", null, $, I);
    },
    lo = () => {
      g || De("pres", "ZZ");
    },
    ms = () => {
      const I = i.town != null && zt.cities[i.town],
        K = I && Cs(I.iso);
      De("pres", "ZZ", null, $, K && K.cities.length > 1 ? K.iso : null);
    },
    [Ds, yo] = useState(() => Yo.at || Hc(Qa())),
    [as, ro] = useState(null),
    [Qo, Mt] = useState(!1),
    de = useRef(new Set()),
    Ye = useRef(null),
    [He, zn] = useState(() => {
      try {
        return localStorage.getItem("apuracao-camera") === "1";
      } catch {
        return !1;
      }
    }),
    on = () =>
      zn((I) => {
        try {
          localStorage.setItem("apuracao-camera", I ? "0" : "1");
        } catch {
          /* Fallback opcional preservado da captura; a interface continua disponível. */
        }
        return !I;
      });

  return {
    Xe,
    De,
    xo,
    ds,
    Ro,
    go,
    bo,
    Jn,
    lo,
    ms,
    Ds,
    yo,
    as,
    ro,
    Qo,
    Mt,
    de,
    Ye,
    He,
    zn,
    on,
  };
}
