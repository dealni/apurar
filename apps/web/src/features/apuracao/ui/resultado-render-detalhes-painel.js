import { html } from './formatacao-e-acessibilidade-1.js';
import { ql } from './resultados-municipais-1.js';
import { Zs, Wl } from './navegacao-e-patrocinio-1.js';
import { Ol } from './deputados-2.js';
import { Nl } from './resultados-estaduais-1.js';
import { Ur } from './regioes-1.js';
import { Tc } from './atualizacoes-1.js';
export function renderDetalhesPainel(contexto) {
  const {
    Jn,
    Rn,
    office,
    focus,
    close,
    town,
    modelo,
    toState,
    spot,
    tv,
    jn,
    ks,
    is,
    Es,
    co,
    step,
    Qe,
    tempo,
    pickTown,
  } = contexto;
  const Qr =
    Jn ||
    Rn({}) ||
    (office === 'dep' && focus
      ? html`<${Ol} uf=${focus} onClose=${close} />`
      : town != null
        ? html`<${ql}
            office=${office}
            m=${modelo}
            i=${town}
            onClose=${close}
            onState=${toState}
            spot=${spot}
            tv=${tv}
            zone=${jn}
            onZone=${ks}
            bairro=${is}
            onBairro=${Es}
            zlink=${co}
          />`
        : focus
          ? html`<${Nl}
              m=${modelo}
              uf=${focus}
              office=${office}
              tv=${tv}
              onClose=${close}
              onStep=${step}
              spot=${spot}
            />`
          : html`${office === 'pres' ? html`<${Ur} m=${modelo} key="reg" onAbroad=${Qe ? () => Qe.go('pres', 'ZZ') : null} onState=${Qe ? (Ce) => Qe.go('pres', Ce) : null} />` : null}${tv ? null : html`<${Tc} t=${tempo} link=${Qe} m=${modelo} onTown=${pickTown} key="feed" />`}`);
  const nr = tv ? Zs + Wl + 12 : Zs;
  return {
    Qr,
    nr,
  };
}
