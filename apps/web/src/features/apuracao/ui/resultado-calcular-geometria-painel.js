import { selecionarDensidadeResumo } from './resultado-densidade-resumo.js';
import { Xt } from './formatacao-e-acessibilidade-1.js';
import { Zc, Gl, Zs, Wl } from './navegacao-e-patrocinio-1.js';
export function calcularGeometriaPainel(contexto) {
  const { tv, focus, prof, ea, office, modelo, cam, _s, Gs, Ea, xa, ws } =
    contexto;
  const _a = !tv && (!!focus || !!prof) && !ea;
  const Zo = !tv && office === 'pres' && (Xt === 2 || modelo.n.valid > 0);
  const za = Zo ? 118 : 0;
  const el = Zc + (contexto.Vs ? 40 : 0) + (Zo ? za + Gl : 0);
  const Ta = tv && cam;
  const nl = 320;
  const er = 180;
  const Gn = {
    x0: _a ? Zs : Zs + _s + Gl,
    x1: Gs - Zs - (Ea ? xa + Gl : 0) - (Ta ? nl + Gl : 0),
    y0: el + 44,
    y1: ws - Zs - (tv ? Wl + 14 : 0),
  };
  const Eo = selecionarDensidadeResumo(tv, ws);
  return {
    _a,
    Zo,
    za,
    el,
    Ta,
    nl,
    er,
    Gn,
    Eo,
  };
}
