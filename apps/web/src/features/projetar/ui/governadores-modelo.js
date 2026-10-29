import { useMemo } from "./formatacao-e-acessibilidade-1.js";
import { Feed } from "../feed.js";
import { Geo } from "../geography.js";
import { Sim } from "../simulation.js";
import { createGovernorMainModel } from "../../../integration/governor-main-model.ts";

export function useModeloGovernadores(payload) {
  return useMemo(
    () =>
      createGovernorMainModel(
        Feed.demonstration ? null : payload,
        Geo.munis,
        Sim.ALL,
      ),
    [payload],
  );
}

export function resultadoGovernadorSelecionado(governor, focus, town) {
  return town != null
    ? governor.municipalities[town]
    : focus
      ? governor.states[focus]
      : null;
}
