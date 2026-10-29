import { checkNumericColumns, checkVoteColumns } from './column-validation.js';
function validZoneSequence(p) {
  return (
    Number.isSafeInteger(p.seq) &&
    p.seq >= 0 &&
    Array.isArray(p.zonas) &&
    p.zonas.length > 0 &&
    p.zonas.every((dt) => Number.isInteger(dt) && dt > 0) &&
    new Set(p.zonas).size === p.zonas.length
  );
}
function checkHeader(p, L) {
  if (
    !p ||
    p.versao !== 1 ||
    String(p.ibge) !== String(L) ||
    !validZoneSequence(p) ||
    !p.votos ||
    typeof p.votos != 'object'
  )
    return 'cabeçalho';
  return null;
}
function checkCounts(p, Q) {
  for (let dt = 0; dt < p.zonas.length; dt++) {
    let tt = p.brancos[dt] + p.nulos[dt];
    for (const qt in p.votos) tt += p.votos[qt][dt];
    if (
      tt > p.comparecimento[dt] * 1.005 + 10 ||
      p.comparecimento[dt] > p.apurado[dt] * 1.01 + 10 ||
      p.apurado[dt] > p.eleitorado[dt] * 1.01 + 10
    )
      return 'zona ' + p.zonas[dt] + ': a contagem não fecha';
    const ae = Q ? Q.z.indexOf(p.zonas[dt]) : -1;
    if (
      p.eleitorado[dt] > 2e6 ||
      (ae >= 0 && p.eleitorado[dt] > Q.el[ae] * 10 + 1e4)
    )
      return 'zona ' + p.zonas[dt] + ': eleitorado';
  }
  return null;
}

export function createZoneValidation(config, isNonNegative, readZones) {
  const feedRound = (p) => (p.turno == null ? 1 : p.turno);
  const checkZones = (p, L) => {
    const header = checkHeader(p, L);
    if (header) return header;
    if (feedRound(p) !== config.turno) return 'turno ' + p.turno;
    const Q = readZones(String(L));
    if (Q) {
      const dt = new Set(Q.z);
      if (p.zonas.filter((tt) => dt.has(tt)).length * 2 < p.zonas.length)
        return 'zonas de outro município';
    }
    const Pt = p.zonas.length;
    const columns = checkNumericColumns(p, Pt, isNonNegative);
    if (columns) return columns;
    for (let dt = 0; dt < Pt; dt++)
      if (p.totalizadas[dt] > p.secoes[dt]) return 'totalizadas';
    const votes = checkVoteColumns(p.votos, Pt, isNonNegative);
    if (votes) return votes;
    return checkCounts(p, Q);
  };
  return checkZones;
}
