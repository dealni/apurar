import { Feed } from "../feed.js";
import { Oe, je } from "./formatacao-e-acessibilidade-1.js";
import { We, Fe } from "../object-helpers.js";
import { Sim } from "../simulation.js";
export let kd, wd, Cd;
export function initialize() {
  kd = (() => {
    const t = !Feed.LIVE && (location.hash || "").match(/t(\d{2})([0-5]\d)/),
      e = t ? +t[1] * 60 + +t[2] : Oe;
    return e >= Oe && e <= je ? e : Oe;
  })();
  wd = Feed.empty();
  Cd = 6e3;
}
