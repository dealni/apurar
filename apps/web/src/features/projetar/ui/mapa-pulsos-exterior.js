import { qn } from "./contagem-e-animacao-1.js";
import { ge, ie, nt, rt, lt } from "./formatacao-e-acessibilidade-1.js";
import { Nn, bn, hs } from "./apuracao-e-votos-1.js";
import { zt } from "./municipios-e-distritos-2.js";
import { _nState } from "./mapa-dados-1.js";
export function criarPulsosDoExterior({ mapView, props, Mn }) {
  const { we, Ae, W, ze, Pn, sn, Ge } = mapView;
  const { m: modelo, cw: larguraCanvas, ch: alturaCanvas } = props;
  return (A, F) => {
    const at = sn.current;
    if (((sn.current = modelo), !qn.on)) {
      ((W.current = []), (Pn.current = 0), cancelAnimationFrame(ze.current));
      const se = we.current;
      se && se.getContext("2d").clearRect(0, 0, se.width, se.height);
      return;
    }
    if (ge || !at) return;
    const O = performance.now(),
      ft = Ae.current || Ge;
    for (const se of Nn) {
      const Jt = bn(modelo, se) - bn(at, se);
      if (Jt <= 0) continue;
      const Rt = zt.cities[se],
        st = ft.ox + Rt.c[0] * ft.k,
        Zt = ft.oy + Rt.c[1] * ft.k;
      st < 0 ||
        Zt < 0 ||
        st > larguraCanvas ||
        Zt > alturaCanvas ||
        W.current.push({
          x: st,
          y: Zt,
          r: ie(6 + 3 * Math.sqrt((Jt * Rt.el * 0.4) / 600), 7, 30),
          col: _nState.value
            ? nt(_nState.value.c)
            : rt(lt[hs(modelo, se)].partido).cor,
          a: 0.95,
          t0: O + (F.has(se) ? F.get(se) : Math.random() * A),
        });
    }
    Mn();
  };
}
