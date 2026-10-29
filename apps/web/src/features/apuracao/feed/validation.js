import { isFiniteNumber, isNonNegative } from './numeric-validation.js';
import { validateTotals } from './totals-validation.js';
/*
 * Feed preservado: validation.
 * Dependências explícitas; a fábrica mantém apenas o estado desta responsabilidade.
 */
export function createValidation({
  allStates,
  config,
  exteriorCount,
  municipalityCount,
  states,
}) {
  const singleSeatStatuses = new Set(['apurando', 'eleito', 'segundo-turno']);
  const senateStatuses = new Set(['apurando', 'um-eleito', 'eleitos']);
  const checkHeader = (p) => {
    if (!p || typeof p != 'object') return 'não é um objeto';
    if (p.versao !== 1) return 'versão ' + p.versao;
    if (!Number.isInteger(p.seq) || p.seq < 0) return 'seq ' + p.seq;
    if (
      !isFiniteNumber(p.gerado) ||
      !isFiniteNumber(p.t) ||
      p.t < 0 ||
      p.t > 2880
    )
      return 'horário';
    const L = p.turno == null ? 1 : p.turno;
    if (L !== config.turno) return 'turno ' + p.turno;
    return null;
  };
  const checkPresident = (Q) => {
    let tt = validateTotals(Q.br, 'presidente.br', singleSeatStatuses);
    if (tt) return tt;
    let ae = 0;
    for (const qt of allStates) {
      if (
        ((tt = validateTotals(
          Q.uf[qt],
          'presidente.' + qt,
          singleSeatStatuses,
        )),
        tt)
      )
        return tt;
      ae += Q.uf[qt].totalizadas;
    }
    if (Math.abs(ae - Q.br.totalizadas) > Math.max(2, Q.br.secoes * 0.25))
      return 'Brasil não é a soma dos estados';
    return null;
  };
  const checkRegionalRaces = (Pt, dt, L) => {
    let tt;
    for (const qt of states)
      if (
        ((Pt.uf[qt] != null || L !== 2) &&
          ((tt = validateTotals(
            Pt.uf[qt],
            'governador.' + qt,
            singleSeatStatuses,
          )),
          tt)) ||
        ((dt.uf[qt] != null || L !== 2) &&
          ((tt = validateTotals(dt.uf[qt], 'senado.' + qt, senateStatuses, 2)),
          tt))
      )
        return tt;
    return null;
  };
  const checkCurrent = (p) => {
    const header = checkHeader(p);
    if (header) return header;
    const L = p.turno == null ? 1 : p.turno;
    const Q = p.presidente,
      Pt = p.governador,
      dt = p.senado;
    if (!Q || !Q.uf || !Pt || !Pt.uf || !dt || !dt.uf) return 'cargos ausentes';
    let tt = checkPresident(Q);
    if (tt) return tt;
    tt = checkRegionalRaces(Pt, dt, L);
    if (tt) return tt;
    return p.aviso != null &&
      (typeof p.aviso != 'string' || p.aviso.length > 200)
      ? 'aviso'
      : null;
  };
  const validatePackedRows = (p, L, Q) => {
    if (!p || p.n !== L) return Q + ': quantidade';
    for (const Pt of ['f', 'l', 'm', 'v']) {
      const dt = p[Pt];
      if (!Array.isArray(dt) || dt.length !== L) return `${Q}.${Pt}: tamanho`;
      for (let tt = 0; tt < L; tt++)
        if (!isNonNegative(dt[tt])) return `${Q}.${Pt}[${tt}]: ${dt[tt]}`;
    }
    for (let Pt = 0; Pt < L; Pt++)
      if (p.f[Pt] > 1e3 || p.m[Pt] > 1e3)
        return `${Q}: fora de escala em ${Pt}`;
    return null;
  };
  const checkMunicipalities = (p) =>
    !p || p.versao !== 1 || !Number.isInteger(p.seq)
      ? 'cabeçalho'
      : validatePackedRows(p.br, municipalityCount, 'municipios') ||
        (exteriorCount && p.zz
          ? validatePackedRows(p.zz, exteriorCount, 'exterior')
          : null);
  return {
    checkCurrent,
    checkMunicipalities,
    isFiniteNumber,
    isNonNegative,
    singleSeatStatuses,
  };
}
