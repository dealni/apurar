import { interpolarModelo } from "./desenho-base-interpolacao.js";
import { Fo } from "./mapa-geometria-2.js";
import { ge, Dt } from "./formatacao-e-acessibilidade-1.js";
import { _eState } from "./mapa-dados-1.js";
import { qn, hu } from "./contagem-e-animacao-1.js";
import { tt } from "./apuracao-e-votos-1.js";
import { Geo } from "../geography.js";
import { Bi, Ki } from "./mapa-geometria-1.js";
export function atualizarMunicipios(contexto) {
  const {
    Ce,
    Y,
    gs,
    Ws,
    _o,
    q,
    sn,
    Ge,
    modelo,
    mode,
    focus,
    larguraCanvas,
    alturaCanvas,
    escalaPixels,
    A,
    at,
    O,
  } = contexto;
  const Rt = sn.current,
    st = qn.on ? Ws() : 0,
    Zt = permiteAnimacaoMunicipal({ ...contexto, anterior: Rt })
      ? tt
          .filter(
            (Ft) =>
              Dt(Rt, Ft) <= 0 &&
              Dt(modelo, Ft) > 0 &&
              (!focus || Geo.munis[Ft].uf === focus),
          )
          .sort(hu("first"))
      : [],
    Se = new Map(Zt.map((Ft, Tt) => [Ft, (st * (Tt + 0.5)) / Zt.length]));
  if ((_o(st, Se), Zt.length)) {
    (Ce(),
      Fo(
        A,
        larguraCanvas,
        alturaCanvas,
        escalaPixels,
        Ge,
        modelo,
        mode,
        Y,
        focus,
        {
          hmax: gs,
          hold: Se,
        },
      ));
    const Ft = Ge,
      Tt = new DOMMatrix([
        1 / (escalaPixels * Ft.k),
        0,
        0,
        1 / (escalaPixels * Ft.k),
        0,
        0,
      ]),
      Wt = performance.now();
    let Ut = 0;
    const oe = (nn) => {
      for (
        at.setTransform(escalaPixels, 0, 0, escalaPixels, 0, 0),
          at.save(),
          at.translate(Ft.ox, Ft.oy),
          at.scale(Ft.k, Ft.k),
          at.lineWidth = 0.5 / Ft.k,
          at.strokeStyle = "rgba(8,9,10,.3)";
        Ut < Zt.length && Se.get(Zt[Ut]) <= nn - Wt;
        Ut++
      ) {
        const Ze = Zt[Ut],
          rn = Geo.munis[Ze].path;
        if (
          ((at.fillStyle = Bi(modelo, Ze)),
          at.fill(rn),
          focus && Dt(modelo, Ze) < 1)
        ) {
          const zs = Ki(at, escalaPixels);
          (zs.setTransform(Tt), (at.fillStyle = zs), at.fill(rn));
        }
        at.stroke(rn);
      }
      (at.restore(),
        Ut < Zt.length ? (q.current = requestAnimationFrame(oe)) : O(!1));
    };
    q.current = requestAnimationFrame(oe);
    return;
  }

  if (interpolarModelo(contexto)) return;
  O(!0);
}

export function permiteAnimacaoMunicipal(contexto) {
  const { Y, cn, mode, focus, town } = contexto;
  return (
    contexto.anterior &&
    qn.on &&
    !ge &&
    !cn &&
    mode === "pres" &&
    (Y === "mun" || Y === "cand" || _eState.value || focus) &&
    town == null
  );
}
