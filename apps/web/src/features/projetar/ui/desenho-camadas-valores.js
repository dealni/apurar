import { html, yt, _t } from "./formatacao-e-acessibilidade-1.js";
import { _eState } from "./mapa-dados-1.js";
import { Ni } from "./mapa-dados-2.js";

export function rotuloDeResultado(nome, apurado, valor, candidato) {
  if (!apurado || (_eState.value && valor == null)) return `${nome}, sem dados`;
  if (_eState.value) return `${nome}, ${_eState.value.say(valor)}`;
  return `${nome}, ${yt(candidato)} ${_t(candidato.share)}%`;
}

export function porcentagemExterior(small, apurado, valor, candidato) {
  if (small || !apurado || (_eState.value && valor == null)) return null;
  return html`<span class="tn"
    >${_eState.value ? Ni(valor) : _t(candidato.share, 0) + "%"}</span
  >`;
}
