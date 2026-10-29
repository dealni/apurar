import { Geo } from "../geography.js";
import { Te } from "./formatacao-e-acessibilidade-1.js";
import {
  resultadoPreservado,
  candidaturasObservadas,
} from "./resultado-governador.js";
import { exportarMapaOficial } from "./exportar-mapa-oficial.js";

export async function exportarGovernadores({
  selected,
  focus,
  town,
  governor,
}) {
  const rows = selected
    ? [[focus, selected]]
    : Object.entries(governor.states).filter(([, item]) => item.inRace);
  const municipality = town == null ? null : Geo.munis[town];
  const lines = [
    "Apurar · Governadores · 2º turno de 2026",
    "Resultados oficiais do TSE",
    ...rows.flatMap(([uf, item]) => {
      const preserved = resultadoPreservado(item);
      const known = item.available || preserved;
      return [
        municipality
          ? `${municipality.name} · ${municipality.uf} · código IBGE ${municipality.id}`
          : `${Te[uf] || uf} · ${uf}`,
        item.status,
        item.asOf
          ? "Fonte: " +
            new Date(item.asOf).toLocaleString("pt-BR", {
              timeZone: "America/Sao_Paulo",
            }) +
            " · Brasília"
          : "Horário da fonte indisponível",
        known
          ? `Seções totalizadas: ${format(item.result.sections.counted)} de ${format(item.result.sections.total)}`
          : "Seções indisponíveis",
        ...candidaturasObservadas(item, preserved).map((candidate) => ({
          color: candidate.color,
          text:
            candidate.name +
            " · " +
            (candidate.votes == null
              ? "Votos indisponíveis"
              : candidate.votes.toLocaleString("pt-BR") + " votos"),
        })),
      ];
    }),
    "Cores por candidatura em cada UF. Cinza: empate, sem votos, sem dados ou sem segundo turno.",
    location.host,
  ];
  return exportarMapaOficial({
    mapSelector: ".gov-stage canvas.map",
    lines,
    filename:
      "apurar-governadores" +
      (focus ? "-" + focus.toLowerCase() : "") +
      (town != null ? "-municipio" : "") +
      ".png",
  });
}

function format(value) {
  return value == null ? "Indisponível" : value.toLocaleString("pt-BR");
}
