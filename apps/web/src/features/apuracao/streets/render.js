import { layers, adjustZoom } from './styles.js';

function transformToTile(context, tile, viewport, pixelRatio) {
  context.setTransform(
    pixelRatio * viewport.k,
    0,
    0,
    pixelRatio * viewport.k,
    pixelRatio * (viewport.ox + tile.o[0] * viewport.k),
    pixelRatio * (viewport.oy + tile.o[1] * viewport.k),
  );
}

function paintLayer(context, tiles, layer, index, viewport, pixelRatio) {
  for (const tile of tiles) {
    const path = tile.paths[index];
    if (!path) continue;
    transformToTile(context, tile, viewport, pixelRatio);
    if (layer.fill) context.fill(path);
    else context.stroke(path);
  }
}

export function renderTiles(context, tiles, zoom, viewport, pixelRatio) {
  const lineScale = 1.45 ** (zoom - 14);
  const adjustedZoom = adjustZoom(zoom);
  layers.forEach((layer, index) => {
    if (adjustedZoom < layer.z) return;
    if (layer.fill) {
      context.fillStyle = layer.fill;
    } else {
      context.strokeStyle = layer.line;
      context.lineWidth = Math.max(layer.min, layer.w * lineScale) / viewport.k;
      context.setLineDash(
        layer.dash ? layer.dash.map((segment) => segment / viewport.k) : [],
      );
    }
    paintLayer(context, tiles, layer, index, viewport, pixelRatio);
  });
  context.setLineDash([]);
}
