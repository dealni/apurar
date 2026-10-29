import {
  html,
  useState,
  useEffect,
  ht,
  _t,
} from "./formatacao-e-acessibilidade-1.js";
import { loadFirstRoundMunicipality } from "../../../integration/first-round-municipality.ts";
import "../styles/47-primeiro-turno-tooltip.css";

export function PrimeiroTurnoMunicipal({ place }) {
  const key = `${place.uf}:${place.id}`;
  const [state, setState] = useState(null);
  useEffect(() => {
    let active = true;
    loadFirstRoundMunicipality(place.uf, place.id).then(
      (result) => {
        if (active) setState({ key, result });
      },
      () => {
        if (active) setState({ key, result: null });
      },
    );
    return () => {
      active = false;
    };
  }, [key, place.uf, place.id]);
  const ready = state?.key === key;
  return html`<section
    class="tip-first-round"
    aria-label="Resultado do primeiro turno de 2026"
  >
    <h4>1º turno · 2026</h4>
    ${
      !ready
        ? html`<p class="note">Carregando o primeiro turno…</p>`
        : !state.result
          ? html`<p class="note">
              Resultado do primeiro turno indisponível para esta cidade.
            </p>`
          : html`${state.result.candidates.map(
                (candidate) =>
                  html`<div class="tip-first-round-row" key=${candidate.id}>
                    <span>${candidate.name}</span
                    ><span class="tn"
                      >${candidate.share == null ? "—" : _t(candidate.share, 2) + "%"}<small
                        >${ht(candidate.votes)} votos</small
                      ></span
                    >
                  </div>`,
              )}
              <p class="note">
                Percentuais sobre todos os votos válidos.<br />Fonte: arquivo do
                1º turno.
              </p>`
    }
  </section>`;
}
