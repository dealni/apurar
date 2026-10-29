import { zt } from './municipios-e-distritos-2.js';
import { Geo } from '../geography.js';
import { Ad, Bc } from './estado-e-navegacao-1.js';
import { lt, Xt } from './formatacao-e-acessibilidade-1.js';
import { Feed } from '../feed.js';
export function criarNavegacaoPorHash({ $, Xe }) {
  return (I, K, te = null, ne = $, Je = null, gn = Xe, Qe = null) => {
    const js =
      K === 'ZZ'
        ? te != null
          ? '-' + zt.cities[te].cd
          : Je
            ? '-' + Je.toLowerCase()
            : ''
        : te != null
          ? '-' + Geo.munis[te].id + (Qe && I === 'pres' ? '-z' + Qe : '')
          : '';
    location.hash =
      Ad[I] +
      (K ? '-' + K.toLowerCase() : '') +
      js +
      (I !== 'pres'
        ? ''
        : ne === 'cand'
          ? '~c' + +lt[gn].n
          : Bc[ne]
            ? '~' + Bc[ne]
            : '') +
      (Xt === 2 && !Feed.LIVE ? '~2t' : '');
  };
}
