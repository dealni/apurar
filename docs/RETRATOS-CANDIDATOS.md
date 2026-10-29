# Retratos locais dos finalistas

Em 25/10/2026, foram obtidas diretamente do TSE as 14 fotografias dos candidatos acompanhados no segundo turno: dois à Presidência e dois em cada uma das seis disputas de governador. Nenhuma imagem foi gerada por IA. As imagens originais são JPEG de 161 × 225 pixels; a conversão WebP com qualidade 88 preserva a resolução e soma 76.424 bytes nos 14 arquivos.

O manifesto `apps/web/src/data/candidate-portraits.json` registra cargo, UF, número, nome de urna, partido, identificador SQ, URL da fotografia, SHA-256 do JPEG original e do WebP local. Também registra a URL e o SHA-256 do resultado oficial do segundo turno no qual os quatro campos de identidade (SQ, número, nome de urna e partido) foram conferidos. Hashes comprovam a integridade dos bytes consultados, sem alegar assinatura digital ou homologação do TSE.

As fotografias ficam em `apps/web/public/candidates/`; o navegador consulta somente URLs absolutas da própria origem, sem conexão externa ao TSE para carregar imagens. O resolvedor `apps/web/src/runtime/candidate-portraits.ts` exige coincidência de nome, partido e número; quando há SQ, ele também deve coincidir. Um contexto de cargo e UF pode restringir a identificação. Um número de urna sozinho nunca seleciona um retrato. Ausência de correspondência ou falha de carregamento mantém as iniciais.

Nos resultados presidenciais, o cadastro nacional `BR` identifica os retratos também nos recortes estaduais e do exterior (`ZZ`). Para governadores, a UF continua sendo parte obrigatória da correspondência quando informada.

O acervo histórico em `public/1turno/retratos/` e seu cadastro permanecem preservados. Os novos retratos possuem procedência própria e não dependem dos caminhos relativos daquele acervo. Nenhuma candidatura ou votação é inferida a partir de uma fotografia. Direitos e limites gerais do projeto seguem `docs/PROVENIENCIA.md`; o manifesto não declara uma licença geral de redistribuição sobre fotos de terceiros.

Verificação local: quatro testes em `apps/web/src/integration/candidate-portraits.test.ts` cobrem a recusa de identidade incompleta, partido/SQ divergentes, contexto de outro estado, normalização de acentos e recortes presidenciais. As 14 imagens foram abertas em uma folha de contato para conferir integridade e enquadramento. Há fontes com enquadramento mais aberto, como Cadu de Lula; elas mantêm a fotografia oficial, sem inventar conteúdo ou ampliar artificialmente sua resolução.
