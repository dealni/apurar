import { implementar as implementarWo } from './indicador-partidos-rotulo.js';
import { implementar as implementarKo } from './indicador-partidos-bloco.js';
import { implementar as implementarDolarc } from './indicador-partidos-posicao.js';
import { implementar as implementarhc } from './indicador-hemiciclo.js';
import { implementar as implementarPl } from './indicador-senado-composicao.js';
export let Wo, dc, fc, a1, pc, Ko, $c, l1, r1, hc, Pl, Rs;
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
    PODEMOS: 'PODE',
    PROGRESSISTAS: 'PP',
    PMB: 'DEMOCRATA',
    PMN: 'MOBILIZA',
    SD: 'SOLIDARIEDADE',
    UNIAO: 'UNIÃO',
  };
  a1 = new Set(['PP', 'UNIÃO', 'PSD', 'REPUBLICANOS', 'MDB']);
  pc = 'Centrão: PP, União Brasil, PSD, Republicanos e MDB';
  Ko = implementarKo;
  $c = implementarDolarc;
  l1 = (() => {
    const t = [
        [0.46, 8],
        [0.568, 11],
        [0.676, 12],
        [0.784, 15],
        [0.892, 16],
        [1, 19],
      ],
      e = [];
    return (
      t.forEach(([n, s]) => {
        for (let a = 0; a < s; a++)
          e.push({
            r: n,
            a: Math.PI * (1 - (a + 0.5) / s),
          });
      }),
      e.sort((n, s) => s.a - n.a || n.r - s.r)
    );
  })();
  r1 = ((t, e, n) => {
    const s = Array.from(
        {
          length: e,
        },
        (i, c) => n + ((1 - n) * c) / (e - 1),
      ),
      a = s.reduce((i, c) => i + c, 0),
      r = s.map((i) => Math.floor((t * i) / a));
    for (
      let i = e - 1, c = t - r.reduce((l, d) => l + d, 0);
      c > 0;
      i = (i - 1 + e) % e, c--
    )
      r[i]++;
    const u = [];
    return (
      s.forEach((i, c) => {
        for (let l = 0; l < r[c]; l++)
          u.push({
            r: i,
            a: Math.PI * (1 - (l + 0.5) / r[c]),
          });
      }),
      u.sort((i, c) => c.a - i.a || i.r - c.r)
    );
  })(513, 13, 0.34);
  hc = implementarhc;
  Pl = implementarPl;
  Rs = {
    data: {},
    at: {},
    subs: new Set(),
  };
}
