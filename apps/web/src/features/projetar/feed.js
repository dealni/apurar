import { createApurarFeed } from "../../integration/client.ts";
import { Geo } from "./geography.js";
import { Sim } from "./simulation.js";
const Feed = createApurarFeed({
  places: Geo.munis,
  states: Sim.ALL,
  candidates: Sim.PRES,
  exteriorCount: window.EXTERIOR?.cidades?.length || 0,
  exteriorPlaces: Geo.world?.cities || [],
});
export { Feed };
window.APURAR_CURRENT_VIEW = () => Feed.peek() || Feed.empty();
