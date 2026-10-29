import { criarPainelExterior } from "./painel-exterior.js";
export function criarExteriorPainel(contexto) {
  const {
    focus,
    town,
    modelo,
    upFromCity,
    close,
    spot,
    tv,
    country,
    pickCity,
    toAbroad,
    pickCountry,
  } = contexto;
  const Rn = criarPainelExterior({
    l: focus,
    replay: contexto.props.replay,
    d: town,
    e: modelo,
    g: upFromCity,
    w: close,
    ot: spot,
    W: tv,
    $: country,
    f: pickCity,
    h: toAbroad,
    m: pickCountry,
  });
  return {
    Rn,
  };
}
