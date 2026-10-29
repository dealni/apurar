import { Fo } from './mapa-geometria-2.js';
import { ge } from './formatacao-e-acessibilidade-1.js';
import { Yi } from './mapa-selecao-1.js';
import { qn, mu } from './contagem-e-animacao-1.js';
import { zt } from './municipios-e-distritos-2.js';
import { Nn, bn } from './apuracao-e-votos-1.js';
export function atualizarExterior(contexto) {
  const {
    Ce,
    Y,
    I,
    Ws,
    wo,
    q,
    sn,
    Ge,
    modelo,
    mode,
    focus,
    town,
    country,
    larguraCanvas,
    alturaCanvas,
    escalaPixels,
    A,
    at,
    O,
  } = contexto;
  const Rt = sn.current,
    st = qn.on ? Ws() : 0,
    Zt =
      Rt && qn.on && !ge
        ? Nn.filter((Ut) => bn(Rt, Ut) <= 0 && bn(modelo, Ut) > 0).sort(mu)
        : [],
    Se = new Map(Zt.map((Ut, oe) => [Ut, (st * (oe + 0.5)) / Zt.length]));
  if ((wo(st, Se), !Zt.length)) {
    O(!0);
    return;
  }
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
        zk: I,
        country: country,
        town: town,
        holdX: Se,
      },
    ));
  const Ft = performance.now();
  let Tt = 0;
  const Wt = (Ut) => {
    for (
      at.setTransform(escalaPixels, 0, 0, escalaPixels, 0, 0);
      Tt < Zt.length && Se.get(Zt[Tt]) <= Ut - Ft;
      Tt++
    ) {
      const oe = Zt[Tt];
      Yi(
        at,
        Ge,
        modelo,
        oe,
        I,
        !1,
        !!country && zt.cities[oe].iso !== country,
        town === oe,
      );
    }
    Tt < Zt.length ? (q.current = requestAnimationFrame(Wt)) : O(!1);
  };
  q.current = requestAnimationFrame(Wt);
}
