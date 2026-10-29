export function criarMovimentoDoPonteiro({
  bs,
  mapView,
  Ns,
  jn,
  xa,
  _a,
  _s,
  ys,
  ea,
  ta,
  getFim,
}) {
  return (A) => {
    const F = bs.current;
    if (!F.has(A.pointerId) || mapView.dn.current) return;
    if (A.pointerType !== "touch" && !(A.buttons & 1)) {
      getFim()(A, !0);
      return;
    }
    const at = Ns(A);
    F.set(A.pointerId, at);
    const O = jn.current;
    if (O && F.size >= 2) {
      const [se, Jt] = [...F.values()],
        Rt = xa(
          O.v,
          Math.hypot(se[0] - Jt[0], se[1] - Jt[1]) / O.d,
          O.mx,
          O.my,
        );
      _a(
        Rt === mapView.en
          ? mapView.en
          : _s({
              k: Rt.k,
              ox: Rt.ox + (se[0] + Jt[0]) / 2 - O.mx,
              oy: Rt.oy + (se[1] + Jt[1]) / 2 - O.my,
            }),
      );
      return;
    }
    const ft = ys.current;
    if (ft) {
      if (!ft.on) {
        const se = ea();
        if (
          Math.hypot(at[0] - ft.at[0], at[1] - ft.at[1]) <
            (A.pointerType === "touch" ? 12 : 5) ||
          (!ta && se.k <= mapView.en.k * 1.002)
        )
          return;
        ((ft.v = se), (ft.on = !0));
        try {
          mapView.Bt.current.setPointerCapture(A.pointerId);
        } catch {
          /* Fallback opcional preservado da captura; a interface continua disponível. */
        }
      }
      _a(
        _s({
          k: ft.v.k,
          ox: ft.v.ox + at[0] - ft.at[0],
          oy: ft.v.oy + at[1] - ft.at[1],
        }),
      );
    }
  };
}
