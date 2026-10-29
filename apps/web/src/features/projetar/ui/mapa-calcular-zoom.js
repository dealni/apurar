import { ie } from "./formatacao-e-acessibilidade-1.js";
export function criarCalculoDeZoom({ interaction, mapView, l }) {
  const { Zn, Gs, _s } = interaction;
  return (A, F, at, O) => {
    const ft = ie(A.k * F, Gs, Zn),
      se = ft / A.k;
    if (se === 1) return _s(A);
    let Jt = at - (at - A.ox) * se,
      Rt = O - (O - A.oy) * se;
    if (se < 1 && A.k > mapView.en.k * 1.002 && ft <= mapView.en.k * 1.002) {
      const st = mapView.en.k / A.k,
        Zt = at - (at - A.ox) * st,
        Se = O - (O - A.oy) * st;
      return Math.abs(Zt - mapView.en.ox) < (l.x1 - l.x0) * 0.2 &&
        Math.abs(Se - mapView.en.oy) < (l.y1 - l.y0) * 0.2
        ? mapView.en
        : _s({
            k: mapView.en.k,
            ox: Zt,
            oy: Se,
          });
    }
    return _s({
      k: ft,
      ox: Jt,
      oy: Rt,
    });
  };
}
