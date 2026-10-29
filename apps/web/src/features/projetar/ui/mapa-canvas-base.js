import { zt } from "./municipios-e-distritos-2.js";
import { confirmarDesenho, animarDesenho } from "./desenho-base-estado.js";
import {
  aguardarRecorte,
  desenharIntroducao,
} from "./desenho-base-introducao.js";
import { prepararTransicao } from "./desenho-base-transicao.js";
import { atualizarExterior } from "./desenho-base-exterior.js";
import { atualizarMunicipios } from "./desenho-base-municipios.js";
import {
  obterInteracaoAnterior,
  obterChaveRecorte,
  recorteEstaPendente,
} from "./desenho-base-recorte.js";
export function criarDesenhoCanvasBase({
  interaction,
  mapView,
  props,
  Ce,
  nr,
  Y,
  gs,
  I,
  Ws,
  wo,
  _o,
  fa,
}) {
  const { gn, pn, ys, jn, ks, Qn, is } = interaction;
  const {
    Ct,
    xt,
    Bt,
    ve,
    Ae,
    D,
    q,
    ke,
    W,
    dn,
    In,
    sn,
    Xe,
    De,
    cn,
    As,
    rs,
    Ge,
    da,
    ds,
    Vs,
    On,
    yn,
    Rn,
  } = mapView;
  const {
    m: modelo,
    mode: mode,
    focus: focus,
    town: town,
    country = null,
    cw: larguraCanvas,
    ch: alturaCanvas,
    s: escalaPixels,
    intro = !1,
  } = props;
  return () => {
    if (!larguraCanvas || !alturaCanvas) return;
    const A = Bt.current;
    const F = D.current;
    const at = A.getContext("2d");
    if (!at) return;
    const contexto = {
      interaction,
      mapView,
      props,
      Ce,
      nr,
      Y,
      gs,
      I,
      Ws,
      wo,
      _o,
      fa,
      gn,
      pn,
      ys,
      jn,
      ks,
      Qn,
      is,
      Ct,
      xt,
      Bt,
      ve,
      Ae,
      D,
      q,
      ke,
      W,
      dn,
      In,
      sn,
      Xe,
      De,
      cn,
      As,
      rs,
      Ge,
      da,
      ds,
      Vs,
      On,
      yn,
      Rn,
      modelo,
      mode,
      focus,
      town,
      country,
      larguraCanvas,
      alturaCanvas,
      escalaPixels,
      intro,
      A,
      F,
      at,
    };
    const O = (recontar) => confirmarDesenho({ ...contexto, recontar });
    const ft = (duracao, quadro, concluir) =>
      animarDesenho(q, duracao, quadro, concluir);
    Object.assign(contexto, { O, ft });
    if (aguardarRecorte(contexto)) return;
    if (!F) {
      desenharIntroducao(contexto);
      return;
    }
    const se = obterChaveRecorte(contexto);
    if (recorteEstaPendente({ ...contexto, se })) return;
    cancelAnimationFrame(q.current);
    if (yn) Rn(false);
    const Jt = obterInteracaoAnterior(contexto);
    Object.assign(contexto, { se, Jt });
    if (prepararTransicao(contexto)) return;
    if (sn.current !== modelo && focus === "ZZ" && zt) {
      atualizarExterior(contexto);
      return;
    }
    if (sn.current !== modelo) atualizarMunicipios(contexto);
    else if (F.zoneKey !== fa) O(true);
  };
}
