import { ie } from './formatacao-e-acessibilidade-1.js';
import { ld, id, cd } from './navegacao-e-patrocinio-1.js';
export function calcularEscalaPainel(contexto) {
  const { tv, Bn, ye, focus, prof } = contexto;
  const Dn = ld
    ? tv
      ? ie(Math.min(Bn / 1280, ye / 720), 0.5, 4)
      : ie(Math.min(Bn / 1600, ye / 900), 0.85, 3)
    : 1;
  const Gs = Bn / Dn;
  const ws = ye / Dn;
  const _s = tv ? 360 : id;
  const xa = tv ? 300 : cd;
  const ea = Gs >= 1280;
  const Ea = tv ? !!focus : ea || !!focus || !!prof;
  return {
    Dn,
    Gs,
    ws,
    _s,
    xa,
    ea,
    Ea,
  };
}
