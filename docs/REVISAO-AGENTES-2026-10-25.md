# Revisão geral com agentes — 25/10/2026

Revisão local solicitada pelo proprietário, com 20 agentes e responsabilidades separadas para pesquisa, revisão, correção e conferência independente. O checkout estava limpo no início. Durante a execução, outro chat passou a ajustar a API; o proprietário confirmou essa autoria. Essas alterações foram preservadas e não são atribuídas a esta revisão.

Esta revisão não executou commit, push, deploy, SSH, publicação R2, coleta de resultados em massa ou envio de mensagens externas. Os testes usam fixtures e destinos locais. O outro chat atualizou o HEAD para `b57ca81` durante o trabalho; suas ações de Git não pertencem a esta rodada.

## Correções

| Área                    | Problema e comportamento corrigido                                                                                                                                                                                                                                                                                |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Exportação presidencial | Pixels, título, números, fonte e legendas ficam congelados antes da espera pelas fontes. Polling ou navegação durante a espera não mistura gerações no PNG.                                                                                                                                                       |
| Busca                   | Abrir a busca antes da primeira resposta não conserva os candidatos provisórios. O índice passa a acompanhar os metadados oficiais.                                                                                                                                                                               |
| Perfis                  | Cliques nos cartões resolvem os IDs oficiais atuais. O percentual identifica votos computados das candidaturas quando a destinação difere dos válidos oficiais, inclusive no estado selecionado.                                                                                                                  |
| Terminologia            | Controles, mapas, perfis e exportação do painel atual usam seções totalizadas. A página histórica foi preservada.                                                                                                                                                                                                 |
| Regiões                 | O aviso de cobertura municipal incompleta quebra a linha sem invadir a barra em telas estreitas.                                                                                                                                                                                                                  |
| Coleta parcial          | Falta de cadastro estrutural de uma UF não paralisa municípios das UFs saudáveis. Tentativas das faltantes não adiam a varredura completa de 45s. A cobertura parcial e a suspensão da projeção permanecem explícitas.                                                                                            |
| Cadência suplementar    | Governadores e exterior continuam sendo consultados durante apuração ou recuperação, mesmo após o encerramento presidencial. A fila inicial elegível usa 2s; apuração ou recuperação usa 15s; 300s se aplica quando todos os resultados estão finais e atualizados. Pausas globais e Retry-After são preservados. |
| Resultado final         | Bloqueios operacionais da estimativa não escondem um resultado nacional oficial final elegível. A validação de votos incompatíveis continua ativa.                                                                                                                                                                |
| Gate de dependências    | A política usa o parser INI global do npm. Valores em outras seções, arrays ou tipos incompatíveis não satisfazem as opções obrigatórias.                                                                                                                                                                         |
| Arquivo histórico       | Ativar ou trocar o destino remoto confirma também os objetos históricos anunciados na amostra pública. Restaurar estado antigo não substitui uma trajetória remota posterior, inclusive em divergências com horários iguais.                                                                                      |
| Confirmação remota      | A deduplicação presidencial revalida ponteiro e objetos remotos periodicamente. Perdas são reparadas com a geração original; corrupção ou uma geração remota posterior/divergente interrompe a confirmação.                                                                                                       |
| Horários suplementares  | Entradas ao vivo mais de 60s no futuro são recusadas antes de contaminar o estado, a publicação ou a visualização. A correção do relógio permite recuperar estado anterior envenenado, inclusive após HTTP 304, preservando a recusa de regressões normais. A leitura arquivada não depende do horário atual.     |

A confirmação remota usa janela de 300s sem renovação pelo polling. O arquivo mantém cache limitado por destino e observação, evitando reler centenas de bundles a cada nova geração. Reinício, vencimento, alteração do destino ou erro exigem nova confirmação. Exclusões ocorridas dentro da janela podem levar até seu vencimento para serem detectadas. A confirmação não transforma ponteiros de destinos diferentes em uma transação distribuída.

