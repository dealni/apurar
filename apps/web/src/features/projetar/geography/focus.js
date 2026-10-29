import { emptyBox, includePoint } from "./primitives.js";

export function pointBounds(indices, points) {
  const box = emptyBox();
  for (const index of indices) includePoint(box, points[index]);
  return box;
}

export function centralIndices(indices, points, weights) {
  const total = indices.reduce((sum, index) => sum + weights[index], 0) || 1;
  const x =
    indices.reduce((sum, index) => sum + points[index][0] * weights[index], 0) /
    total;
  const y =
    indices.reduce((sum, index) => sum + points[index][1] * weights[index], 0) /
    total;
  const sorted = indices
    .slice()
    .sort(
      (a, b) =>
        Math.hypot(points[a][0] - x, points[a][1] - y) -
        Math.hypot(points[b][0] - x, points[b][1] - y),
    );
  const central = [];
  let accumulated = 0;
  for (const index of sorted) {
    central.push(index);
    accumulated += weights[index];
    if (accumulated >= 0.7 * total) break;
  }
  return central;
}

export function medianGap(indices, points) {
  const distances = [];
  for (const index of indices) {
    let nearest = Infinity;
    for (const other of indices) {
      if (other === index) continue;
      const dx = points[index][0] - points[other][0];
      const dy = points[index][1] - points[other][1];
      nearest = Math.min(nearest, dx * dx + dy * dy);
    }
    if (nearest < Infinity) distances.push(Math.sqrt(nearest));
  }
  distances.sort((a, b) => a - b);
  return distances.length ? distances[distances.length >> 1] : 0;
}

const extent = (box) => Math.max(box[2] - box[0], box[3] - box[1]);

export function zoneFocus(indices, points, weights) {
  if (!indices.length) return null;
  const full = pointBounds(indices, points);
  const central = pointBounds(centralIndices(indices, points, weights), points);
  return extent(full) > 2.2 * Math.max(extent(central), 4) ? central : full;
}
