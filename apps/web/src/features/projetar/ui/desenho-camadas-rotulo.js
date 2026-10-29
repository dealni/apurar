import { StateFlag } from "./state-flag.js";
import { rotuloDeResultado } from "./desenho-camadas-valores.js";
import { html, _t, nt } from "./formatacao-e-acessibilidade-1.js";

import { _eState } from "./mapa-dados-1.js";

import { Ml, Ni } from "./mapa-dados-2.js";

export function desenharRotulo(contexto) {
  const { mode, small, linked, qs, Y, A, F, at, O, ft, se } = contexto;
  const Jt = Ml(F, mode),
    Rt = _eState.value && O ? _eState.value.uf(F) : null,
    st = mode === "pres" && (Y === "mun" || Y === "cand"),
    Zt = !A.side && !!Jt.tex,
    Se = corDoTexto(A.side, Jt, st, O, Zt),
    Ft = !Zt && Se !== "#FAFAF9",
    Tt = fundoDoRotulo(A.side, Jt);

  return html`<button
    class=${"mk " + (A.side ? "box" : "lbl") + (Ft ? " dark" : "") + (Zt ? " cnt" : "") + (linked === A.uf ? " on" : "")}
    key=${A.uf}
    style=${`left:${A.x}px;top:${A.y}px;--bg:${Tt};--fg:${Se};--d:${ft}ms`}
    aria-label=${rotuloDeResultado(F.name, O, Rt, at)}
    ...${se}
  >
    <b><${StateFlag} uf=${A.uf} /></b
    >${porcentagemDoRotulo({ small, O, mode, qs, A, Rt, st, at })}
  </button>`;
}

function corDoTexto(lateral, paleta, presidencial, apurado, textura) {
  if (lateral) return paleta.tex ? "#FAFAF9" : paleta.ink;
  if (presidencial) return apurado ? "#FAFAF9" : paleta.ink;
  return textura ? "#FAFAF9" : paleta.ink;
}

function fundoDoRotulo(lateral, paleta) {
  if (!lateral) return paleta.fill;
  if (paleta.tex === "bands")
    return `linear-gradient(135deg,${paleta.a} 0 50%,${paleta.b} 50% 100%)`;
  if (paleta.tex === "hatch")
    return `repeating-linear-gradient(135deg,rgba(8,9,10,.36) 0 1.2px,transparent 1.2px 5px),${paleta.fill}`;
  return paleta.fill;
}

function porcentagemDoRotulo({ small, O, mode, qs, A, Rt, st, at }) {
  if (
    small ||
    !O ||
    mode === "dep" ||
    (qs && !A.side) ||
    (_eState.value && Rt == null)
  )
    return null;
  return html`<span class="tn"
    >${_eState.value ? Ni(Rt) : html`${!A.side && st ? html`<i style=${"background:" + nt(at)}></i>` : null}${_t(at.share, 0)}%`}</span
  >`;
}
