import { stateFlags } from "../../../runtime/state-flags";
import { html, Te } from "./formatacao-e-acessibilidade-1.js";

export function StateFlag({ uf }) {
  const src = stateFlags[uf];
  return src
    ? html`<img class="state-flag" src=${src} data-uf=${uf} alt=${"Bandeira de " + (Te[uf] || uf)} width="24" height="16" decoding="async" />`
    : html`<span>${uf}</span>`;
}
