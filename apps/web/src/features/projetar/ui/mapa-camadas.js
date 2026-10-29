import { html } from "./formatacao-e-acessibilidade-1.js";
import { desenharCanvas } from "./desenho-camadas-canvas.js";
import { desenharZoom } from "./desenho-camadas-zoom.js";
import { desenharMarcas } from "./desenho-camadas-marcas.js";
import { desenharMunicipio } from "./desenho-camadas-municipio.js";
import { desenharDicas } from "./desenho-camadas-dicas.js";
export function renderCamadasDoMapa({
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
}) {
  const { small = false, tv = false, linked = null, flow = false } = props;
  const contexto = {
    ...interaction,
    ...mapView,
    ...props,
    modelo: props.m,
    larguraCanvas: props.cw,
    alturaCanvas: props.ch,
    small,
    tv,
    linked,
    flow,
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
  };
  return html`${desenharCanvas(contexto)}${desenharZoom(contexto)}${desenharMarcas(contexto)}${desenharMunicipio(contexto)}${desenharDicas(contexto)}`;
}
