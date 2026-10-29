import { governorMarker } from "./official-map-presentation.js";
import { desenharExterior } from "./desenho-camadas-exterior.js";
import { desenharRostos } from "./desenho-camadas-rostos.js";
import { desenharRotulo } from "./desenho-camadas-rotulo.js";
import { html } from "./formatacao-e-acessibilidade-1.js";

import { ec } from "./mapa-selecao-1.js";
import { _nState } from "./mapa-dados-1.js";
import { Kn, Ks } from "./apuracao-e-votos-1.js";

export function desenharMarcas(contexto) {
  const {
    fs,
    er,
    Gn,
    Eo,
    Js,
    lo,
    on,
    ls,
    yn,
    larguraCanvas,
    alturaCanvas,
    small,
    linked,
    flow,
    qs,
    Qs,
    pa,
    sr,
  } = contexto;
  return html` <div
    ref=${fs}
    class=${"marks" + (small || qs ? " tight" : "") + (flow && !Js ? " pany" : "") + (ls ? " moving" : "") + (yn ? " pop" : "")}
    onPointerDown=${er}
    onPointerMove=${Gn}
    onPointerUp=${Eo}
    onPointerCancel=${Eo}
  >
    <svg
      class="leaders"
      width=${larguraCanvas}
      height=${alturaCanvas}
      aria-hidden="true"
    >
      ${Qs.filter((A) => A.side && !A.ext).map((A) => html`<line key=${A.uf} x1=${A.ax} y1=${A.ay} x2=${A.x - 3} y2=${A.y} class=${(lo || linked) === A.uf ? "on" : ""} style=${yn ? `--d:${ec(Math.hypot(A.x - pa, A.y - sr), on.k)}ms` : null} />`)}
    </svg>
    ${Qs.map((A) => desenharMarca(A, contexto))}
  </div>`;
}

function desenharMarca(A, contexto) {
  const { modelo, mode, yn, pa, sr, on, tv, eo, onPick, ms, Jn, uo } = contexto;
  const F = modelo.ufs[A.uf],
    at = _nState.value ? _nState.value.ofUF(F) : Kn(F, mode)[0],
    O = F.pst > 0 && Ks(F, mode),
    ft = yn ? ec(Math.hypot(A.x - pa, A.y - sr), on.k) : 0,
    se = {
      "data-uf": A.uf,
      tabIndex: tv ? -1 : null,
      onClick: tv
        ? null
        : () => {
            if (eo.current) {
              eo.current = !1;
              return;
            }
            onPick(A.uf);
          },
      onMouseEnter: tv
        ? null
        : () => {
            (ms(A.uf),
              Jn({
                uf: A.uf,
                x: A.x,
                y: A.y,
                side: !!A.side,
              }));
          },
      onMouseLeave: () => {
        (ms(null), Jn(null));
      },
      onFocus: tv
        ? null
        : () => {
            (ms(A.uf),
              Jn({
                uf: A.uf,
                x: A.x,
                y: A.y,
                side: !!A.side,
              }));
          },
      onBlur: () => {
        (ms(null), Jn(null));
      },
    };

  const dados = { ...contexto, A, F, at, O, ft, se };
  if (mode === "gov" && modelo.governor) return governorMarker(dados);
  if (A.ext) return desenharExterior(dados);
  if (uo) return desenharRostos(dados);
  return desenharRotulo(dados);
}