O teste de teclado da timeline também passou a controlar a chegada da primeira resposta: comprova o controle desabilitado antes da fonte e aguarda sua ativação antes de pressionar Home. O atraso determinístico reproduziu uma corrida de prontidão da primeira execução integrada. A repetição identificou também uma corrida real: um efeito pendente capturava o modo ao vivo e sobrescrevia o corte escolhido depois de Home. O efeito agora confere o cursor atual antes de atualizar o horário; um teste unitário reproduz essa ordem de eventos e distingue o modo ao vivo do histórico. Não foram removidas as asserções de navegação.

## Pesquisa

Fontes primárias consultadas em 25/10/2026:

- [Informações técnicas do TSE](https://www.tse.jus.br/eleicoes/informacoes-tecnicas-sobre-a-divulgacao-de-resultados): identificação das eleições, quota por IP e bloqueios. A política local de 70 consultas/s e pausa mínima de 600s é conservadora diante do limite documentado.
- [Manual de verificação JWS do TSE](https://www.tse.jus.br/eleicoes/eleicoes-2026-content/arquivos/divulgacao-de-resultados/manual-verificacao-jws): distinguir a integridade SHA-256 entre componentes da autenticação da origem TSE. JSON continua sendo um formato permitido.
- [Consistência R2](https://developers.cloudflare.com/r2/reference/consistency/) e [Cache API do Worker](https://developers.cloudflare.com/workers/runtime-apis/cache/): consistência dos objetos, escopo do cache e uso de GET como chave canônica para GET/HEAD.
- [W3C: mensagens de estado](https://www.w3.org/WAI/WCAG22/Understanding/status-messages.html), [uso de cor](https://www.w3.org/WAI/WCAG22/Understanding/use-of-color.html) e [alvos de interação](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html): referências para busca, mapa, navegação e indisponibilidade acessível.

A leitura integral do PDF EA20 não ficou disponível na ferramenta de pesquisa nesta rodada. A padronização de seções totalizadas foi conferida contra a documentação local e o fluxo de `sections.counted`; não equivale a uma nova auditoria integral do PDF.

## Verificação e limites

A primeira passagem completa, anterior às correções desta rodada, aprovou 92 testes de qualidade, 225 testes Vitest, 301 testes Python e 339 testes de navegador, com sete casos ignorados conforme o layout aplicável.

As correções possuem testes direcionados e revisão independente. A execução final de `npm run check:ci-local` terminou com código zero:

| Verificação                                              | Resultado final              |
| -------------------------------------------------------- | ---------------------------- |
| Dependências, licenças, procedência, geografia e limites | Aprovados                    |
| TypeScript e Prettier                                    | Aprovados                    |
| Testes dos gates e hooks                                 | 94 aprovados                 |
| Vitest                                                   | 233 aprovados em 40 arquivos |
| Coletor Python                                           | 350 aprovados                |
| Chrome desktop e celular                                 | 355 aprovados; 13 ignorados  |
| Total aprovado                                           | 1.032 testes                 |
| Build e `git diff --check`                               | Aprovados                    |

Os 13 casos ignorados correspondem aos sete casos anteriores exclusivos de determinado layout e às seis verificações regionais que percorrem manualmente 320/390/1440 px no projeto desktop, evitando duplicação no projeto mobile. As contagens das baterias focadas dos agentes não foram somadas à suíte integrada.

A primeira passagem integrada após os ajustes teve uma falha de timeline, com 354 casos de navegador aprovados. A investigação separou a prontidão do teste da corrida real do efeito descrita acima; após as correções, o gate completo foi repetido com sucesso. Testes do suplemento tiveram seus relógios simulados tornados coerentes com as datas fixas das fixtures, preservando as asserções e os testes negativos de horários futuros.

`npm audit --json` consultou o registro e reportou zero vulnerabilidades conhecidas nas 245 dependências instaladas; isso não substitui a revisão do código. Ambiente local: Node 24.22.1, npm 12.2.1 e Python 3.15.1. Nenhum resultado de CI remoto foi usado como evidência.

Os ensaios não demonstram precisão estatística eleitoral, disponibilidade atual do TSE, publicação efetiva em produção, envio Telegram ou restauração real da VPS. O build mantém o aviso preexistente de chunks acima de 500 kB. O gate de dependências semelhante do Portfolio também tem o parser textual anterior; foi somente inspecionado e fica fora do escopo de edição do Apurar.
