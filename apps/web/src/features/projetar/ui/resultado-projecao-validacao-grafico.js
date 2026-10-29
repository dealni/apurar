function podeDesenharDistribuicao(
  altura,
  distribuicao,
  primeiroCandidato,
  largura,
  segundoCandidato,
) {
  return (
    largura > 60 &&
    altura > 40 &&
    primeiroCandidato &&
    segundoCandidato &&
    distribuicao &&
    Array.isArray(distribuicao.contagens) &&
    distribuicao.contagens.length > 3 &&
    Number.isFinite(distribuicao.de) &&
    distribuicao.passo > 0
  );
}
export { podeDesenharDistribuicao };
