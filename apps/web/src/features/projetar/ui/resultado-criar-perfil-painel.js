import { html } from "./formatacao-e-acessibilidade-1.js";
import { xd } from "./estado-e-navegacao-1.js";
export function criarPerfilPainel(contexto) {
  const { prof, modelo, onProfClose } = contexto;
  const Jn = prof
    ? html`<${xd}
        m=${modelo}
        office=${prof.office}
        uf=${prof.uf}
        id=${prof.id}
        onClose=${onProfClose}
        onState=${prof.uf && !prof.back ? onProfClose : null}
        back=${!!prof.back}
      />`
    : null;
  return { Jn };
}
