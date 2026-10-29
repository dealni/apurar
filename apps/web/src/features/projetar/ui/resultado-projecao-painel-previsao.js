import { renderApurarProjection } from "./apurar-projection.js";
export function renderizarProjecaoNacional(
  lideres,
  projecao,
  compacto,
  modelo,
) {
  return renderApurarProjection(projecao, lideres, modelo?.projection?.reason);
}
