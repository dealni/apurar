export function createPresidentialShares({ regions, stateData }) {
  const candidateData = window.CANDIDATOS || null;
  const minorPartyShares = {
    PSD: 0.072,
    NOVO: 0.055,
    MISSÃO: 0.035,
    MISSAO: 0.035,
    AVANTE: 0.018,
    DC: 0.004,
    PRTB: 0.004,
    DEMOCRATA: 0.003,
    PCO: 0.002,
    PSTU: 0.002,
    PCB: 0.002,
    UP: 0.002,
  };
  const regionalPartyWeights = {
    PSD: {
      GO: 3.4,
      TO: 1.6,
      MT: 1.5,
      MS: 1.4,
      DF: 1.4,
      RO: 1.3,
    },
    NOVO: {
      MG: 3.1,
      SC: 1.4,
      PR: 1.3,
      SP: 1.25,
      ES: 1.2,
      RS: 1.2,
    },
    MISSÃO: {
      SP: 1.7,
      PR: 1.3,
      SC: 1.3,
      RS: 1.2,
      DF: 1.3,
    },
    MISSAO: {
      SP: 1.7,
      PR: 1.3,
      SC: 1.3,
      RS: 1.2,
      DF: 1.3,
    },
  };
  const presidentialCandidates = candidateData
    ? candidateData.presidente
        .filter((y) => y.valido !== !1)
        .map((y) => ({
          id: 'p' + y.n,
          n: y.n,
          name: y.exib || y.nome,
          short: y.exib || y.nome,
          partido: y.partido,
          sq: y.sq,
          g: y.g || '',
        }))
    : [
        ['Helena Duarte', 38],
        ['Augusto Brandão', 52],
        ['Renata Valadares', 47],
        ['Caio Moretti', 61],
        ['Iara Fontes', 74],
        ['Joel Sarmento', 86],
      ].map(([y, Z]) => ({
        id: 'p' + Z,
        n: Z,
        name: y,
        short: y,
        partido: '',
        sq: '',
      }));
  const ptIndex = presidentialCandidates.findIndex((y) => y.partido === 'PT');
  const plIndex = presidentialCandidates.findIndex((y) => y.partido === 'PL');
  const presidentialShares = (y) => {
    const Z = stateData[y];
    if (ptIndex < 0 || plIndex < 0) {
      const U = Z[9] - 1.3,
        Et = Z[10] - 0.1,
        Lt = 100 - U - Et,
        wt = regions[y],
        qe = Lt * (wt === 'SE' || wt === 'S' ? 0.52 : 0.42);
      return [U, Et, qe, Lt * 0.24, Lt * (wt === 'N' ? 0.2 : 0.14), 0]
        .map((ee, Le, mn) => (Le === 5 ? Lt - mn[2] - mn[3] - mn[4] : ee))
        .map((ee) => ee / 100);
    }
    const G = presidentialCandidates.map(
        (U) =>
          (minorPartyShares[U.partido] || 0.002) *
          ((regionalPartyWeights[U.partido] || {})[y] || 1),
      ),
      it = G.reduce(
        (U, Et, Lt) => (Lt === ptIndex || Lt === plIndex ? U : U + Et),
        0,
      ),
      vt = Z[9] * 0.955,
      St = Z[10] * 0.975,
      It = (1 - it) / (vt + St);
    return ((G[ptIndex] = vt * It), (G[plIndex] = St * It), G);
  };

  return {
    candidateData,
    presidentialCandidates,
    ptIndex,
    plIndex,
    presidentialShares,
  };
}
