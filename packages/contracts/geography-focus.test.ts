import { afterEach, describe, expect, it, vi } from "vitest";
// @ts-expect-error O módulo legado JavaScript não possui declarações TypeScript.
import { createTopology } from "../../apps/web/src/features/projetar/geography/topology.js";

class RecordedPath {
  points: number[][] = [];
  moveTo(x: number, y: number) {
    this.points.push([x, y]);
  }
  lineTo(x: number, y: number) {
    this.points.push([x, y]);
  }
  closePath() {}
}
afterEach(() => vi.unstubAllGlobals());
function geography(rectangles: number[][]) {
  vi.stubGlobal("Path2D", RecordedPath);
  const arcs = rectangles.map(([x = 0, y = 0, w = 1, h = 1]) => [
    [x, y],
    [w, 0],
    [0, h],
    [-w, 0],
    [0, -h],
  ]);
  return createTopology({
    transform: { scale: [1000, 1000], translate: [0, 0] },
    arcs,
    objects: {
      municipios: {
        geometries: [
          {
            type: "MultiPolygon",
            arcs: rectangles.map((_, i) => [[i]]),
            properties: { id: "3205309", n: "Vitória", uf: "ES", p: 1 },
          },
        ],
      },
    },
  });
}
describe("enquadramento de componentes municipais", () => {
  it("preserva ilhas oceânicas no polígono sem alargar câmeras municipal, estadual e nacional", () => {
    const geo = geography([
      [0, 0, 10, 10],
      [1000, 0, 1, 1],
    ]);
    expect(geo.munis[0].box).toEqual([0, 0, 1001, 10]);
    expect(geo.munis[0].focusBox).toEqual([0, 0, 10, 10]);
    expect(geo.munis[0].path.points).toHaveLength(10);
    expect(geo.ufs.ES.box).toEqual([0, 0, 10, 10]);
    expect(geo.box).toEqual([0, 0, 10, 10]);
    expect(geo.W).toBe(1001);
    expect(geo.munis[0].km2).toBe(101);
  });
  it("inclui componentes próximos e o limite de 150 km", () => {
    const geo = geography([
      [0, 0, 10, 10],
      [160, 0, 1, 1],
    ]);
    expect(geo.munis[0].focusBox).toEqual(geo.munis[0].box);
    expect(geo.box).toEqual([0, 0, 161, 10]);
  });
  it("mede distância euclidiana entre caixas, inclusive separação diagonal", () => {
    const geo = geography([
      [0, 0, 10, 10],
      [120, 120, 1, 1],
    ]);
    expect(geo.munis[0].focusBox).toEqual([0, 111, 10, 121]);
    expect(geo.munis[0].box).toEqual([0, 0, 121, 121]);
  });
  it("usa o maior anel como âncora independentemente da ordem dos componentes", () => {
    const geo = geography([
      [1000, 0, 1, 1],
      [0, 0, 10, 10],
      [160.001, 0, 1, 1],
    ]);
    expect(geo.munis[0].focusBox).toEqual([0, 0, 10, 10]);
    expect(geo.munis[0].path.points).toHaveLength(15);
  });
});
