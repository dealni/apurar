import { Dt, ie, nt, rt, lt, pe } from './formatacao-e-acessibilidade-1.js';
import { ae } from './apuracao-e-votos-1.js';
import { Geo } from '../geography.js';
import { Gu } from './mapa-geometria-2.js';
import { _nState } from './mapa-dados-1.js';

function corDoPulso(modelo, indice, mode) {
  if (mode !== 'pres') return '#FAFAF9';
  return _nState.value
    ? nt(_nState.value.c)
    : rt(lt[pe(modelo, indice)].partido).cor;
}
export function pulsoMunicipal({
  modelo,
  anterior,
  indice,
  focus,
  mode,
  cn,
  gs,
  view,
  largura,
  altura,
  inicio,
  atrasos,
  duracao,
}) {
  const diferenca = Math.abs(Dt(modelo, indice) - Dt(anterior, indice));
  if (diferenca <= 0 || (focus && Geo.munis[indice].uf !== focus)) return null;
  const centro = Geo.munis[indice].c;
  const x = view.ox + centro[0] * view.k;
  const yPlano = view.oy + centro[1] * view.k;
  const y = cn ? yPlano - Gu(modelo, indice, focus, gs) * 0.85 : yPlano;
  if (x < 0 || y < 0 || x > largura || y > altura) return null;
  return {
    x,
    y,
    r:
      ie(4 + 3 * Math.sqrt((diferenca * ae[indice] * 0.78) / 1500), 5, 28) *
      (focus ? 1.5 : 1) *
      (cn ? 0.7 : 1),
    col: corDoPulso(modelo, indice, mode),
    a: cn ? 0.45 : mode === 'pres' ? 0.95 : 0.5,
    t0:
      inicio +
      (atrasos.has(indice) ? atrasos.get(indice) : Math.random() * duracao),
  };
}
