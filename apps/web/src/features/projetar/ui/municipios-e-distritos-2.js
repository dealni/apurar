import { Geo } from "../geography.js";

// Não há resultados por bairro no feed Apurar; o mapa mundial é independente.
export const $e = () => [];
export let zt, Ln;
export function initialize() {
  zt = Geo.world;
  Ln = zt ? zt.cities.length : 0;
}
