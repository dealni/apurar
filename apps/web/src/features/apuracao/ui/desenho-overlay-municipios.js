import { Geo } from '../geography.js';
import { tt } from './apuracao-e-votos-1.js';
import { Or } from './mapa-geometria-2.js';
export function desenharMunicipios({
  uo,
  ft,
  O,
  rect,
  xs,
  focus,
  town,
  Qs,
  be,
}) {
  const Zt = uo ? 52 : 46,
    Se = uo ? 62 : 36,
    Ft = (oe) => {
      const nn = Geo.munis[oe].c,
        Ze = ft.ox + nn[0] * ft.k,
        rn = ft.oy + nn[1] * ft.k;
      return (
        Ze > rect.x0 + 8 &&
        Ze < rect.x1 - 60 &&
        rn > rect.y0 + 8 &&
        rn < rect.y1 - 8 &&
        !(Ze < rect.x0 + 48 && rn > rect.y1 - 124)
      );
    },
    Tt = xs
      ? (focus ? Geo.ufs[focus].munis : tt)
          .filter((oe) => oe !== town && Ft(oe))
          .sort((oe, nn) => Geo.munis[nn].pop - Geo.munis[oe].pop)
          .slice(0, 40)
      : [
          ...Or.filter((oe) => Geo.munis[oe].uf === focus),
          ...Geo.ufs[focus].munis
            .slice()
            .sort((oe, nn) => Geo.munis[nn].pop - Geo.munis[oe].pop)
            .slice(0, 4),
        ]
          .filter((oe, nn, Ze) => Ze.indexOf(oe) === nn && oe !== town)
          .slice(0, 4);
  let Wt = 0;
  const Ut =
    town != null
      ? [
          [
            ft.ox + Geo.munis[town].c[0] * ft.k + 60,
            ft.oy + Geo.munis[town].c[1] * ft.k,
            150,
          ],
        ]
      : [];
  ((O.font = '500 11px Apurar Sans, sans-serif'),
    (O.textBaseline = 'middle'),
    (O.lineJoin = 'round'));
  for (const oe of Tt) {
    const nn = Geo.munis[oe],
      Ze = ft.ox + nn.c[0] * ft.k,
      rn = ft.oy + nn.c[1] * ft.k,
      zs = O.measureText(nn.name).width;
    Wt >= 12 ||
      Ut.some(
        (Bs) =>
          Math.abs(Bs[0] - Ze) < (Bs[2] + zs) / 2 + 14 &&
          Math.abs(Bs[1] - rn) < 16,
      ) ||
      Qs.some(
        (Bs) =>
          Ze + 6 + zs > Bs.x - Zt / 2 - 4 &&
          Ze - 6 < Bs.x + Zt / 2 + 4 &&
          Math.abs(Bs.y - rn) < Se / 2 + 9,
      ) ||
      (Ut.push([Ze, rn, zs]),
      Wt++,
      be.current.push({
        i: oe,
        x0: Ze - 6,
        x1: Ze + 10 + zs,
        y0: rn - 9,
        y1: rn + 9,
      }),
      (O.fillStyle = '#FAFAF9'),
      O.beginPath(),
      O.arc(Ze, rn, 2.2, 0, Math.PI * 2),
      O.fill(),
      (O.lineWidth = 3),
      (O.strokeStyle = 'rgba(8,9,10,.85)'),
      O.strokeText(nn.name, Ze + 6, rn),
      (O.fillStyle = 'rgba(208,214,224,.92)'),
      O.fillText(nn.name, Ze + 6, rn));
  }
}
