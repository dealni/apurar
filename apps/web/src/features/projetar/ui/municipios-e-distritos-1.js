import { lt } from "./formatacao-e-acessibilidade-1.js";

// O feed Apurar declara zones: false. Os consumidores visuais compartilham
// esta interface, mas não há carregamento nem simulação de zonas/locais.
export const wt = () => null;
export const xn = () => null;
export const ns = () => false;
export const En = () => null;
export const vn = () => false;
export const $t = () => [];
export const Gt = () => null;
export let fe;

// Mantém a leitura de comparações do primeiro turno nos modelos de mapa.
export function Qt(t, e) {
  const indices = Array.isArray(e) ? e : [e];
  const votos = t.t1.v;
  let total = 0;
  const candidatos = [0, 0];
  for (const indice of indices) {
    for (const numero in votos) {
      if (numero === "b" || numero === "n") continue;
      total += votos[numero][indice];
      const candidato = fe.indexOf(numero);
      if (candidato >= 0 && candidato < 2)
        candidatos[candidato] += votos[numero][indice];
    }
  }
  return total > 0 ? candidatos.map((votos) => votos / total) : null;
}

export function initialize() {
  fe = lt.map((candidato) => String(+candidato.n));
}
