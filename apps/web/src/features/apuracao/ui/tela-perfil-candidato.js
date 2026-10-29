import { Ra } from './candidatos-e-partidos-1.js';
import { Ed } from './estado-e-navegacao-1.js';
import { lt } from './formatacao-e-acessibilidade-1.js';
export function configurarPerfilDoCandidato({
  g,
  Rn,
  yn,
  vs,
  xs,
  $,
  Xe,
  h,
  f,
  De,
  io,
}) {
  Ra.open = g
    ? null
    : (I) => {
        const K = Ed.get(I.id);
        if (K) {
          if (K.office === 'pres' && !Rn && yn === 'pres') {
            const te = lt.findIndex((ne) => ne.id === I.id);
            (vs({
              office: 'pres',
              uf: null,
              id: I.id,
              at: 'pres',
              back: !0,
              lv0: xs && xs.lv0 ? xs.lv0 : $,
              c0: Xe,
            }),
              te >= 0 &&
                (h(te), f('cand'), De('pres', null, null, 'cand', null, te)));
            return;
          }
          vs({
            office: K.office,
            uf: K.office === 'pres' ? (Rn && Rn !== 'ZZ' ? Rn : null) : K.uf,
            id: I.id,
            at: io,
            back: !0,
          });
        }
      };
}
