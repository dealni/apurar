import { Geo } from '../geography.js';
export function createMunicipalPopulation({
  createRandom,
  normalRandom,
  seededFraction,
  spatialNoise,
  stateData,
  presidentialShares,
  presidentialCandidates,
  previousElection,
  previousFields,
  validFirstRoundVotes,
  ptIndex,
  plIndex,
}) {
  const stateSectionWeights = {};
  const stateElectorates = {};
  for (const y of Geo.munis) {
    stateSectionWeights[y.uf] = (stateSectionWeights[y.uf] || 0) + y.pop;
    const Z = previousElection && previousElection.m[y.id];
    Z &&
      (stateElectorates[y.uf] =
        (stateElectorates[y.uf] || 0) + Z[previousFields.aptos_1t]);
  }
  return Geo.munis.map(createMunicipalModel);

  function createMunicipalModel(y) {
    const Z = previousElection && previousElection.m[y.id],
      G = stateData[y.uf],
      it = Z
        ? Math.max(
            300,
            Math.round(
              (Z[previousFields.aptos_1t] / stateElectorates[y.uf]) * G[0],
            ),
          )
        : Math.max(900, Math.round((y.pop / stateSectionWeights[y.uf]) * G[0])),
      vt = Math.max(2, Math.round(it / (G[0] / G[1]))),
      St = Math.log10(Math.max(y.pop, 1e3)) - 4.3,
      It = Math.min(1, 0.07 + 0.93 * Math.sqrt(vt / 2500)),
      U = seededFraction(y.i, 1) * (1 - It),
      Et = spatialNoise(y.c[0], y.c[1], 3),
      Lt = spatialNoise(y.c[1] + 900, y.c[0] + 400, 6),
      wt = createRandom(y.i * 31 + 7),
      qe = presidentialShares(y.uf),
      ee = ptIndex < 0 ? 0 : ptIndex,
      Le = plIndex < 0 ? 1 : plIndex,
      mn = presidentialCandidates.findIndex((vn, fe) => fe !== ee && fe !== Le);
    let Vn, $s;
    if (Z && ptIndex >= 0 && plIndex >= 0) {
      const result = historicalMunicipalVote(
        { previousFields, validFirstRoundVotes, normalRandom },
        Z,
        previousElection.uf[y.uf],
        qe,
        ee,
        Le,
        Lt,
        wt,
      );
      Vn = result.logits;
      $s = result.turnout;
    } else
      ((Vn = qe.map(
        (vn, fe) =>
          Math.log(Math.max(vn, 1e-4)) +
          (fe === ee
            ? 0.28 * Et - 0.05 * St
            : fe === Le
              ? -0.28 * Et + 0.04 * St
              : fe === mn
                ? 0.3 * St + 0.25 * Lt
                : 0.2 * Lt * (fe % 2 ? 1 : -1)) +
          0.1 * normalRandom(wt),
      )),
        ($s = Math.min(
          0.93,
          Math.max(0.6, 1 - G[6] / 100 + 0.025 * Lt + 0.02 * normalRandom(wt)),
        )));
    const xn = Math.max(...Vn),
      ns = Vn.map((vn) => Math.exp(vn - xn)),
      En = ns.reduce((vn, fe) => vn + fe, 0);
    return {
      i: y.i,
      uf: y.uf,
      el: it,
      sections: vt,
      w: It,
      u: U,
      turnout: $s,
      share: ns.map((vn) => vn / En),
    };
  }
}

export function calibrateMunicipalModels(
  municipalModels,
  states,
  presidentialShares,
) {
  for (let y = 0; y < 3; y++)
    for (const Z of states) {
      const G = presidentialShares(Z),
        it = G.map(() => 0),
        vt = municipalModels.filter((It) => It.uf === Z);
      for (const It of vt) It.share.forEach((U, Et) => (it[Et] += U * It.el));
      const St = it.reduce((It, U) => It + U, 0);
      for (const It of vt) {
        const U = It.share.map((Lt, wt) => (Lt * G[wt]) / (it[wt] / St)),
          Et = U.reduce((Lt, wt) => Lt + wt, 0);
        It.share = U.map((Lt) => Lt / Et);
      }
    }
}

function historicalMunicipalVote(
  { previousFields, validFirstRoundVotes, normalRandom },
  municipalVotes,
  stateVotes,
  shares,
  firstIndex,
  secondIndex,
  regionalNoise,
  random,
) {
  const municipalValid = validFirstRoundVotes(municipalVotes) || 1,
    stateValid = validFirstRoundVotes(stateVotes),
    relativeLogShare = (field) =>
      Math.log(
        Math.max(
          0.001,
          municipalVotes[field] /
            municipalValid /
            (stateVotes[field] / stateValid),
        ),
      ),
    minorPartyLogShare = Math.log(
      Math.max(
        0.001,
        (municipalVotes[previousFields.tebet_1t] +
          municipalVotes[previousFields.ciro_1t]) /
          municipalValid /
          ((stateVotes[previousFields.tebet_1t] +
            stateVotes[previousFields.ciro_1t]) /
            stateValid),
      ),
    );
  const logits = shares.map(
    (field, candidateIndex) =>
      Math.log(Math.max(field, 1e-4)) +
      (candidateIndex === firstIndex
        ? relativeLogShare(previousFields.lula_1t)
        : candidateIndex === secondIndex
          ? relativeLogShare(previousFields.bolsonaro_1t)
          : 0.6 * minorPartyLogShare +
            0.15 * regionalNoise * (candidateIndex % 2 ? 1 : -1)) +
      0.06 * normalRandom(random),
  );
  const turnout = Math.min(
    0.95,
    Math.max(
      0.5,
      (municipalValid +
        municipalVotes[previousFields.brancos_1t] +
        municipalVotes[previousFields.nulos_1t]) /
        municipalVotes[previousFields.aptos_1t],
    ),
  );
  return { logits, turnout };
}
