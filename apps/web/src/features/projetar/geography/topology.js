import {
  appendLine,
  centroid,
  emptyBox,
  includeBox,
  includePoint,
  signedArea,
} from "./primitives.js";

function decodeArcs(topology) {
  const [scaleX, scaleY] = topology.transform.scale;
  const [translateX, translateY] = topology.transform.translate;
  const bounds = emptyBox();
  const arcs = topology.arcs.map((arc) => {
    let x = 0;
    let y = 0;
    return arc.map(([dx, dy]) => {
      x += dx;
      y += dy;
      const point = [
        (x * scaleX + translateX) / 1e3,
        -(y * scaleY + translateY) / 1e3,
      ];
      includePoint(bounds, point);
      return point;
    });
  });
  for (const arc of arcs)
    for (const point of arc) {
      point[0] -= bounds[0];
      point[1] -= bounds[1];
    }
  return { arcs, bounds };
}

export function joinArcs(indices, arcs) {
  const points = [];
  for (const index of indices) {
    const arc = index < 0 ? arcs[~index].slice().reverse() : arcs[index];
    for (let i = points.length ? 1 : 0; i < arc.length; i++)
      points.push(arc[i]);
  }
  return points;
}

function polygonRings(geometry) {
  if (geometry.type === "Polygon") return [geometry.arcs];
  if (geometry.type === "MultiPolygon") return geometry.arcs;
  return [];
}

function focusBounds(components, largestBox) {
  const focusBox = emptyBox();
  // Coordenadas projetadas em km. Componentes a mais de 150 km da caixa
  // do maior anel não ampliam a câmera; box/path conservam toda a malha.
  for (const box of components) {
    const dx = Math.max(0, largestBox[0] - box[2], box[0] - largestBox[2]);
    const dy = Math.max(0, largestBox[1] - box[3], box[1] - largestBox[3]);
    if (Math.hypot(dx, dy) <= 150) includeBox(focusBox, box);
  }
  return focusBox;
}

function createMunicipality(geometry, index, arcs, owners) {
  const path = new Path2D();
  const box = emptyBox();
  const components = [];
  let largestBox = null;
  let largestRing = null;
  let largestArea = 0;
  let area = 0;
  for (const polygon of polygonRings(geometry)) {
    polygon.forEach((ring, ringIndex) => {
      const points = joinArcs(ring, arcs);
      appendLine(path, points);
      path.closePath();
      for (const point of points) includePoint(box, point);
      if (ringIndex === 0) {
        const componentBox = emptyBox();
        for (const point of points) includePoint(componentBox, point);
        components.push(componentBox);
        const ringArea = Math.abs(signedArea(points));
        area += ringArea;
        if (ringArea > largestArea) {
          largestArea = ringArea;
          largestRing = points;
          largestBox = componentBox;
        }
      }
      for (const arc of ring) owners[arc < 0 ? ~arc : arc].push(index);
    });
  }
  const properties = geometry.properties;
  return {
    i: index,
    id: properties.id,
    name: properties.n,
    uf: properties.uf,
    pop: properties.p,
    path,
    c: largestRing ? centroid(largestRing) : [0, 0],
    km2: area,
    box,
    focusBox: largestBox ? focusBounds(components, largestBox) : box.slice(),
  };
}

function borderType(neighbors, municipalities) {
  if (neighbors.length < 2) return "edge";
  return municipalities[neighbors[0]].uf !== municipalities[neighbors[1]].uf
    ? "uf"
    : "muni";
}

function createBorders(arcs, owners, municipalities) {
  const lines = { edge: new Path2D(), uf: new Path2D(), muni: new Path2D() };
  const outlines = {};
  const municipalLines = {};
  arcs.forEach((arc, index) => {
    const neighbors = [...new Set(owners[index])];
    const type = borderType(neighbors, municipalities);
    appendLine(lines[type], arc);
    if (type !== "muni") {
      for (const neighbor of neighbors) {
        const uf = municipalities[neighbor].uf;
        outlines[uf] ||= new Path2D();
        appendLine(outlines[uf], arc);
      }
    } else {
      const uf = municipalities[neighbors[0]].uf;
      municipalLines[uf] ||= new Path2D();
      appendLine(municipalLines[uf], arc);
    }
  });
  return { lines, outlines, municipalLines };
}

function createStates(municipalities, borders) {
  const states = {};
  const box = emptyBox();
  for (const municipality of municipalities) {
    const state = (states[municipality.uf] ||= {
      uf: municipality.uf,
      munis: [],
      pop: 0,
      box: emptyBox(),
      cx: 0,
      cy: 0,
      km2: 0,
    });
    state.munis.push(municipality.i);
    state.pop += municipality.pop;
    state.km2 += municipality.km2;
    // Fernando de Noronha continua fora do enquadramento continental.
    if (String(municipality.id) !== "2605459") {
      includeBox(state.box, municipality.focusBox);
      includeBox(box, municipality.focusBox);
    }
    state.cx += municipality.c[0] * municipality.km2;
    state.cy += municipality.c[1] * municipality.km2;
  }
  for (const state of Object.values(states)) {
    state.c = [state.cx / state.km2, state.cy / state.km2];
    state.outline = borders.outlines[state.uf];
    state.muniLines = borders.municipalLines[state.uf] || new Path2D();
  }
  return { states, box };
}

function createOutline(arcs, owners, municipalities, states) {
  const selected = new Set(states);
  const path = new Path2D();
  arcs.forEach((arc, index) => {
    const neighbors = [...new Set(owners[index])];
    const count = neighbors.filter((owner) =>
      selected.has(municipalities[owner].uf),
    ).length;
    if (!count || (neighbors.length > 1 && count === neighbors.length)) return;
    appendLine(path, arc);
  });
  return path;
}

export function createTopology(topology) {
  const { arcs, bounds } = decodeArcs(topology);
  const owners = arcs.map(() => []);
  const municipalities = topology.objects.municipios.geometries.map(
    (geometry, index) => createMunicipality(geometry, index, arcs, owners),
  );
  const borders = createBorders(arcs, owners, municipalities);
  const { states, box } = createStates(municipalities, borders);
  return {
    W: bounds[2] - bounds[0],
    H: bounds[3] - bounds[1],
    box,
    munis: municipalities,
    lines: borders.lines,
    ufs: states,
    arcs,
    outline: (selected) =>
      createOutline(arcs, owners, municipalities, selected),
    origin: bounds.slice(0, 2),
  };
}
