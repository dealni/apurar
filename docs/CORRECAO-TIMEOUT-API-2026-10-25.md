# Correção do timeout da API suplementar

## Evidência e diagnóstico

A revisão em produção reproduziu timeout sem primeiro byte em `/api/supplemental` pelo domínio principal, afetando governadores e exterior. O objeto imutável no mesmo domínio, o endereço direto do Worker e a consulta pela VPS responderam normalmente. A ocorrência foi intermitente, com recuperação espontânea entre rodadas.

A primeira correção, `cd16f3b`, limitou cache e R2, mas manteve a promessa global. Os testes Node e a primeira rodada pública passaram. A observação prolongada e o teste de interrupção do cliente reproduziram novo travamento. O tail ao vivo da versão `5617408f-bb91-436a-882d-22a0841d408b` registrou uma consulta cancelada após aproximadamente 12 segundos, sem resposta nem exceção, mesmo com prazo compartilhado de oito segundos.

O runtime atribui I/O e timers ao contexto da requisição. Se esse contexto é cancelado, uma Promise de I/O pode permanecer sem resolução. A tabela global guardava a promessa da primeira requisição; as seguintes reutilizavam a mesma espera sem criar contexto e prazo próprios. Um timer pertencente ao contexto cancelado não protege os consumidores seguintes. O código primário do [workerd](https://github.com/cloudflare/workerd/blob/main/src/workerd/io/io-context.h#L637-L638) documenta essa possibilidade; as [boas práticas da Cloudflare](https://developers.cloudflare.com/workers/best-practices/workers-best-practices/#do-not-store-request-scoped-state-in-global-scope) orientam isolar estado de requisições.

Trabalho realizado por agentes de implementação, investigação e revisão independente, com integração e validação pelo agente principal. A verificação prolongada revelou a lacuna que os testes Node isolados não exercitavam.

## Correção

- Retirada da tabela global de promessas de I/O. Cada invocação executa sua própria leitura e cria seu próprio prazo.
- Consulta ao Cache API limitada a 250 ms; cache indisponível ou travado permite tentar a origem R2.
- Carregamento da origem limitado a oito segundos por requisição, incluindo leitura, hash e validação. A resposta de falha é 503 com `no-store` e permite nova consulta.
- Leituras expiradas não iniciam escrita tardia no cache. A escrita permanece fora do caminho da resposta e limita a espera em background a um segundo.

O cache mutável permanece com dez segundos. Consultas simultâneas sem cache podem ler o R2 separadamente; o consumo deve ser acompanhado pelo monitor existente. O frontend, a coleta e sua cadência não mudam. ETag, HEAD/304, SHA-256 e isolamento das publicações permanecem preservados.

## Verificação

Os testes simulam cache, leitura R2 e corpo que nunca terminam; prazos independentes; cancelamento de um consumidor enquanto outro conclui; recuperação; ausência de escrita após expiração; e limite da tarefa de cache em background.

Os testes de navegador cobrem governadores e exterior em desktop e celular: primeira consulta com 503, recuperação automática, nova falha preservando o resultado anterior e recuperação com menos votos em uma publicação posterior. Ausência não é convertida em zero.

O ensaio isolado em workerd/Miniflare, com R2 local e cancelamento do cliente durante uma leitura, confirmou o acoplamento: a requisição seguinte recebeu 503 após oito segundos na versão anterior e 200 em 5 ms na nova, com corpo íntegro, HEAD 200 e condicional 304. O proxy local conservou o timer da primeira requisição; esse ensaio não reproduz o encerramento definitivo do `IoContext` nem comprova uma promessa órfã. Os logs estão em `Developer/output/apurar-runtime-request-scope-2026-10-25/`.

A publicação deve ser conferida pelo marcador `/_release.json`, com medições repetidas além do TTL do cache e após interromper uma requisição somente no navegador de teste. A aprovação da primeira chamada não basta para confirmar a resolução deste incidente.

## Limites

Os bindings R2 e Cache API não oferecem cancelamento físico dessas operações neste caminho. O prazo encerra a espera e impede efeitos tardios da leitura expirada; uma operação subjacente pode concluir depois. O timeout da escrita não desfaz um `cache.put` já iniciado.

Não há mudança de contrato, fonte eleitoral, horários ou regras de projeção. A evidência de produção e o mecanismo documentado são compatíveis; o tail não identifica sozinho qual objeto ou timer perdeu seu contexto. Ensaios locais e a verificação pública posterior delimitam o que foi efetivamente comprovado.
