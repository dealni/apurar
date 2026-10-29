export function checkNumericColumns(data, length, isNonNegative) {
  for (const name of [
    'secoes',
    'totalizadas',
    'eleitorado',
    'apurado',
    'comparecimento',
    'brancos',
    'nulos',
  ]) {
    const column = data[name];
    if (
      !Array.isArray(column) ||
      column.length !== length ||
      !column.every(isNonNegative)
    )
      return name;
  }
  return null;
}
export function checkVoteColumns(votes, length, isNonNegative) {
  for (const name in votes) {
    const column = votes[name];
    if (
      !Array.isArray(column) ||
      column.length !== length ||
      !column.every(isNonNegative)
    )
      return 'votos.' + name;
  }
  return null;
}
