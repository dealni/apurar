function montarIndicadoresDaDisputa(vantagem, definido, apuracao, lideranca) {
  return definido
    ? [
        ["Diferença", ...vantagem],
        ...(apuracao.status === "segundo-turno"
          ? [["2º turno", "Em 25 de outubro"]]
          : []),
      ]
    : lideranca || !(apuracao.pst > 0)
      ? []
      : [["Vantagem", ...vantagem]];
}
export { montarIndicadoresDaDisputa };
