import { contemRetangulo, localizarRotulo } from './desenho-limites.js';
export { localizarRotulo } from './desenho-limites.js';
import { zt } from './municipios-e-distritos-2.js';
import { Nn } from './apuracao-e-votos-1.js';
import { Sl } from './mapa-selecao-1.js';
import { Geo } from '../geography.js';
import { FrState, Tr } from './mapa-geometria-1.js';
import { Sim } from '../simulation.js';
import { Uo } from './mapa-dados-1.js';

export function localizarExterior(view, x, y, zk) {
  let cidade = null;
  let distancia = Infinity;
  for (const indice of Nn) {
    const centro = zt.cities[indice].c;
    const atual = Math.hypot(
      view.ox + centro[0] * view.k - x,
      view.oy + centro[1] * view.k - y,
    );
    if (atual <= Sl(indice, zk) + 5 && atual < distancia) {
      distancia = atual;
      cidade = indice;
    }
  }
  return cidade == null ? { uf: null, x, y } : { uf: 'ZZ', x, y, city: cidade };
}
export function localizarColuna(x, y) {
  for (let indice = FrState.value.length - 1; indice >= 0; indice--) {
    const coluna = FrState.value[indice];
    if (
      y <= coluna.y &&
      y >= coluna.y - coluna.h &&
      Math.abs(x - coluna.x) <=
        Math.max(4, coluna.w * (1 - (coluna.y - y) / coluna.h))
    ) {
      return { uf: Sim.M[coluna.i].uf, x, y, muni: coluna.i };
    }
  }
  return null;
}
function localizarPontoDeVotacao(dados, view, x, y) {
  const geo = dados.geo;
  for (let indice = geo.order.length - 1; indice >= 0; indice--) {
    const local = geo.order[indice];
    const ponto = geo.pts[local];
    if (
      Math.hypot(x - ponto[0], y - ponto[1]) <=
      Tr(geo, dados, local, view.k) + 3 / view.k
    )
      return { local };
  }
  return null;
}
function localizarDivisao(dados, x, y) {
  const divisoes = dados.div;
  for (let indice = 0; indice < divisoes.paths.length; indice++) {
    if (
      contemRetangulo(x, y, divisoes.boxes[indice]) &&
      Uo.isPointInPath(divisoes.paths[indice], x, y, 'evenodd')
    )
      return { bairro: indice };
  }
  return null;
}
function localizarBairroPorLocal(dados, x, y) {
  const geo = dados.geo;
  for (let indice = 0; indice < geo.paths.length; indice++) {
    const caixa = geo.boxes[indice];
    if (
      caixa &&
      dados.b[indice] >= 0 &&
      contemRetangulo(x, y, caixa) &&
      Uo.isPointInPath(geo.paths[indice], x, y, 'evenodd')
    )
      return { bairro: dados.b[indice] };
  }
  return null;
}
export function localizarDetalheMunicipal({
  dados,
  town,
  view,
  rotulos,
  x,
  y,
  mx,
  my,
}) {
  const rotulo = localizarRotulo(rotulos, x, y);
  if (rotulo) return { bairro: rotulo.b };
  const ponto = localizarPontoDeVotacao(dados, view, mx, my);
  if (ponto) return ponto;
  if (!Uo.isPointInPath(Geo.munis[town].path, mx, my)) return null;
  return dados.div
    ? localizarDivisao(dados, mx, my)
    : localizarBairroPorLocal(dados, mx, my);
}
export function localizarZona(dados, x, y) {
  for (let indice = 0; indice < dados.paths.length; indice++) {
    if (
      dados.has[indice] &&
      Uo.isPointInPath(dados.paths[indice], x, y, 'evenodd')
    )
      return { zone: indice };
  }
  return null;
}
export function localizarMunicipio(x, y) {
  for (const uf of Sim.UFS) {
    if (!contemRetangulo(x, y, Geo.ufs[uf].box)) continue;
    for (const muni of Geo.ufs[uf].munis) {
      if (Uo.isPointInPath(Geo.munis[muni].path, x, y)) return { uf, muni };
    }
  }
  return null;
}
