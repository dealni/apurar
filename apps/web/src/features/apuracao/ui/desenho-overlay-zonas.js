export function desenharZonas({ O, ft, rect, se }) {
  ((O.font = '600 11px Apurar Sans, sans-serif'),
    (O.textAlign = 'center'),
    (O.textBaseline = 'middle'),
    (O.lineJoin = 'round'));
  const Zt = [],
    Se = (Tt) => [ft.ox + Tt[0] * ft.k, ft.oy + Tt[1] * ft.k],
    Ft = (Tt) =>
      Tt[0] >= rect.x0 + 6 &&
      Tt[0] <= rect.x1 - 6 &&
      Tt[1] >= rect.y0 + 6 &&
      Tt[1] <= rect.y1 - 6;
  for (const Tt of se.z
    .map((Wt, Ut) => Ut)
    .filter((Wt) => se.has[Wt])
    .sort((Wt, Ut) => se.el[Ut] - se.el[Wt])) {
    const Wt = Ft(Se(se.c[Tt])) ? Se(se.c[Tt]) : Se(se.p[Tt]),
      Ut = Wt[0],
      oe = Wt[1],
      nn = O.measureText(String(se.z[Tt])).width;
    !Ft(Wt) ||
      Zt.some(
        (Ze) =>
          Math.abs(Ze[0] - Ut) < (Ze[2] + nn) / 2 + 6 &&
          Math.abs(Ze[1] - oe) < 13,
      ) ||
      (Zt.push([Ut, oe, nn]),
      (O.lineWidth = 3),
      (O.strokeStyle = 'rgba(8,9,10,.78)'),
      O.strokeText(se.z[Tt], Ut, oe),
      (O.fillStyle = 'rgba(208,214,224,.95)'),
      O.fillText(se.z[Tt], Ut, oe));
  }
  O.textAlign = 'start';
}
