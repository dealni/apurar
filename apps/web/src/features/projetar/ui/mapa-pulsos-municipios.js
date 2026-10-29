import { qn } from "./contagem-e-animacao-1.js";
import { Feed } from "../feed.js";
import { ge } from "./formatacao-e-acessibilidade-1.js";
import { dt } from "./apuracao-e-votos-1.js";
import { pulsoMunicipal } from "./desenho-pulsos.js";
export function criarPulsosMunicipais({ mapView, props, gs, Mn }) {
  const { Ae, W, sn, cn, Ge } = mapView;
  const {
    m: modelo,
    mode: mode,
    focus: focus,
    town: town,
    cw: larguraCanvas,
    ch: alturaCanvas,
  } = props;
  return (A, F) => {
    const at = sn.current;
    sn.current = modelo;
    const O = !qn.on && Feed.LIVE && !!at && at !== modelo;
    if (!qn.on && !O) {
      limparPulsos(mapView);
      return;
    }
    if (ge || !at || town != null) return;
    const ft = performance.now(),
      se = Ae.current || Ge,
      Jt = [],
      Rt = O ? 500 : A;
    for (let st = 0; st < dt; st++) {
      const pulso = pulsoMunicipal({
        modelo,
        anterior: at,
        indice: st,
        focus,
        mode,
        cn,
        gs,
        view: se,
        largura: larguraCanvas,
        altura: alturaCanvas,
        inicio: ft,
        atrasos: F,
        duracao: Rt,
      });
      if (pulso) Jt.push(pulso);
    }
    (Jt.length > 200 && (Jt.sort((st, Zt) => Zt.r - st.r), (Jt.length = 200)),
      W.current.push(...Jt),
      W.current.length > 600 && (W.current = W.current.slice(-600)),
      Mn());
  };
}

function limparPulsos({ W, Pn, ze, we }) {
  W.current = [];
  Pn.current = 0;
  cancelAnimationFrame(ze.current);
  const canvas = we.current;
  if (canvas)
    canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);
}
