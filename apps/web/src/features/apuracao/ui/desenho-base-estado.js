import { Fo } from './mapa-geometria-2.js';
export function confirmarDesenho(contexto) {
  const {
    recontar,
    Ce,
    nr,
    pn,
    Qn,
    is,
    Ae,
    D,
    ke,
    dn,
    In,
    sn,
    Xe,
    As,
    Vs,
    On,
    larguraCanvas,
    alturaCanvas,
    escalaPixels,
    A,
  } = contexto;
  const st = Xe.current;
  (recontar && Ce(),
    Fo(
      A,
      larguraCanvas,
      alturaCanvas,
      escalaPixels,
      st.target,
      st.m,
      st.mode,
      st.level,
      st.focus,
      {
        hmax: st.hmax,
        town: st.town,
        record: !0,
        zk: st.zk,
        country: st.country,
      },
    ),
    (Ae.current = st.target),
    (D.current = {
      sizeKey: As,
      focus: st.focus,
      town: st.town,
      country: st.country,
      bk: st.bk,
      mode: st.mode,
      level: st.level,
      m: st.m,
      vkey: st.vkey,
      lookKey: st.lookKey,
      zoneKey: st.zoneKey,
      tileKey: st.tileKey,
    }),
    (ke.current = nr(st.m)),
    (sn.current = st.m),
    (dn.current = null),
    (In.current = null),
    Vs(st.target),
    pn.current ? Qn(pn.current) : (is(), On(!1)));
}

export function animarDesenho(q, duracao, quadro, concluir) {
  const inicio = performance.now();
  quadro(0);
  const atualizar = (instante) => {
    const progresso = Math.min(1, (instante - inicio) / duracao);
    quadro(progresso);
    if (progresso < 1) q.current = requestAnimationFrame(atualizar);
    else concluir();
  };
  q.current = requestAnimationFrame(atualizar);
}
