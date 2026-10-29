/** Curvas de apuração e horários derivados; nenhuma fonte de aleatoriedade. */
export function createProgressCurveFactory({
  stateData,
  progressLogits,
  parseClock,
  openingMinute,
  firstCountMinute,
}) {
  return (y, Z = stateData[y].slice(2, 6), G = progressLogits) => {
    const it = Z.map(parseClock),
      vt = (G[1] - G[0]) / (it[1] - it[0]);
    return (St) => {
      if (St < openingMinute || (y !== 'ZZ' && St < firstCountMinute)) return 0;
      let It;
      if (St <= it[0]) It = G[0] + (St - it[0]) * vt;
      else {
        if (St >= it[it.length - 1]) return 1;
        {
          let Et = 0;
          for (; St > it[Et + 1];) Et++;
          It =
            G[Et] +
            ((G[Et + 1] - G[Et]) * (St - it[Et])) / (it[Et + 1] - it[Et]);
        }
      }
      const U = 1 / (1 + Math.exp(-It));
      return y === 'ZZ' ? Math.max(U, 0.3) : U;
    };
  };
}

export function createArrivalTimes({
  progressCurves,
  firstCountMinute,
  municipalModels,
  exteriorModels,
}) {
  const minuteAtProgress = (y, Z) => {
    const G = progressCurves[y];
    if (G(1560) < Z) return 1 / 0;
    const it = G(firstCountMinute);
    if (it >= Z) return firstCountMinute + (0.5 * Z) / it;
    let vt = firstCountMinute,
      St = 1560;
    for (let It = 0; It < 26; It++) {
      const U = (vt + St) / 2;
      G(U) >= Z ? (St = U) : (vt = U);
    }
    return St;
  };
  const municipalArrival = municipalModels.map((y) => ({
    first: minuteAtProgress(y.uf, y.u + y.w / y.sections),
    done: minuteAtProgress(y.uf, y.u + y.w),
  }));
  const exteriorArrival = exteriorModels.map((y) => ({
    first: y.arrive[0],
    most: y.arrive[Math.max(0, Math.ceil(y.arrive.length * 0.9) - 1)],
    done: y.arrive[y.arrive.length - 1],
  }));
  return { municipalArrival, exteriorArrival };
}

export function formatClock(y) {
  const Z = Math.floor(y / 60) % 24,
    G = Math.floor(y % 60);
  return String(Z).padStart(2, '0') + ':' + String(G).padStart(2, '0');
}
