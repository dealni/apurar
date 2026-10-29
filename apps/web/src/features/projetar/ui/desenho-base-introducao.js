import { ge } from "./formatacao-e-acessibilidade-1.js";
import { Ti, Li } from "./mapa-dados-1.js";
import { Qi, tc } from "./mapa-selecao-1.js";
export function aguardarRecorte(contexto) {
  const { Ct, dn, De, ds, focus, town, country, F } = contexto;
  if (
    Ct &&
    !dn.current &&
    !(F && F.focus === focus && F.town === town && F.country === country)
  ) {
    const Rt = De.current;
    if (!Rt || Rt.town !== town) {
      ((De.current = {
        town: town,
        until: performance.now() + 350,
      }),
        setTimeout(() => ds((st) => st + 1), 360));
      return true;
    }
    if (performance.now() < Rt.until) return true;
  }

  return false;
}

export function desenharIntroducao(contexto) {
  const { gn, Ge, Rn, escalaPixels, intro, A, at, O, ft } = contexto;
  if ((O(!1), intro && !ge)) {
    const Rt = gn(4);
    ((Rt.width = A.width),
      (Rt.height = A.height),
      Rt.getContext("2d").drawImage(A, 0, 0));
    const st = escalaPixels * (Ge.ox + Ti * Ge.k),
      Zt = escalaPixels * (Ge.oy + Li * Ge.k),
      Se = Qi * Ge.k * escalaPixels;
    (Rn(!0),
      ft(
        tc,
        (Ft) => {
          const Tt = Math.max(1, Se * (1 - Math.pow(1 - Ft, 3))),
            Wt = Math.min(0.6, (180 * escalaPixels) / Tt);
          (at.setTransform(1, 0, 0, 1, 0, 0),
            at.clearRect(0, 0, A.width, A.height),
            at.drawImage(Rt, 0, 0),
            (at.globalCompositeOperation = "destination-in"));
          const Ut = at.createRadialGradient(st, Zt, 0, st, Zt, Tt);
          (Ut.addColorStop(0, "#000"),
            Ut.addColorStop(1 - Wt, "#000"),
            Ut.addColorStop(1, "rgba(0,0,0,0)"),
            (at.fillStyle = Ut),
            at.fillRect(0, 0, A.width, A.height),
            (at.globalCompositeOperation = "source-over"));
        },
        () => {
          (at.setTransform(1, 0, 0, 1, 0, 0),
            at.clearRect(0, 0, A.width, A.height),
            at.drawImage(Rt, 0, 0),
            setTimeout(() => Rn(!1), 900));
        },
      ));
  }
}
