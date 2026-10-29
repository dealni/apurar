import { animarTransicaoDeRecorte } from './mapa-transicao-recorte.js';
import { Fo } from './mapa-geometria-2.js';
import { ge } from './formatacao-e-acessibilidade-1.js';
import { qn } from './contagem-e-animacao-1.js';
export function prepararTransicao(contexto) {
  const {
    interaction,
    mapView,
    props,
    Y,
    gs,
    I,
    pn,
    ys,
    jn,
    ks,
    is,
    W,
    dn,
    As,
    rs,
    da,
    focus,
    town,
    country,
    A,
    F,
    at,
    O,
    ft,
    se,
    Jt,
  } = contexto;
  if (
    (Jt &&
      (clearTimeout(ks.current),
      (pn.current = null),
      (ys.current = null),
      (jn.current = null),
      is()),
    F.sizeKey !== As || ge)
  ) {
    ((W.current = []), O(!1));
    return true;
  }
  if (
    dn.current ||
    F.focus !== focus ||
    F.town !== town ||
    F.country !== country ||
    F.bk !== rs
  ) {
    animarTransicaoDeRecorte({
      mapView,
      props,
      interaction,
      Jt,
      F,
      A,
      Y,
      gs,
      I,
      se,
      ft,
      at,
      O,
    });
    return true;
  }
  if (F.vkey !== da) {
    ((W.current = []), O(!1));
    return true;
  }

  return animarModo(contexto);
}

export function animarModo(contexto) {
  const {
    Y,
    gs,
    gn,
    xt,
    ve,
    cn,
    Ge,
    On,
    modelo,
    mode,
    focus,
    larguraCanvas,
    alturaCanvas,
    escalaPixels,
    A,
    F,
    O,
    ft,
  } = contexto;
  if (F.mode !== mode || F.level !== Y || F.lookKey !== xt) {
    const Rt = ve.current;
    if (
      ((Rt.width = A.width),
      (Rt.height = A.height),
      Rt.getContext('2d').drawImage(A, 0, 0),
      (Rt.style.transition = 'none'),
      (Rt.style.opacity = '1'),
      Rt.offsetWidth,
      (Rt.style.transition = 'opacity 180ms var(--ease)'),
      requestAnimationFrame(() => {
        Rt.style.opacity = '0';
      }),
      cn && qn.on)
    ) {
      const st = gn(3);
      (Fo(
        st,
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
        On(!0),
        ft(
          1300,
          (Zt) =>
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
                rise: Zt,
                base: st,
              },
            ),
          () => O(!1),
        ));
      return true;
    }
    (O(!1),
      (A.style.transition = 'none'),
      (A.style.opacity = '0'),
      A.offsetWidth,
      (A.style.transition = 'opacity 260ms var(--ease) 120ms'),
      requestAnimationFrame(() => {
        A.style.opacity = '1';
      }));
    return true;
  }

  return false;
}
