import { criarSelecaoDoMapa } from "./desenho-interacao-selecao.js";
import { useRotulosDoMapa } from "./desenho-interacao-rotulos.js";
import { useDesenhoPrincipal } from "./desenho-interacao-canvas.js";
import { usePreparacaoMapa } from "./desenho-interacao-preparacao.js";
import { useMapPointerInteraction } from "./mapa-interacao.js";
import { useMapViewState } from "./mapa-estado-visual.js";
import { useDesenhoSobreposicao } from "./mapa-efeitos-sobreposicao.js";
import { renderCamadasDoMapa } from "./mapa-camadas.js";
import { _r, qi, Vi } from "./mapa-dados-2.js";
import { _nState, _eState } from "./mapa-dados-1.js";
import { HiState } from "./mapa-geometria-1.js";
export let El;
export function initialize() {
  El = (props) => {
    const {
      m: modelo,
      mode: mode,
      level: level,
      cand = null,
      bairro = null,
    } = props;
    const Y = modelo.towns || level === "cand" || _r(level) ? level : "uf";
    ((_nState.value =
      mode === "pres" && Y === "cand" && cand != null
        ? qi(modelo, cand)
        : null),
      (_eState.value = mode === "pres" && _r(Y) ? Vi(modelo, Y) : null),
      (HiState.value = bairro));
    const mapView = useMapViewState({
      props,
      Y,
    });
    const { gs, fa, I } = usePreparacaoMapa({
      props,
      mapView,
      Y,
    });
    const interaction = useMapPointerInteraction({
      props,
      mapView,
    });
    useDesenhoPrincipal({
      interaction,
      mapView,
      props,
      Y,
      gs,
      I,
      fa,
    });
    const { qs, uo, Qs, pa, sr } = useRotulosDoMapa({
      mapView,
      props,
    });
    useDesenhoSobreposicao({
      mapView,
      props,
      uo,
      Qs,
    });
    const { sl, fo, Hd, Ud, ar } = criarSelecaoDoMapa({
      interaction,
      mapView,
      props,
      Y,
    });
    return renderCamadasDoMapa({
      interaction,
      mapView,
      props,
      ar,
      fo,
      Hd,
      Ud,
      qs,
      Qs,
      pa,
      sr,
      uo,
      Y,
      sl,
    });
  };
}
