# Revisão geral da padronização — 25/10/2026

Rodada local autorizada pelo proprietário, com sete novos agentes: quatro implementadores por área, um de aceitação e dois revisores independentes de apresentação/fluxo e semântica dos dados. As alterações anteriores foram preservadas. Não houve commit, push, deploy, acesso às VPS, coleta eleitoral externa ou envio de mensagens.

## Ajustes

| Área                 | Resultado                                                                                                                                                                                                                               |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Exterior             | Reutiliza cabeçalho, fonte, duelo de candidaturas, progresso, barra comparativa, indicadores e classificação de layout de Presidente/Governadores. Países e cidades mantêm os próprios dados, horários e cobertura.                     |
| Responsividade       | Flow, shell, tablet, paisagem e TV seguem os critérios comuns. O enquadramento do mapa compacto não reserva o espaço do antigo layout de abas.                                                                                          |
| Controles            | Seletores, foco, alvos de toque, tipografia e rolagem lateral têm regras comuns entre recortes oficiais; regras antigas redundantes foram removidas do Exterior.                                                                        |
| Navegação            | País/cidade têm anterior, próximo e retorno. Busca global funciona com Ctrl/⌘K sobre botões e links, preservando bloqueios em editores e diálogos.                                                                                      |
| Resultado incompleto | Uma candidatura isolada mantém seus votos e apresenta percentual indisponível, na tela e no PNG. Não presume que o catálogo das candidaturas esteja completo.                                                                           |
| Exportação           | Governadores e Exterior compartilham exportador com proteção contra cliques simultâneos e recuperação após falha. Pixels e metadados são congelados no clique, evitando misturar o mapa de um novo recorte com informações do anterior. |
| Consistência do PNG  | Governadores conserva votos anteriores válidos como a tela e não revela contagens retidas. Exterior exporta o recorte próprio com cobertura, horário, participação e percentuais disponíveis, sem resumo presidencial nacional.         |
| Arquivo histórico    | Barra superior identifica primeiro turno, data da captura e ausência de atualização ao vivo. O aviso anterior deixou de cobrir os controles. A entrada sem JavaScript também identifica o arquivo.                                      |

Os revisores independentes identificaram e confirmaram correções de enquadramento mobile, botão PNG inicialmente desconectado, candidatura isolada apresentada como 100% e diferenças entre contagens exibidas e exportadas. A integração também conferiu navegação durante a espera das fontes: a imagem continua sendo a do clique original.

Em TV vertical estreita, resultado, mapa e consultas ocupam uma coluna, com legenda abaixo do mapa. Na leitura contínua, Governadores e Exterior permitem rolagem vertical sobre o mapa como Presidente; o zoom manual, as abas e o modo TV preservam a manipulação própria do mapa.

Os dados eleitorais e as comparações do primeiro turno não foram alterados. As adaptações de apresentação e atalhos da árvore histórica foram documentadas em `PROVENIENCIA.md` e tiveram seus hashes derivados recalculados no inventário; nenhum hash de dados eleitorais ou de assets externos foi substituído.

## Evidências e limites

Validação integrada final de `npm run check:ci-local`, sem falhas:

| Verificação                                              | Resultado                                                          |
| -------------------------------------------------------- | ------------------------------------------------------------------ |
| Dependências, licenças, procedência, geografia e limites | Aprovados                                                          |
| TypeScript e Prettier                                    | Aprovados                                                          |
| Testes de qualidade                                      | 92 aprovados                                                       |
| Vitest                                                   | 219 aprovados em 37 arquivos                                       |
| Coletor Python                                           | 301 aprovados                                                      |
| Chrome desktop/celular                                   | 332 aprovados; 4 ignorados pelas condições já existentes de layout |
| Total aprovado                                           | 944 testes                                                         |
| Build e `git diff --check`                               | Aprovados                                                          |

A primeira passagem integrada encontrou testes legados que pressupunham abas obrigatórias ou 100% para uma candidatura e um problema real de TV em 320 px: duas colunas deixavam apenas 6 px para o mapa. Os testes foram alinhados sem remover verificações de votos e fonte, e o layout estreito passou a uma coluna. A revisão visual também exigiu separar a legenda do mapa e alinhar os gestos de rolagem. Após essas correções, a suíte completa foi repetida sobre o estado final e passou. As baterias focadas dos agentes e verificações independentes se sobrepõem ao conjunto integrado e não são somadas novamente ao total.

A matriz de aceitação verifica Presidente, Governadores, Exterior e Primeiro turno em 320, 390, 768, 844 × 390 e 1440 px, além dos modos de abas e fluxo. As capturas controladas estão em `Developer/output/apurar-padronizacao-2026-10-25/qa-crossview` e `Developer/output/apurar-padronizacao-geral-2026-10-25`. As imagens de candidatura isolada estão na subpasta `qa-png-candidatura-unica` da primeira pasta. São fixtures locais, não uma apuração real.

Os ensaios não comprovam a versão em produção, disponibilidade do TSE ou precisão estatística da projeção. O build mantém o aviso anterior de chunks acima de 500 kB. Não houve uso de CI remoto como evidência.
