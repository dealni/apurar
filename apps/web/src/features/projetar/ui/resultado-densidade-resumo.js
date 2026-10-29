/** Seleciona a densidade do resumo sem alterar os pontos de corte originais. */
export function selecionarDensidadeResumo(tv, altura) {
  if (tv) return "mid";
  if (altura < 680) return "tiny";
  if (altura < 780) return "short";
  if (altura < 900) return "mid";
  return "tall";
}
