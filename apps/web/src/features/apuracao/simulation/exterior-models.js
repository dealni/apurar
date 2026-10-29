export function createExteriorModels({
  stateData,
  presidentialShares,
  previousElection,
  previousFields,
  openingMinute,
  seededFraction,
  createRandom,
  normalRandom,
  validFirstRoundVotes,
  ptIndex,
  plIndex,
}) {
  const exteriorModel = {
    uf: 'ZZ',
    el: stateData.ZZ[0],
    sections: stateData.ZZ[1],
    w: 1,
    u: 0,
    turnout: 1 - stateData.ZZ[6] / 100,
    share: presidentialShares('ZZ'),
  };
  const exteriorData =
    (typeof window != 'undefined' && window.EXTERIOR) || null;
  const exteriorFields = exteriorData
    ? Object.fromEntries(exteriorData.campos.map((y, Z) => [y, Z]))
    : null;
  const exteriorElectorate = exteriorData
    ? exteriorData.cidades.reduce((y, Z) => y + Z[exteriorFields.el], 0)
    : 1;
  const exteriorShares = presidentialShares('ZZ');
  const previousExterior = previousElection && previousElection.uf.ZZ;
  const exteriorModels = exteriorData
    ? exteriorData.cidades.map((y, Z) => {
        const G = y[exteriorFields.el],
          it = Math.max(
            1,
            Math.round((G / exteriorElectorate) * stateData.ZZ[1]),
          ),
          vt = y[exteriorFields.rec],
          St = y[exteriorFields.r22],
          It = Array.from(
            {
              length: it,
            },
            (ee, Le) =>
              vt.length
                ? Math.max(
                    openingMinute,
                    vt[
                      Math.min(
                        vt.length - 1,
                        Math.floor(((Le + 0.5) / it) * vt.length),
                      )
                    ],
                  )
                : Math.max(
                    openingMinute,
                    y[exteriorFields.fecha] +
                      120 +
                      120 * seededFraction(Z + 9e3, 1) +
                      (30 * Le) / it,
                  ),
          ).sort((ee, Le) => ee - Le),
          U =
            St && St[0]
              ? Math.min(
                  0.9,
                  Math.max(
                    0.12,
                    (St[1] + St[2] + St[3] + St[4] + St[5] + St[6] + St[7]) /
                      St[0],
                  ),
                )
              : 1 - stateData.ZZ[6] / 100;
        let Et;
        if (St && previousExterior && ptIndex >= 0 && plIndex >= 0) {
          const ee = St[1] + St[2] + St[3] + St[4] + St[5] || 1,
            Le = validFirstRoundVotes(previousExterior),
            mn = ee / (ee + 300),
            Vn = (ns, En) =>
              mn * Math.log(Math.max(0.001, ns / ee / (En / Le))),
            $s = Vn(
              St[3] + St[4],
              previousExterior[previousFields.tebet_1t] +
                previousExterior[previousFields.ciro_1t],
            ),
            xn = createRandom(Z * 53 + 11);
          Et = exteriorShares.map(
            (ns, En) =>
              Math.log(Math.max(ns, 1e-4)) +
              (En === ptIndex
                ? Vn(St[1], previousExterior[previousFields.lula_1t])
                : En === plIndex
                  ? Vn(St[2], previousExterior[previousFields.bolsonaro_1t])
                  : 0.6 * $s) +
              0.05 * normalRandom(xn),
          );
        } else {
          const ee = createRandom(Z * 53 + 11);
          Et = exteriorShares.map(
            (Le) => Math.log(Math.max(Le, 1e-4)) + 0.08 * normalRandom(ee),
          );
        }
        const Lt = Math.max(...Et),
          wt = Et.map((ee) => Math.exp(ee - Lt)),
          qe = wt.reduce((ee, Le) => ee + Le, 0);
        return {
          i: Z,
          uf: 'ZZ',
          el: G,
          sections: it,
          arrive: It,
          turnout: U,
          share: wt.map((ee) => ee / qe),
        };
      })
    : [];
  calibrateExteriorModels(exteriorModels, exteriorShares);

  return { exteriorModel, exteriorData, exteriorFields, exteriorModels };
}

export const arrivedSections = (y, Z) => {
  let G = 0,
    it = y.arrive.length;
  for (; G < it;) {
    const vt = (G + it) >> 1;
    y.arrive[vt] <= Z ? (G = vt + 1) : (it = vt);
  }
  return G / y.sections;
};

function calibrateExteriorModels(exteriorModels, exteriorShares) {
  for (let y = 0; y < 3 && exteriorModels.length; y++) {
    const Z = exteriorShares.map(() => 0);
    for (const it of exteriorModels)
      it.share.forEach((vt, St) => (Z[St] += vt * it.el * it.turnout));
    const G = Z.reduce((it, vt) => it + vt, 0);
    for (const it of exteriorModels) {
      const vt = it.share.map((It, U) => (It * exteriorShares[U]) / (Z[U] / G)),
        St = vt.reduce((It, U) => It + U, 0);
      it.share = vt.map((It) => It / St);
    }
  }
}
