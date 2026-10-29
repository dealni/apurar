import { implementar as implementarWo } from "./indicador-partidos-rotulo.js";
import { implementar as implementarKo } from "./indicador-partidos-bloco.js";
import { implementar as implementarDolarc } from "./indicador-partidos-posicao.js";
export let Wo, dc, fc, a1, pc, Ko, $c;
export function initialize() {
  Wo = implementarWo;
  dc = {
    PSTU: 0.51,
    PCO: 0.55,
    PCB: 0.69,
    PSOL: 1.41,
    UP: 1.63,
    PCDOB: 1.78,
    PT: 2.68,
    PSB: 3.59,
    REDE: 3.69,
    PDT: 3.86,
    PV: 4.12,
    SOLIDARIEDADE: 6.01,
    CIDADANIA: 6.17,
    AVANTE: 6.47,
    MDB: 6.5,
    MOBILIZA: 6.74,
    PSDB: 6.76,
    PSD: 6.94,
    DEMOCRATA: 7.29,
    PODE: 7.44,
    PRTB: 7.49,
    AGIR: 7.55,
    PP: 8.15,
    PRD: 8.16,
    DC: 8.21,
    REPUBLICANOS: 8.33,
    UNIÃO: 8.49,
    NOVO: 8.67,
    PL: 8.8,
  };
  fc = {
    PODEMOS: "PODE",
    PROGRESSISTAS: "PP",
    PMB: "DEMOCRATA",
    PMN: "MOBILIZA",
    SD: "SOLIDARIEDADE",
    UNIAO: "UNIÃO",
  };
  a1 = new Set(["PP", "UNIÃO", "PSD", "REPUBLICANOS", "MDB"]);
  pc = "Centrão: PP, União Brasil, PSD, Republicanos e MDB";
  Ko = implementarKo;
  $c = implementarDolarc;
}
