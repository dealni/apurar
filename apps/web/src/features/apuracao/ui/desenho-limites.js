export function limitesDosPulsos(pulsos) {
  const limites = [Infinity, Infinity, -Infinity, -Infinity];
  for (const pulso of pulsos) {
    const raio = pulso.r * 1.2 + 2;
    if (pulso.x - raio < limites[0]) limites[0] = pulso.x - raio;
    if (pulso.y - raio < limites[1]) limites[1] = pulso.y - raio;
    if (pulso.x + raio > limites[2]) limites[2] = pulso.x + raio;
    if (pulso.y + raio > limites[3]) limites[3] = pulso.y + raio;
  }
  return limites[0] < limites[2] ? limites : null;
}
export function contemRetangulo(x, y, caixa) {
  return x >= caixa[0] && x <= caixa[2] && y >= caixa[1] && y <= caixa[3];
}
export function localizarRotulo(rotulos, x, y) {
  return rotulos.find((alvo) =>
    contemRetangulo(x, y, [alvo.x0, alvo.y0, alvo.x1, alvo.y1]),
  );
}
