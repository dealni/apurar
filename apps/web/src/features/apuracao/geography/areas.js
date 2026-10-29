import { deltaPolygon, emptyBox } from './primitives.js';
import { centralIndices, medianGap, pointBounds, zoneFocus } from './focus.js';

function createZones(data, project) {
  const bounds = emptyBox();
  const paths = data.a.map(
    (rings) => deltaPolygon(rings, project, bounds).path,
  );
  const centers = data.c.map((point) => project(...point));
  const points = (data.p || data.c).map((point) => project(...point));
  const populated = data.z
    .map((zone, index) => index)
    .filter((index) => data.a[index].length);
  return {
    z: data.z,
    el: data.el,
    sec: data.sec,
    nome: data.nome,
    c: centers,
    p: points,
    paths,
    has: data.a.map((rings) => rings.length > 0),
    box: zoneFocus(populated, points, data.el),
    ext: populated.length ? bounds : null,
  };
}

export function createZoneAccessor(getZones, project) {
  const cache = new Map();
  return (municipality) => {
    const zones = getZones();
    const data = zones && zones.m && zones.m[municipality];
    if (!data) return null;
    if (!cache.has(municipality))
      cache.set(municipality, createZones(data, project));
    return cache.get(municipality);
  };
}

export function createPlaces(data, project) {
  const polygons = data.a.map((rings) =>
    rings.length ? deltaPolygon(rings, project) : null,
  );
  const points = data.c.map((point) => (point ? project(...point) : null));
  const populated = points
    .map((point, index) => index)
    .filter((index) => points[index]);
  const central = centralIndices(populated, points, data.el);
  return {
    paths: polygons.map((polygon) => (polygon ? polygon.path : null)),
    boxes: polygons.map((polygon) => (polygon ? polygon.box : null)),
    pts: points,
    order: populated.slice().sort((a, b) => data.el[b] - data.el[a]),
    gap: medianGap(populated, points),
    bc: data.bc.map((point) => (point ? project(...point) : null)),
    box: central.length > 1 ? pointBounds(central, points) : null,
  };
}

export function createDivisions(data, project) {
  const polygons = data.a.map((rings) => deltaPolygon(rings, project));
  return {
    paths: polygons.map((polygon) => polygon.path),
    boxes: polygons.map((polygon) => polygon.box),
    bc: data.l.map((point) => (point ? project(...point) : null)),
  };
}
