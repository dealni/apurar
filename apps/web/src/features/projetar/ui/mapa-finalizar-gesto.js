export function criarFimDeGesto({ interaction }) {
  const { bs, ys, jn, eo, Ns, Zo } = interaction;
  return (A, F) => {
    const at = bs.current;
    if (!at.delete(A.pointerId)) return;
    const O = ys.current,
      ft = O && !O.on && Ns(A),
      se =
        !!ft &&
        A.pointerType !== "touch" &&
        Math.hypot(ft[0] - O.at[0], ft[1] - O.at[1]) >= 5,
      Jt = jn.current ? at.size < 2 : !!(O && O.on);
    if (jn.current)
      if (at.size < 2) jn.current = null;
      else return;
    ((ys.current = null),
      (Jt || se) &&
        (F !== !0 &&
          ((eo.current = !0),
          setTimeout(() => {
            eo.current = !1;
          }, 320)),
        Jt && Zo()));
  };
}
