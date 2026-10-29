const baseRoadColor = [34, 32, 29],
  roadColor = (H) =>
    '#' +
    baseRoadColor
      .map((pt) =>
        Math.round(pt + (250 - pt) * H)
          .toString(16)
          .padStart(2, '0'),
      )
      .join(''),
  roadClasses = [
    ['service', 13.5, 0.8, 0.45, 0.06],
    ['minor', 11.5, 1.2, 0.5, 0.11],
    ['tertiary', 10.5, 1.8, 0.6, 0.16],
    ['secondary', 9, 2.2, 0.75, 0.2],
    ['primary', 8, 2.6, 0.9, 0.24],
    ['trunk', 0, 3, 1.1, 0.29],
    ['motorway', 0, 3.2, 1.2, 0.32],
  ],
  layers = [
    {
      L: 'water',
      fill: '#15191C',
      z: 0,
      ok: (H) => H.c !== 'swimming_pool',
    },
    {
      L: 'landcover',
      fill: '#24251F',
      z: 11,
      ok: (H) => H.c === 'wood' || H.s === 'park',
    },
    {
      L: 'park',
      fill: '#24251F',
      z: 11,
      ok: () => !0,
    },
    {
      L: 'waterway',
      line: '#181D21',
      w: 1.8,
      min: 1,
      z: 9,
      ok: (H) => H.c === 'river' || H.c === 'canal',
    },
    {
      L: 'waterway',
      line: '#181D21',
      w: 0.9,
      min: 0.5,
      z: 12.5,
      ok: (H) => H.c === 'stream',
    },
    {
      L: 'transportation',
      line: roadColor(0.05),
      w: 1,
      min: 0.5,
      z: 11.5,
      ok: (H) => H.b === 'tunnel' && roadClasses.some((pt) => pt[0] === H.c),
    },
    ...roadClasses.map(([H, pt, me, V, et]) => ({
      L: 'transportation',
      line: roadColor(et),
      w: me,
      min: V,
      z: pt,
      ok: (ct) => ct.c === H && ct.b !== 'tunnel',
    })),
    {
      L: 'transportation',
      line: roadColor(0.16),
      w: 1.1,
      min: 0.6,
      z: 10,
      dash: [4, 3],
      ok: (H) => (H.c === 'rail' || H.c === 'transit') && H.b !== 'tunnel',
    },
  ],
  adjustZoom = (H) => H + Math.min(1, Math.max(0, (12 - H) / 2)),
  layersByName = new Map();
layers.forEach((H, pt) => {
  (layersByName.has(H.L) || layersByName.set(H.L, []),
    layersByName.get(H.L).push(pt));
});
export {
  baseRoadColor,
  roadColor,
  roadClasses,
  layers,
  adjustZoom,
  layersByName,
};
