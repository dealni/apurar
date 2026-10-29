import { isNonNegative } from './numeric-validation.js';
function validateVoteCounts(p, L) {
  let dt = 0;
  for (const tt in p.votos) {
    if (!isNonNegative(p.votos[tt])) return `${L}.votos.${tt}: ${p.votos[tt]}`;
    dt += p.votos[tt];
  }
  if (p.sj != null) {
    if (!Array.isArray(p.sj)) return L + '.sj';
    for (const tt of p.sj)
      if (typeof tt != 'string' || !p.anulados || !(tt in p.anulados))
        return `${L}.sj.${tt}`;
  }
  if (p.anulados != null) {
    if (typeof p.anulados != 'object') return L + '.anulados';
    for (const tt in p.anulados) {
      if (!isNonNegative(p.anulados[tt])) return `${L}.anulados.${tt}`;
      if (tt in p.votos) return `${L}: ${tt} em votos e em anulados`;
      dt += p.anulados[tt];
    }
  }
  return { sum: dt };
}

export function validateTotals(p, L, Q, Pt = 1) {
  if (!p || typeof p != 'object') return L + ': ausente';
  for (const tt of [
    'secoes',
    'totalizadas',
    'eleitorado',
    'apurado',
    'comparecimento',
    'brancos',
    'nulos',
  ])
    if (!isNonNegative(p[tt])) return `${L}.${tt}: ${p[tt]}`;
  if (!p.secoes) return L + ': sem seções';
  if (p.totalizadas > p.secoes)
    return L + ': mais seções totalizadas que seções';
  if (p.apurado > p.eleitorado * 1.01 + 10)
    return L + ': eleitorado apurado maior que o eleitorado';
  if (!p.votos || typeof p.votos != 'object') return L + '.votos: ausente';
  const counts = validateVoteCounts(p, L);
  if (typeof counts === 'string') return counts;
  const dt = counts.sum;
  return dt + p.brancos + p.nulos > p.comparecimento * Pt * 1.005 + 10
    ? L + ': votos somam mais que o comparecimento'
    : p.comparecimento > p.apurado * 1.01 + 10
      ? L + ': comparecimento maior que o eleitorado apurado'
      : Q.has(p.situacao)
        ? null
        : `${L}.situacao: ${p.situacao}`;
}
