import "./object-helpers.js";
import { createTopology } from "./geography/topology.js";
import { createProjection } from "./geography/projection.js";
import { createWorld } from "./geography/world.js";

const topology = createTopology(window.BRASIL);
const projection = createProjection(...topology.origin);
const { origin, ...map } = topology;
const Geo = {
  ...map,
  ...projection,
  world: createWorld(window.MUNDO, window.EXTERIOR, origin),
  // Compatibilidade da camada de desenho: o feed não oferece zonas.
  zones: () => null,
};

export { Geo };
