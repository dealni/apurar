const RAD = Math.PI / 180;
const RADIUS = 6378137;
const FLATTENING = 1 / 298.257222101;
const ECCENTRICITY = 2 * FLATTENING - FLATTENING * FLATTENING;
const MERIDIAN =
  1 -
  ECCENTRICITY / 4 -
  (3 * ECCENTRICITY ** 2) / 64 -
  (5 * ECCENTRICITY ** 3) / 256;
const SECOND =
  (3 * ECCENTRICITY) / 8 +
  (3 * ECCENTRICITY ** 2) / 32 +
  (45 * ECCENTRICITY ** 3) / 1024;
const FOURTH = (15 * ECCENTRICITY ** 2) / 256 + (45 * ECCENTRICITY ** 3) / 1024;
const SIXTH = (35 * ECCENTRICITY ** 3) / 3072;

export function projectLonLat(longitude, latitude) {
  const phi = latitude * RAD;
  const lambda = (longitude + 54) * RAD;
  if (Math.abs(phi) < 1e-12) return [5e6 + RADIUS * lambda, 1e7];
  const sin = Math.sin(phi);
  const cotangentRadius =
    RADIUS / Math.sqrt(1 - ECCENTRICITY * sin * sin) / Math.tan(phi);
  const angle = lambda * sin;
  return [
    5e6 + cotangentRadius * Math.sin(angle),
    1e7 +
      RADIUS *
        (MERIDIAN * phi -
          SECOND * Math.sin(2 * phi) +
          FOURTH * Math.sin(4 * phi) -
          SIXTH * Math.sin(6 * phi)) +
      cotangentRadius * (1 - Math.cos(angle)),
  ];
}

function invertProjection(x, y) {
  let latitude = (y - 1e7) / 110574;
  let longitude = -54 + (x - 5e6) / (111320 * Math.cos(latitude * RAD));
  for (let i = 0; i < 6; i++) {
    const base = projectLonLat(longitude, latitude);
    const east = projectLonLat(longitude + 1e-5, latitude);
    const north = projectLonLat(longitude, latitude + 1e-5);
    const dxLon = (east[0] - base[0]) / 1e-5;
    const dyLon = (east[1] - base[1]) / 1e-5;
    const dxLat = (north[0] - base[0]) / 1e-5;
    const dyLat = (north[1] - base[1]) / 1e-5;
    const determinant = dxLon * dyLat - dxLat * dyLon;
    const dx = x - base[0];
    const dy = y - base[1];
    longitude += (dyLat * dx - dxLat * dy) / determinant;
    latitude += (dxLon * dy - dyLon * dx) / determinant;
    if (Math.abs(dx) + Math.abs(dy) < 0.001) break;
  }
  return [longitude, latitude];
}

export function createProjection(minX, minY) {
  const project = (x, y) => [x / 1e3 - minX, -y / 1e3 - minY];
  return {
    project,
    fromLL: (longitude, latitude) =>
      project(...projectLonLat(longitude, latitude)),
    toLL: (x, y) => invertProjection((x + minX) * 1e3, -(y + minY) * 1e3),
  };
}
