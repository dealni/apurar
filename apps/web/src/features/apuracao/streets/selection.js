import { Geo } from '../geography.js';
import { DEGREES_TO_RADIANS, lonLatToTile } from './projection.js';
import { adjustZoom } from './styles.js';

const MIN_STREET_ZOOM = 7;
const MAX_VISIBLE_TILES = 30;
const municipalityCenters = new Map();

export function municipalityCenter(municipality) {
  if (!municipalityCenters.has(municipality)) {
    const center = Geo.munis[municipality].c;
    municipalityCenters.set(municipality, Geo.toLL(center[0], center[1]));
  }
  return municipalityCenters.get(municipality);
}

export function zoomForMunicipality(municipality, viewport) {
  return Math.log2(
    (40075016686e-3 *
      Math.cos(municipalityCenter(municipality)[1] * DEGREES_TO_RADIANS) *
      viewport.k) /
      512e3,
  );
}

function visibleBounds(municipality, viewport, width, height) {
  const bounds = Geo.munis[municipality].box;
  const left = Math.max(bounds[0], -viewport.ox / viewport.k);
  const top = Math.max(bounds[1], -viewport.oy / viewport.k);
  const right = Math.min(bounds[2], (width - viewport.ox) / viewport.k);
  const bottom = Math.min(bounds[3], (height - viewport.oy) / viewport.k);
  if (!(right > left && bottom > top)) return null;
  return { left, top, right, bottom };
}

function geographicBounds(bounds) {
  const corners = [
    Geo.toLL(bounds.left, bounds.top),
    Geo.toLL(bounds.right, bounds.top),
    Geo.toLL(bounds.left, bounds.bottom),
    Geo.toLL(bounds.right, bounds.bottom),
  ];
  return {
    west: Math.min(...corners.map((point) => point[0])),
    east: Math.max(...corners.map((point) => point[0])),
    south: Math.min(...corners.map((point) => point[1])),
    north: Math.max(...corners.map((point) => point[1])),
  };
}

function tileRange(bounds, initialZoom) {
  let zoom = initialZoom;
  while (true) {
    const first = lonLatToTile(zoom, bounds.west, bounds.north);
    const last = lonLatToTile(zoom, bounds.east, bounds.south);
    const count = (last[0] - first[0] + 1) * (last[1] - first[1] + 1);
    if (count <= MAX_VISIBLE_TILES || zoom <= 1) return { zoom, first, last };
    zoom--;
  }
}

export function visibleTiles(municipality, viewport, width, height, maxZoom) {
  const streetZoom = zoomForMunicipality(municipality, viewport);
  if (!(streetZoom >= MIN_STREET_ZOOM)) return null;
  const bounds = visibleBounds(municipality, viewport, width, height);
  if (!bounds) return null;
  const range = tileRange(
    geographicBounds(bounds),
    Math.min(maxZoom, Math.round(adjustZoom(streetZoom))),
  );
  const center = Geo.toLL(
    (bounds.left + bounds.right) / 2,
    (bounds.top + bounds.bottom) / 2,
  );
  const centerTile = lonLatToTile(range.zoom, center[0], center[1]);
  const coordinates = [];
  for (let x = range.first[0]; x <= range.last[0]; x++) {
    for (let y = range.first[1]; y <= range.last[1]; y++) {
      coordinates.push([range.zoom, x, y]);
    }
  }
  coordinates.sort(
    (left, right) =>
      Math.hypot(left[1] - centerTile[0], left[2] - centerTile[1]) -
      Math.hypot(right[1] - centerTile[0], right[2] - centerTile[1]),
  );
  return { Z: streetZoom, list: coordinates };
}
