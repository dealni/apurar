import { limitesDosPulsos } from './desenho-limites.js';
import { Xu } from './mapa-selecao-1.js';
export function criarAnimacaoDePulsos({ mapView, props }) {
  const { we, W, ze } = mapView;
  const { cw: larguraCanvas, ch: alturaCanvas, s: escalaPixels } = props;
  return () => {
    cancelAnimationFrame(ze.current);
    const A = we.current;
    if (!A) return;
    const F = Math.min(escalaPixels, 1.25),
      at = Math.round(larguraCanvas * F),
      O = Math.round(alturaCanvas * F);
    (A.width !== at && (A.width = at), A.height !== O && (A.height = O));
    const ft = A.getContext('2d');
    if (!ft) return;
    let se = 0,
      Jt = null;
    const Rt = (st) => {
      if (st - se < 30) {
        ze.current = requestAnimationFrame(Rt);
        return;
      }
      ((se = st),
        ft.setTransform(1, 0, 0, 1, 0, 0),
        (W.current = W.current.filter((Tt) => st - Tt.t0 < 1900)));
      const Se = limitesDosPulsos(W.current),
        Ft =
          Jt && Se
            ? [
                Math.min(Jt[0], Se[0]),
                Math.min(Jt[1], Se[1]),
                Math.max(Jt[2], Se[2]),
                Math.max(Jt[3], Se[3]),
              ]
            : Jt || Se;
      (Ft &&
        ft.clearRect(
          Math.floor(Ft[0] * F),
          Math.floor(Ft[1] * F),
          Math.ceil((Ft[2] - Ft[0]) * F) + 1,
          Math.ceil((Ft[3] - Ft[1]) * F) + 1,
        ),
        (Jt = Se),
        ft.setTransform(F, 0, 0, F, 0, 0),
        (ft.globalCompositeOperation = 'lighter'));
      for (const Tt of W.current) {
        const Wt = st - Tt.t0;
        if (Wt < 0) continue;
        const Ut = Wt < 160 ? Wt / 160 : Math.exp(-(Wt - 160) / 500),
          oe = Tt.r * (0.65 + 0.55 * Math.min(1, Wt / 700));
        ((ft.globalAlpha = Math.min(0.8, Ut * Tt.a)),
          ft.drawImage(Xu(Tt.col), Tt.x - oe, Tt.y - oe, 2 * oe, 2 * oe));
      }
      ((ft.globalAlpha = 1),
        (ft.globalCompositeOperation = 'source-over'),
        W.current.length && (ze.current = requestAnimationFrame(Rt)));
    };
    ze.current = requestAnimationFrame(Rt);
  };
}
