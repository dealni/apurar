import { zt } from './municipios-e-distritos-2.js';
import { Rr } from './mapa-geometria-2.js';
import { Sl } from './mapa-selecao-1.js';
export function desenharExterior({
  country,
  town,
  ft,
  O,
  larguraCanvas,
  Xe,
  as,
}) {
  const Zt = country && zt.countries.find((Tt) => Tt.iso === country),
    Se = (
      Zt
        ? Zt.cities
            .slice()
            .sort((Tt, Wt) => zt.cities[Wt].el - zt.cities[Tt].el)
        : Rr
    )
      .filter((Tt) => Tt !== town)
      .slice(0, Zt ? 6 : 10),
    Ft =
      town != null
        ? [
            [
              ft.ox + zt.cities[town].c[0] * ft.k + 60,
              ft.oy + zt.cities[town].c[1] * ft.k,
              150,
            ],
          ]
        : [];
  ((O.font = '500 11px Apurar Sans, sans-serif'),
    (O.textBaseline = 'middle'),
    (O.lineJoin = 'round'));
  for (const Tt of Se) {
    const Wt = zt.cities[Tt],
      Ut = Sl(Tt, Xe.current.zk) + 5,
      oe = ft.ox + Wt.c[0] * ft.k + Ut,
      nn = ft.oy + Wt.c[1] * ft.k,
      Ze = O.measureText(Wt.name).width;
    oe + Ze > larguraCanvas - 8 ||
      Ft.some(
        (rn) =>
          Math.abs(rn[0] - (oe + Ze / 2)) < (rn[2] + Ze) / 2 + 10 &&
          Math.abs(rn[1] - nn) < 15,
      ) ||
      (Ft.push([oe + Ze / 2, nn, Ze]),
      (O.lineWidth = 3),
      (O.strokeStyle = 'rgba(8,9,10,.85)'),
      O.strokeText(Wt.name, oe, nn),
      (O.fillStyle = 'rgba(208,214,224,.92)'),
      O.fillText(Wt.name, oe, nn));
  }
  if (as != null && as !== town) {
    const Tt = zt.cities[as];
    (O.beginPath(),
      O.arc(
        ft.ox + Tt.c[0] * ft.k,
        ft.oy + Tt.c[1] * ft.k,
        Sl(as, Xe.current.zk) + 3.5,
        0,
        Math.PI * 2,
      ),
      (O.lineWidth = 1.6),
      (O.strokeStyle = '#FAFAF9'),
      O.stroke());
  }
}
