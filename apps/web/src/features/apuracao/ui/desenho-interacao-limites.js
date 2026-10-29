import { ie } from './formatacao-e-acessibilidade-1.js';
import { zt } from './municipios-e-distritos-2.js';
import { Na, ga, bl } from './mapa-dados-1.js';
import { Streets } from '../streets.js';
import { criarCalculoDeZoom } from './mapa-calcular-zoom.js';
export function criarLimitesDoMapa({ focus, town, rect, mapView }) {
  const Es = focus === 'ZZ' && !!zt,
    cs = Es ? zt.box : Na,
    no = (rect.x0 + rect.x1) / 2,
    ko = (rect.y0 + rect.y1) / 2,
    Zn = Math.max(
      mapView.en.k * 6,
      mapView.Ss ? mapView.Ss.k * 6 : 0,
      ga(Es ? bl('ZZ') : Na, rect, mapView.Bn).k * 40,
      Streets && mapView.T && town != null ? Streets.kAt(town, 16.5) : 0,
    ),
    ta = town != null || !!focus,
    Dn = ga(Es ? bl('ZZ') : Na, rect, mapView.Bn).k,
    Gs = ta ? Math.min(mapView.en.k, Dn) : mapView.en.k,
    ws = (A) =>
      Math.abs(A.k - mapView.en.k) <= mapView.en.k * 0.002 &&
      Math.abs(A.ox - mapView.en.ox) < 0.5 &&
      Math.abs(A.oy - mapView.en.oy) < 0.5,
    _s = (A) => {
      const F = ie(A.k, Gs, Zn);
      if (
        ws({
          k: F,
          ox: A.ox,
          oy: A.oy,
        })
      )
        return mapView.en;
      const at = ie((no - A.ox) / F, cs[0], cs[2]),
        O = ie((ko - A.oy) / F, cs[1], cs[3]);
      return {
        k: F,
        ox: no - at * F,
        oy: ko - O * F,
      };
    },
    xa = criarCalculoDeZoom({
      interaction: {
        Gs,
        Zn,
        _s,
      },
      mapView,
      l: rect,
    });
  return {
    Es,
    cs,
    no,
    ko,
    Zn,
    ta,
    Dn,
    Gs,
    ws,
    _s,
    xa,
  };
}
