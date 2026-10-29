export function desenharBairros({ O, rect, Jt, bairro, small, ft, ot, He }) {
  ((O.font = "500 11px Apurar Sans, sans-serif"),
    (O.textAlign = "center"),
    (O.textBaseline = "middle"),
    (O.lineJoin = "round"));
  const Zt = [],
    Se = (Ut) =>
      Ut[0] >= rect.x0 + 40 &&
      Ut[0] <= rect.x1 - 40 &&
      Ut[1] >= rect.y0 + 8 &&
      Ut[1] <= rect.y1 - 8,
    Ft = Jt.bairros
      .map((Ut, oe) => oe)
      .sort((Ut, oe) => (Ut === bairro ? -1 : oe === bairro ? 1 : Ut - oe)),
    Tt = Jt.tw || (Jt.tw = new Map()),
    Wt = (Ut) => {
      let oe = Tt.get(Ut);
      return (
        oe == null && ((oe = O.measureText(Ut).width), Tt.set(Ut, oe)),
        oe
      );
    };
  for (const Ut of Ft) {
    const oe = Jt.geo.bc[Ut];
    if (!oe) continue;
    const nn = ft.ox + oe[0] * ft.k,
      Ze = ft.oy + oe[1] * ft.k,
      rn = Jt.bairros[Ut];
    if (Zt.length >= (small ? 12 : 28)) break;
    if (!Se([nn, Ze])) continue;
    const zs = Wt(rn);
    Zt.some(
      (Bs) =>
        Math.abs(Bs[0] - nn) < (Bs[2] + zs) / 2 + 8 &&
        Math.abs(Bs[1] - Ze) < 15,
    ) ||
      (Zt.push([nn, Ze, zs]),
      ot.current.push({
        b: Ut,
        x0: nn - zs / 2 - 4,
        x1: nn + zs / 2 + 4,
        y0: Ze - 9,
        y1: Ze + 9,
      }),
      (O.lineWidth = 3),
      (O.strokeStyle = "rgba(8,9,10,.82)"),
      O.strokeText(rn, nn, Ze),
      (O.fillStyle =
        Ut === bairro || Ut === He ? "#FAFAF9" : "rgba(208,214,224,.86)"),
      O.fillText(rn, nn, Ze),
      Ut === He && O.fillRect(nn - zs / 2, Ze + 7, zs, 1));
  }
  O.textAlign = "start";
}
