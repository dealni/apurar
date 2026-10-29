export const emptyBox = () => [Infinity, Infinity, -Infinity, -Infinity];

export function includePoint(box, [x, y]) {
  box[0] = Math.min(box[0], x);
  box[1] = Math.min(box[1], y);
  box[2] = Math.max(box[2], x);
  box[3] = Math.max(box[3], y);
}

export function includeBox(box, other) {
  includePoint(box, [other[0], other[1]]);
  includePoint(box, [other[2], other[3]]);
}

export function appendLine(path, points) {
  path.moveTo(points[0][0], points[0][1]);
  for (let i = 1; i < points.length; i++)
    path.lineTo(points[i][0], points[i][1]);
}

export function signedArea(points) {
  let area = 0;
  for (
    let i = 0, previous = points.length - 1;
    i < points.length;
    previous = i++
  )
    area +=
      (points[previous][0] + points[i][0]) *
      (points[previous][1] - points[i][1]);
  return area / 2;
}

export function centroid(points) {
  let area = 0;
  let x = 0;
  let y = 0;
  for (
    let i = 0, previous = points.length - 1;
    i < points.length;
    previous = i++
  ) {
    const cross =
      points[previous][0] * points[i][1] - points[i][0] * points[previous][1];
    area += cross;
    x += (points[previous][0] + points[i][0]) * cross;
    y += (points[previous][1] + points[i][1]) * cross;
  }
  return area ? [x / (3 * area), y / (3 * area)] : points[0];
}

export function deltaPolygon(rings, project, box = emptyBox()) {
  const path = new Path2D();
  for (const ring of rings) {
    let x = 0;
    let y = 0;
    for (let i = 0; i + 1 < ring.length; i += 2) {
      x += ring[i];
      y += ring[i + 1];
      const point = project(x, y);
      if (i) path.lineTo(...point);
      else path.moveTo(...point);
      includePoint(box, point);
    }
    path.closePath();
  }
  return { path, box };
}
