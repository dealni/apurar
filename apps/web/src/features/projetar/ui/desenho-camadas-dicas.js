import { html } from "./formatacao-e-acessibilidade-1.js";

import { _nState, _eState } from "./mapa-dados-1.js";

import { t1 } from "./mapa-dicas-e-legenda-1.js";

export function desenharDicas(contexto) {
  const { ye, bo, modelo, mode, rect, small, sl } = contexto;
  return small
    ? null
    : html`<${t1}
        tip=${bo}
        m=${modelo}
        mode=${mode}
        town=${sl}
        rect=${rect}
        padR=${ye}
        cand=${_nState.value ? _nState.value.k : null}
        val=${_eState.value}
      />`;
}
