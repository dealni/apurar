# Nova revisão geral com revisão independente — 25/10/2026

Rodada local solicitada pelo proprietário após a revisão complementar. O checkout já continha os ajustes anteriores, que foram preservados e incluídos na validação. Não houve commit, push, deploy, SSH, coleta externa, publicação R2 ou envio de mensagens.

## Divisão e revisão

Oito agentes implementadores receberam áreas separadas: interface atual; arquivo histórico e navegação; integração web; API e contratos; coleta; modelo; publicação e restauração; diagnóstico e operação. Quatro novos revisores trabalharam somente em leitura, cobrindo respectivamente web, dados/API, coleta/modelo e publicação/operação. Cada revisor conferiu as alterações finais e pediu correções adicionais quando encontrou falhas. Os quatro encerraram sem bloqueios pendentes em seus escopos.

## Correções desta rodada

| Área                  | Problema e resultado                                                                                                                                                                                                                                           |
| --------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| PNG de governadores   | Sem resultado oficial, os blocos perdiam o território. Agora identificam estado/UF e município/UF/IBGE, preservando a ausência de votos e horários.                                                                                                            |
| Primeiro turno        | HTTP 503 e falha de rede no detalhe do exterior deixavam carregamento permanente. Agora há aviso acessível; 404 continua identificado e o transporte conserva a resposta ou erro original.                                                                     |
| Consultas canceladas  | Os três clientes agora abortam consultas e descartam corpos que terminam após `stop()`. Uma nova consulta pode recuperar o cliente.                                                                                                                            |
| Projeção isolada      | Publicações antigas não substituem a observação recente. Correções oficiais posteriores com redução de votos continuam aceitas.                                                                                                                                |
| Histórico             | A validação usa votos, seções e destinação de cada ponto, evitando que totais atuais com anulações invalidem uma projeção histórica legítima.                                                                                                                  |
| Contrato suplementar  | Resultados disponíveis exigem geração, seções e votos conhecidos, sem candidaturas duplicadas. Conteúdo incompleto recebe 503 mesmo com hash correto. Países parciais, ausência de horário, totais nulos e observações legadas válidas mantêm compatibilidade. |
| Cadência              | A fila suplementar não abrevia a pausa nacional após 404; `supplemental=None`, usado por `--without-supplemental`, não interrompe o loop.                                                                                                                      |
| Versões suplementares | Conteúdo eleitoral divergente na mesma geração não sobrescreve a observação anterior. Resposta idêntica recupera a consulta; resultado sem divulgação também se recupera após falha de rede. Uma geração posterior pode corrigir votos para menos.             |
| Insumos do modelo     | Finalista ausente ou metadados incompletos/duplicados suspendem a estimativa. Zero explícito continua válido. Os parâmetros matemáticos permanecem iguais.                                                                                                     |
| Isolamento municipal  | Detalhe com identidade incompleta fica indisponível sem invalidar o lote nacional. Nenhum finalista ausente recebe zero inventado; o total de seções conhecido permanece preservado.                                                                           |
| Horários municipais   | Extremos comparam instantes com fuso; antes da totalização, incluem a geração oficial disponível.                                                                                                                                                              |
| Publicação do arquivo | Todos os destinos confirmam o objeto imutável antes de qualquer avanço de ponteiro.                                                                                                                                                                            |
| Restauração           | Bundle atual e referências integrais arquivadas conferem família, modo, eleição, schema e vínculos entre horários da fonte/publicação, além de SHA e identidade.                                                                                               |
| Diagnóstico           | Recusa heartbeat de outra eleição/schema e horários malformados que o parser normalizava. Falhas de leitura do acervo/disco produzem diagnóstico negativo, permitindo alcançar o fluxo de alerta.                                                              |

Os revisores reproduziram falhas e solicitaram ajustes em PNG sem fonte, desativação do suplemento, recuperação de resultado sem divulgação, identidade do heartbeat, envelopes do arquivo e validação histórica. A revisão entre produtor e consumidores também identificou o bloqueio nacional causado por um município incompleto. A solução final foi conferida offline em quatro cenários reais de emissão Python → contrato → Worker → consumidor web: ausência de finalista, candidato inesperado e metadados incompletos/duplicados. Só a unidade afetada fica indisponível; o nacional e as demais unidades são preservados.

## Validação e limites

Os gates locais, testes e build foram executados sobre o conjunto integrado. As baterias focadas dos agentes e revisores não são somadas novamente ao total da suíte. Capturas desktop e celular da suíte foram inspecionadas visualmente.

Resultado final de `npm run check:ci-local`, sem falhas:

| Verificação                                              | Resultado                                              |
| -------------------------------------------------------- | ------------------------------------------------------ |
| Dependências, licenças, procedência, geografia e limites | Aprovados                                              |
| TypeScript e Prettier                                    | Aprovados                                              |
| Testes de qualidade                                      | 92 aprovados                                           |
| Vitest                                                   | 218 aprovados em 37 arquivos                           |
| Coletor Python                                           | 301 aprovados                                          |
| Chrome desktop/celular                                   | 254 aprovados; 4 ignorados conforme o layout aplicável |
| Total de testes aprovados                                | 865                                                    |
| Build e `git diff --check`                               | Aprovados                                              |

A primeira execução completa do navegador encontrou duas falhas no mesmo teste de exterior, em desktop e celular: a fixture simulava um país disponível com votos nulos, estado que o produtor não emite. O implementador e o revisor independente confirmaram a causa. A fixture agora representa cobertura parcial com votos numéricos e dados anteriores; todas as asserções foram mantidas e ampliadas para conferir votos e avisos. A suíte completa foi repetida com sucesso sobre o conjunto final.

Dois casos ignorados verificam controles exclusivos de desktop no projeto mobile; os outros dois verificam PNG e legenda compacta exclusivos de mobile no projeto desktop.

Esta rodada não confirma a release efetiva em produção, disponibilidade do TSE, precisão estatística da projeção ou envio real de alertas. Os ensaios de transporte, publicação e recuperação são locais, com fixtures. A confirmação prévia de objetos não cria uma transação distribuída entre os ponteiros de destinos diferentes. O build mantém o aviso preexistente de chunks acima de 500 kB. Não houve uso de CI remoto como evidência.
