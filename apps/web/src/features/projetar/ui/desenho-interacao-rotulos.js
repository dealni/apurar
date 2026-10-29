import { Ti, Li } from "./mapa-dados-1.js";
import { Lr } from "./mapa-geometria-1.js";
import { useMemo } from "./formatacao-e-acessibilidade-1.js";
import { Geo } from "../geography.js";
import { Ks, Kn } from "./apuracao-e-votos-1.js";
import { Qu } from "./mapa-selecao-1.js";
import { Sim } from "../simulation.js";
export function useRotulosDoMapa({ mapView, props }) {
  const { m: modelo, mode, focus, rect, small = false, tv = false } = props;
  const qs =
      !small &&
      !tv &&
      !!mapView.on &&
      (Geo.box[2] - Geo.box[0]) * mapView.on.k < 420,
    uo = mode !== "pres" && mode !== "dep" && !small && !qs,
    zo = (A) => {
      const F = modelo.ufs[A];
      return !F || !(F.pst > 0 && Ks(F, mode))
        ? 0
        : Math.min(
            Kn(F, mode).length,
            mode === "sen" || Lr(F, mode) === "run" ? 2 : 1,
          );
    },
    Do = uo ? Sim.UFS.map(zo).join("") : "",
    Qs = useMemo(
      () =>
        mapView.on && !focus && !mapView.cn
          ? Qu(
              mapView.on,
              rect,
              mapView.Bn,
              small,
              tv,
              qs,
              uo ? zo : null,
              mode === "pres",
              mapView.xs,
            )
          : [],
      [
        mapView.on && mapView.on.k,
        mapView.on && mapView.on.ox,
        mapView.on && mapView.on.oy,
        rect.x0,
        rect.x1,
        rect.y0,
        rect.y1,
        mapView.Bn,
        small,
        tv,
        qs,
        Do,
        mode,
        mapView.xs,
        !!focus,
        mapView.cn,
      ],
    ),
    pa = mapView.on ? mapView.on.ox + Ti * mapView.on.k : 0,
    sr = mapView.on ? mapView.on.oy + Li * mapView.on.k : 0;
  return {
    qs,
    uo,
    Qs,
    pa,
    sr,
  };
}
