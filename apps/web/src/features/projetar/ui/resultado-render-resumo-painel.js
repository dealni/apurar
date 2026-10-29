import { html, Xt } from "./formatacao-e-acessibilidade-1.js";
import { N1 } from "./resultados-municipais-2.js";
import { Ka } from "./regioes-1.js";
import { _i } from "./paineis-e-projecoes-2.js";
import { Zl } from "./projecoes-graficos-2.js";
import { Rl } from "./historico-e-graficos-1.js";
import { yr } from "./paineis-e-projecoes-1.js";
export function renderResumoPainel(contexto) {
  const {
    office,
    Zo,
    modelo,
    tempo,
    Eo,
    Qe,
    setOffice,
    pickTown,
    tv,
    spot,
    pick,
  } = contexto;
  const Jr =
    office === "pres"
      ? Zo && Xt === 2
        ? html`<${_i}
            m=${modelo}
            t=${tempo}
            h=${Eo}
            link=${Qe}
            onNext=${setOffice}
            onTown=${pickTown}
            fore=${Ka(modelo, tv)}
            key="nat"
          />`
        : html`<${yr}
              m=${modelo}
              spot=${spot}
              key="hero"
              tv=${tv}
              onNext=${tv ? null : setOffice}
              slim=${Zo}
            />${Eo !== "short" && Eo !== "tiny" ? (Ka(modelo, tv) ? html`<${Zl} m=${modelo} key="fc" />` : html`<${Rl} m=${modelo} key="trend" />`) : null}`
      : office === "gov"
        ? html`<${N1} m=${modelo} onPick=${pick} link=${Qe} key="gov" />`
        : null;
  return {
    Jr,
  };
}
