import { renderPainelTV } from './painel-tv.js';
import { renderPainelCompacto } from './painel-compacto.js';
import { renderPainelMobile } from './painel-mobile.js';
export function renderLayoutReduzidoPainel(contexto) {
  const {
    no,
    props,
    Zn,
    Jn,
    Rn,
    jn,
    ks,
    is,
    Es,
    fn,
    gs,
    en,
    Ss,
    Je,
    Qe,
    K,
    te,
    I,
    Bn,
    ye,
    Vs,
    yn,
    On,
    ko,
    As,
    rs,
    Us,
  } = contexto;
  if (no) {
    return renderPainelMobile({
      props,
      Zn,
      Jn,
      Rn,
      jn,
      ks,
      is,
      Es,
      fn,
      gs,
      en,
      Ss,
      Je,
      Qe,
      K,
      te,
      I,
      Bn,
      ye,
      Vs,
      yn,
      On,
    });
  }
  if (ko) {
    return renderPainelCompacto({
      props,
      Jn,
      Rn,
      jn,
      ks,
      is,
      Es,
      Bn,
      fn,
      en,
      Ss,
      Je,
      Vs,
      Zn,
      Qe,
      yn,
      On,
    });
  }
  if (As) {
    return renderPainelTV({
      props,
      Rn,
      jn,
      ks,
      is,
      Es,
      rs,
      fn,
      en,
      Ss,
      Je,
      Vs,
      Us,
      Bn,
      ye,
      yn,
      On,
    });
  }
  return null;
}
