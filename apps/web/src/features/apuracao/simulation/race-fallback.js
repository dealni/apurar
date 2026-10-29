function governorWeight(index, dominant, random) {
  if (index === 0) {
    return dominant ? 2 + 0.9 * random() : 1.05 + 0.4 * random();
  }
  if (index === 1) {
    return dominant ? 0.6 + 0.5 * random() : 0.85 + 0.35 * random();
  }
  return 0.12 + (0.4 * random()) / index;
}

export function createFallbackRace(state, random, nextCandidateName) {
  const governorCount = 3 + Math.floor(random() * 3);
  const dominant = random() < 0.4;
  // Sorteie todos os pesos antes de consumir a sequência de nomes.
  const gov = Array.from({ length: governorCount }, (_, index) =>
    governorWeight(index, dominant, random),
  ).map((weight, index) => ({
    id: state + 'g' + index,
    name: nextCandidateName(),
    partido: '',
    w: weight,
  }));
  const senatorCount = 4 + Math.floor(random() * 4);
  const sen = Array.from({ length: senatorCount }, (_, index) => ({
    id: state + 's' + index,
    name: nextCandidateName(),
    partido: '',
    w: index < 3 ? 1.25 - 0.14 * index + 0.25 * random() : 0.2 + 0.3 * random(),
  }));
  return { gov, sen };
}
