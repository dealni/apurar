import { xn, ns } from "./municipios-e-distritos-1.js";
import { Xt } from "./formatacao-e-acessibilidade-1.js";
import { _nState, _eState } from "./mapa-dados-1.js";
export function derivarContextoDoMapa({
  town,
  focus,
  mode,
  Y,
  modelo,
  bairro,
}) {
  const E =
      town != null && focus !== "ZZ" && mode === "pres" && Y !== "votes"
        ? xn(town)
        : null,
    T = E && E.shaped && (Xt === 1 || !modelo.live) ? E : null,
    Ct = obterContornoAlternativo({
      E,
      town,
      focus,
      mode,
      Y,
      modelo,
    }),
    xt =
      (_nState.value
        ? _nState.value.key
        : _eState.value
          ? _eState.value.key
          : "") +
      "|" +
      (E ? "L" + town : "") +
      "|" +
      (bairro == null ? "" : bairro);
  return {
    E,
    T,
    Ct,
    xt,
  };
}
function obterContornoAlternativo({ E, town, focus, mode, Y, modelo }) {
  return (
    !E &&
    town != null &&
    focus !== "ZZ" &&
    mode === "pres" &&
    Y !== "votes" &&
    (Xt === 1 || !modelo.live) &&
    ns(town)
  );
}
