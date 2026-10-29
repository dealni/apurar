import assert from "node:assert/strict";
import { test } from "node:test";
import { inspectTopology } from "./check-geography.mjs";

const header = {
  type: "Topology",
  transform: { scale: [1, 1], translate: [0, 0] },
};
const arcs = [
  [
    [0, 0],
    [1, 0],
    [0, 1],
    [-1, -1],
  ],
];
const polygon = {
  type: "Polygon",
  properties: { id: "5101837", uf: "MT" },
  arcs: [[0]],
};
const identities = { 5101837: "MT:73709" };
test("malha exige cobertura exata do cadastro oficial e aceita arcos invertidos", () => {
  assert.deepEqual(inspectTopology(header, arcs, [polygon], identities), []);
  assert.deepEqual(
    inspectTopology(header, arcs, [{ ...polygon, arcs: [[-1]] }], identities),
    [],
  );
  assert.match(
    inspectTopology(header, arcs, [], identities).join(),
    /sem geometria/,
  );
});
test("geometria duplicada ou associada a outra UF falha", () => {
  assert.match(
    inspectTopology(header, arcs, [polygon, polygon], identities).join(),
    /duplicada/,
  );
  assert.match(
    inspectTopology(
      header,
      arcs,
      [{ ...polygon, properties: { id: "5101837", uf: "PE" } }],
      identities,
    ).join(),
    /sem identidade/,
  );
});
test("malha rejeita anéis vazios e referências fora dos arcos", () => {
  assert.match(
    inspectTopology(
      header,
      arcs,
      [{ ...polygon, arcs: [[]] }],
      identities,
    ).join(),
    /Anel vazio/,
  );
  assert.match(
    inspectTopology(
      header,
      arcs,
      [{ ...polygon, arcs: [[1]] }],
      identities,
    ).join(),
    /Arco inexistente/,
  );
});
test("malha rejeita transformações e coordenadas não finitas", () => {
  assert.match(
    inspectTopology(
      { ...header, transform: { scale: [0, 1], translate: [0, 0] } },
      arcs,
      [polygon],
      identities,
    ).join(),
    /Transformação/,
  );
  assert.match(
    inspectTopology(
      header,
      [
        [
          [NaN, 0],
          [1, 1],
        ],
      ],
      [polygon],
      identities,
    ).join(),
    /coordenada inválida/,
  );
});
