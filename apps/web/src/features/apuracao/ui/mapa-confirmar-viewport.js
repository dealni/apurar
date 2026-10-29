export function criarConfirmacaoDeViewport({ interaction, mapView }) {
  const { pn, ks, is, ws } = interaction;
  return () => {
    clearTimeout(ks.current);
    const A = pn.current;
    if (!A) return;
    pn.current = null;
    const F = A === mapView.en || ws(A),
      at = F
        ? mapView.Ss
          ? {
              key: mapView.fn,
              v: mapView.en,
            }
          : null
        : {
            key: mapView.fn,
            v: A,
          },
      O = at ? at.v : mapView.en;
    (mapView.D.current &&
      mapView.D.current.vkey === O.k + ',' + O.ox + ',' + O.oy &&
      (is(), mapView.On(!1)),
      mapView.io(at));
  };
}
