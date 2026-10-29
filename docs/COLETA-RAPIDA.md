# Coleta de municípios e totais

Remoção local da coleta zonal e otimizações de cálculo, arquivo e lotes, ainda sem commit, push ou deploy. A versão em produção pode ser conferida em `/_release.json`; os tempos reais da release anterior não devem ser apresentados como medição deste novo escopo.

## Escopo e volume

| Resultado                                   | Arquivos distintos |
| ------------------------------------------- | -----------------: |
| Presidente — Brasil                         |                  1 |
| Presidente — municípios e exterior agregado |              5.572 |
| Governadores — totais estaduais             |                  6 |
| Governadores — municípios                   |                469 |
| Presidente — cidades exteriores             |                186 |
| **Total**                                   |          **6.234** |

As 6.805 consultas de zonas foram removidas. A redução é de aproximadamente 52,2% em relação aos 13.039 arquivos da volta completa anterior. Países são agregados das cidades, sem arquivos adicionais. Catálogos e arquivos de acompanhamento também são consultados conforme suas cadências e não estão nesse total de arquivos de resultados.

## Execução e proteção

O núcleo começa com lotes de 256 municípios e adapta o tamanho até 512, com janela de admissão de 8s; o suplemento consulta seis totais estaduais e até 128 detalhes, com janela de admissão de 15s. Não há processamento de fila zonal. A migração descarta somente os alvos e filas zonais do estado ativo; dados válidos dos municípios e arquivos imutáveis históricos são preservados.

A [documentação oficial do TSE](https://www.tse.jus.br/eleicoes/informacoes-tecnicas-sobre-a-divulgacao-de-resultados) informa teto de 100 consultas/s por IP. O Apurar mantém 70/s compartilhadas, sem rajadas, e até oito em voo. Consultas condicionais, erros e redirecionamentos contam. Um único escritor executa a coleta; outros programas no mesmo IP não recebem uma quota independente.

Bloqueios 403/429 mantêm pausa mínima de 600s, Retry-After maior e saldo persistido após reinício. Respostas 404 mantêm espera por URL. A remoção de zonas não afrouxa esses limites.

Com fila pendente, a espera entre ciclos é de 2s. Sem fila, é de 15s; encerramento usa a política de 300s. Trabalho de rede, cálculo e publicação se soma à espera. As janelas de admissão não encerram requisições já iniciadas, portanto não é teto da duração total.

## Otimizações de trabalho repetido

O runtime compara os insumos materiais antes de construir o snapshot e executar o modelo. Dados eleitorais, prior, modo e configuração da projeção invalidam essa comparação; campos operacionais de fila e cadência não. Somente um lote confirmado e íntegro pode ser reutilizado. A memória de insumos começa vazia após reinício, e falha transitória do modelo exige nova tentativa. O heartbeat continua atualizado sem alterar o horário original da fonte nem acrescentar observações idênticas ao histórico. Trocar o destino local ou remoto exige nova confirmação de publicação.

O índice do arquivo histórico reutiliza confirmações remotas por até 300s quando seu hash e os destinos não mudam. A verificação local continua em todas as chamadas. Um índice novo, destino novo, reinício ou expiração exige verificação remota completa; consultas repetidas não renovam o prazo. Uma perda remota durante essa janela pode ser percebida somente na próxima verificação. Objetos imutáveis divergentes são recusados, e falhas não são guardadas como sucesso.

Os lotes municipais crescem apenas com amostra suficiente de respostas e respeitam a capacidade observada, o teto de 512 e o orçamento de admissão de 8s. Lentidão, erros e trabalho não iniciado reduzem o próximo lote; a fila restante conserva sua ordem. Requisições já em voo terminam sob o timeout da fonte. Nacional e acompanhamento estadual conservam suas cadências; os 8s não são promessa de duração total do ciclo. O cálculo estatístico da projeção permanece o mesmo.

## Interface e arquivo

A apuração deixa de oferecer busca, aba, seletor, mapa ou atalho zonal. Links antigos abrem o município. Municípios, totais estaduais/nacional, mapas, eleitorado, exterior e projeção presidencial continuam disponíveis. O leitor de arquivo aceita publicações legadas com zonas para integridade, mas não oferece esses registros nas listas ou exportações.

## Verificação do ganho

A regressão backend carrega 661 alvos suplementares e 6.805 zonas legadas, migra o estado e confirma 661 consultas únicas, sem URL zonal. Contratos e testes de navegador verificam compatibilidade e remoção dos acessos.

O ensaio de desempenho usa fonte sintética em memória, conexões externas proibidas, o mesmo limitador e código real antes/depois. Não inclui latência do TSE, núcleo presidencial ou R2. A diminuição de 52,2% nas consultas não significa necessariamente 52,2% menos tempo: o prazo real deve ser medido após deploy autorizado.

### Ensaio comparativo local

Ensaio anterior às três otimizações acima. Com o mesmo catálogo sintético (6 totais estaduais, 64 cidades e quatro zonas por cidade), limite de 50/s, oito em voo e latências de 120/150/180ms:

| Medida                     | Código anterior, com zonas | Revisão sem zonas |
| -------------------------- | -------------------------: | ----------------: |
| Consultas únicas agendadas |                        326 |                70 |
| Duração do suplemento      |                     7,953s |            1,795s |
| Tamanho do documento       |              228.299 bytes |      45.766 bytes |
| Erros                      |                          0 |                 0 |

O documento caiu 80% e o tempo desse exemplo caiu 77,4%. Esse catálogo tem proporção de zonas diferente do conjunto eleitoral completo; o percentual não deve ser transferido para a previsão de produção. O escopo completo reduz 13.039 para 6.234 arquivos de resultados (52,2%). Conexões externas foram proibidas no subprocesso do ensaio. Os JSONs, hashes e script reproduzível estão em `.artifacts/benchmark-sem-zonas/`.
