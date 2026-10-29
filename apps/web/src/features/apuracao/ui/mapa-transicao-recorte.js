import { ga, Na } from './mapa-dados-1.js';
import { ie } from './formatacao-e-acessibilidade-1.js';
import { Fo } from './mapa-geometria-2.js';
import { Dr } from './mapa-selecao-1.js';
export function animarTransicaoDeRecorte({
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
}) {
  const { Ae, W, dn, Xe, Bn, Ge, Jn, ms, yo, Mt, On } = mapView;
  const {
    m: modelo,
    mode: mode,
    focus: focus,
    town: town,
    country = null,
    cw: larguraCanvas,
    ch: alturaCanvas,
    rect: rect,
    s: escalaPixels,
  } = props;
  const { ne, gn } = interaction;
  const Rt = dn.current ? dn.current.view : Ae.current,
    st = Jt || Rt,
    Zt = ga(Na, rect, Bn),
    Se = modelo,
    Ft = (rect.x0 + rect.x1) / 2,
    Tt = (rect.y0 + rect.y1) / 2,
    Wt = [(Ft - st.ox) / st.k, (Tt - st.oy) / st.k],
    Ut = [(Ft - Ge.ox) / Ge.k, (Tt - Ge.oy) / Ge.k],
    oe = focus === 'ZZ' || F.focus === 'ZZ',
    nn =
      (Math.hypot(Ut[0] - Wt[0], Ut[1] - Wt[1]) * Math.min(st.k, Ge.k)) /
      Math.max(1, rect.x1 - rect.x0),
    Ze = oe ? 0 : ie((nn - 0.35) * 1.4, 0, 1.1),
    rn = Math.sqrt(st.k * Ge.k),
    zs =
      Ze > 0
        ? Zt
        : {
            k: rn,
            ox: Ft - ((Wt[0] + Ut[0]) / 2) * rn,
            oy: Tt - ((Wt[1] + Ut[1]) / 2) * rn,
          },
    Bs = gn(0),
    Yc = gn(1),
    Jc = gn(2);
  ((Bs.width = A.width),
    (Bs.height = A.height),
    Bs.getContext('2d').drawImage(A, 0, 0),
    Fo(
      Yc,
      larguraCanvas,
      alturaCanvas,
      escalaPixels,
      zs,
      modelo,
      mode,
      Y,
      oe ? 'ZZ' : null,
      {
        hmax: (rect.y1 - rect.y0) * 0.28,
        zk: 1,
      },
    ),
    Fo(
      Jc,
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
        town: town,
        zk: I,
        country: country,
      },
    ));
  const jd = [
    [Bs, Rt],
    [Yc, zs],
    [Jc, Ge],
  ];
  ((dn.current = {
    key: se,
    view: st,
  }),
    (W.current = []),
    On(!0),
    Jn(null),
    ms(null),
    yo(null),
    Mt(null),
    ft(
      850 + 450 * Ze,
      (Gd) => {
        const La = Dr(Gd),
          lr =
            Math.exp(Math.log(st.k) + (Math.log(Ge.k) - Math.log(st.k)) * La) /
            (1 + Ze * Math.sin(Math.PI * La)),
          Qc = Ft - (Wt[0] + (Ut[0] - Wt[0]) * La) * lr,
          tu = Tt - (Wt[1] + (Ut[1] - Wt[1]) * La) * lr,
          eu = ne(0, 0.45, La),
          nu = ne(0.45, 1, La),
          su = [1 - eu, eu - nu, nu];
        ((dn.current.view = {
          k: lr,
          ox: Qc,
          oy: tu,
        }),
          at.setTransform(1, 0, 0, 1, 0, 0),
          at.clearRect(0, 0, A.width, A.height),
          (at.globalCompositeOperation = 'lighter'),
          jd.forEach(([Wd, ti], ou) => {
            if (su[ou] < 0.002) return;
            const rr = lr / ti.k;
            ((at.globalAlpha = su[ou]),
              at.setTransform(
                escalaPixels * rr,
                0,
                0,
                escalaPixels * rr,
                escalaPixels * (Qc - ti.ox * rr),
                escalaPixels * (tu - ti.oy * rr),
              ),
              at.drawImage(Wd, 0, 0, larguraCanvas, alturaCanvas));
          }),
          (at.globalAlpha = 1),
          (at.globalCompositeOperation = 'source-over'));
      },
      () => O(Xe.current.m !== Se),
    ));
  return;
}
