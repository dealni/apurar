import './object-helpers.js';
import { createTopology } from './geography/topology.js';
import { createProjection } from './geography/projection.js';
import { createWorld } from './geography/world.js';
import {
  createDivisions,
  createPlaces,
  createZoneAccessor,
} from './geography/areas.js';

const topology = createTopology(window.BRASIL);
const projection = createProjection(...topology.origin);
const { origin, ...map } = topology;
const Geo = {
  ...map,
  ...projection,
  world: createWorld(window.MUNDO, window.EXTERIOR, origin),
  zones: createZoneAccessor(() => window.ZONAS, projection.project),
  places: (data) => createPlaces(data, projection.project),
  divisions: (data) => createDivisions(data, projection.project),
};

export { Geo };
