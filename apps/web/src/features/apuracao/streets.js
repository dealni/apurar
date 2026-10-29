import './object-helpers.js';
import { DEGREES_TO_RADIANS } from './streets/projection.js';
import {
  zoomForMunicipality,
  visibleTiles,
  municipalityCenter,
} from './streets/selection.js';
import { renderTiles } from './streets/render.js';
import { TileCache } from './streets/cache.js';
import { fallbackClips } from './streets/fallbacks.js';

function drawStreets(cache, context, viewport, municipality, width, height) {
  const visible = visibleTiles(
    municipality,
    viewport,
    width,
    height,
    cache.maxZoom,
  );
  if (!visible) return;
  const { ready, pending } = cache.request(visible.list);
  const pixelRatio = context.getTransform().a / viewport.k;
  context.save();
  context.lineCap = 'round';
  context.lineJoin = 'round';
  for (const [tile, clip] of fallbackClips(cache, pending)) {
    context.save();
    context.clip(clip);
    renderTiles(context, [tile], visible.Z, viewport, pixelRatio);
    context.restore();
  }
  renderTiles(context, ready, visible.Z, viewport, pixelRatio);
  context.restore();
}

function createStreets() {
  const config = (window.APURACAO || {}).ruas;
  if (
    !config ||
    !config.url ||
    typeof fetch !== 'function' ||
    typeof Path2D !== 'function' ||
    typeof TextDecoder !== 'function'
  )
    return null;
  const cache = new TileCache(config);
  return {
    draw: (...arguments_) => drawStreets(cache, ...arguments_),
    shows: (municipality, viewport) =>
      municipality != null &&
      !!viewport &&
      zoomForMunicipality(municipality, viewport) >= 7,
    kAt: (municipality, zoom) =>
      (2 ** zoom * 512e3) /
      (40075016686e-3 *
        Math.cos(municipalityCenter(municipality)[1] * DEGREES_TO_RADIANS)),
    credit: Array.isArray(config.credito) ? config.credito : [],
    on: (listener) => {
      cache.listeners.add(listener);
      return () => cache.listeners.delete(listener);
    },
    version: () => cache.revision,
  };
}

const Streets = createStreets();
export { Streets };
