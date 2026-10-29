export function criarInicioDeGesto({ interaction, v, mapView }) {
  const { Qe, bs, ys, jn, eo, Ns, ea } = interaction;
  return (A) => {
    if (
      ((Qe.current = A.pointerType), v || A.button > 0 || !mapView.Ae.current)
    )
      return;
    const F = bs.current;
    if ((F.set(A.pointerId, Ns(A)), F.size === 2)) {
      const [at, O] = [...F.values()];
      ((jn.current = {
        d: Math.hypot(at[0] - O[0], at[1] - O[1]) || 1,
        mx: (at[0] + O[0]) / 2,
        my: (at[1] + O[1]) / 2,
        v: ea(),
      }),
        (ys.current = null));
    } else
      F.size === 1 &&
        ((eo.current = !1),
        (ys.current = {
          at: F.get(A.pointerId),
          v: ea(),
          on: !1,
        }));
  };
}
