import { zt } from "./municipios-e-distritos-2.js";
import { resultStatus } from "../../../integration/supplemental-data.ts";
import { officialRows } from "./official-result.js";
import { exportarMapaOficial } from "./exportar-mapa-oficial.js";

const count = (value) =>
  value == null ? "Indisponível" : value.toLocaleString("pt-BR");
export function exportarExterior({ model, country, city }) {
  const place = city == null ? null : zt.cities[city];
  const item = place
    ? model.cities[city]
    : country
      ? model.countries[country]
      : null;
  const title =
    place?.name ||
    zt.countries.find((entry) => entry.iso === country)?.name ||
    "Exterior";
  const lines = ["APURAR · Presidente no exterior · 2º turno", title];
  if (!item)
    lines.push("Resultado oficial indisponível. Ausência de dados não é zero.");
  else adicionarResultado(lines, item, model);
  lines.push("Resultados oficiais.");
  return exportarMapaOficial({
    mapSelector: ".exterior-stage canvas",
    lines,
    filename: `apurar-exterior-${place?.cd || country || "geral"}.png`,
  });
}

function adicionarResultado(lines, item, model) {
  lines.push(
    resultStatus(item),
    "Fonte: " +
      (item.as_of
        ? new Date(item.as_of).toLocaleString("pt-BR", {
            timeZone: "America/Sao_Paulo",
          }) + " · Brasília"
        : "Horário da fonte indisponível"),
  );
  if (item.coverage)
    lines.push(
      `Cobertura: ${item.coverage.available} de ${item.coverage.total} cidades disponíveis.`,
    );
  if (item.kind === "country" || item.scope === "country")
    lines.push(
      "Soma das cidades oficiais disponíveis; horário mais antigo incluído.",
    );
  lines.push(
    `Seções totalizadas: ${count(item.sections.counted)} de ${count(item.sections.total)}`,
  );
  for (const { candidate, color, share } of officialRows(item, model.candidates)
    .rows) {
    lines.push({
      text: `${candidate.name} · ${candidate.party} ${candidate.id} · ${count(candidate.votes)} votos · ${share == null ? "Percentual indisponível" : (share * 100).toLocaleString("pt-BR", { maximumFractionDigits: 2 }) + "%"}`,
      color,
    });
    if (candidate.validity) lines.push("Destinação: " + candidate.validity);
    if (candidate.status) lines.push(candidate.status);
  }
  for (const [label, value] of Object.entries({
    "Votos válidos": item.totals.valid,
    Brancos: item.totals.blank,
    Nulos: item.totals.null,
    Comparecimento: item.totals.turnout,
    Eleitorado: item.totals.electorate,
    Abstenção: item.totals.abstention,
  }))
    lines.push(`${label}: ${count(value)}`);
}
