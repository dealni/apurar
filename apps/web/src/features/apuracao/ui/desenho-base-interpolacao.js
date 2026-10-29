import { Fo } from './mapa-geometria-2.js';
import { ge, Z } from './formatacao-e-acessibilidade-1.js';
import { Dr } from './mapa-selecao-1.js';
import { qn } from './contagem-e-animacao-1.js';
export function interpolarModelo(contexto) {
  const {
    Y,
    gs,
    gn,
    ke,
    In,
    cn,
    Ge,
    modelo,
    mode,
    focus,
    town,
    larguraCanvas,
    alturaCanvas,
    escalaPixels,
    A,
    O,
    ft,
  } = contexto;
  if (cn && qn.on && !ge) {
    const Ft = In.current,
      Tt = Ft
        ? Ft.from.map((Ut, oe) => Ut + (Z(Ft.to, oe) - Ut) * Ft.e)
        : ke.current,
      Wt = gn(3);
    (Fo(
      Wt,
      larguraCanvas,
      alturaCanvas,
      escalaPixels,
      Ge,
      modelo,
      mode,
      Y,
      focus,
      {
        landOnly: !0,
      },
    ),
      (In.current = {
        from: Tt,
        to: modelo,
        e: 0,
      }),
      ft(
        1100,
        (Ut) => {
          const oe = Dr(Ut);
          ((In.current.e = oe),
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
                from: Tt,
                e: oe,
                base: Wt,
                town: town,
              },
            ));
        },
        () => O(!1),
      ));
    return true;
  }

  return false;
}
