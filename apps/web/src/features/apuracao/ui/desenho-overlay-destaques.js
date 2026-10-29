import { Tr } from './mapa-geometria-1.js';
export function desenharDestaques({ Jt, O, escalaPixels, ft, bairro, He, de }) {
  const Zt = Jt.geo,
    Se = (Ft, Tt, Wt) => {
      const Ut = Zt.pts[Ft];
      Ut &&
        (O.save(),
        O.setTransform(escalaPixels, 0, 0, escalaPixels, 0, 0),
        (O.strokeStyle = Wt),
        (O.lineWidth = Tt),
        O.beginPath(),
        O.arc(
          ft.ox + Ut[0] * ft.k,
          ft.oy + Ut[1] * ft.k,
          Tr(Zt, Jt, Ft, ft.k) * ft.k + 2,
          0,
          6.2832,
        ),
        O.stroke(),
        O.restore());
    };
  if (bairro != null)
    for (const Ft of Zt.order)
      Jt.b[Ft] === bairro && Se(Ft, 1.2, 'rgba(208,214,224,.7)');
  if (He != null && He !== bairro)
    for (const Ft of Zt.order)
      Jt.b[Ft] === He && Se(Ft, 1, 'rgba(208,214,224,.45)');
  if (Jt.div) {
    O.lineJoin = 'round';
    for (const [Ft, Tt, Wt] of [
      [bairro, 2, '#FAFAF9'],
      [He, 1.5, 'rgba(208,214,224,.7)'],
    ])
      Ft != null &&
        Jt.div.paths[Ft] &&
        ((O.strokeStyle = Wt),
        (O.lineWidth = Tt / ft.k),
        O.stroke(Jt.div.paths[Ft]));
  }
  de != null && Se(de, 2, '#FAFAF9');
}
