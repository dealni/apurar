# Tráfego, consumo e leituras concorrentes

O Worker usa cache e leituras isoladas por requisição; o monitor é ativado por serviço separado. Os testes offline não ativam serviços nem enviam mensagens. A interface continua consultando a cada 15s visível/60s oculta, com cache mutável de 10s. A coleta mantém 70 consultas/s compartilhadas, oito consultas em voo e bloqueio mínimo de 600s.

## Leituras isoladas no Worker

Cada requisição que encontra o cache vazio lê o R2, confere o hash e valida os dados em seu próprio contexto. Promessas de I/O e timers não são compartilhados globalmente: o cancelamento do visitante que iniciou uma leitura não pode prender consultas seguintes. A consulta ao cache tem prazo de 250 ms e a leitura da origem tem orçamento de oito segundos.

O cache mutável continua com TTL de dez segundos. GET, HEAD, ETag, 304 e respostas independentes permanecem preservados, com URL canônica para impedir que parâmetros fragmentem o cache. Versões imutáveis continuam identificadas por SHA-256. A escrita de cache ocorre sem bloquear a resposta e limita a espera em background a um segundo.

Consultas simultâneas sem cache podem executar leituras independentes do R2. O agrupamento global de promessas foi retirado após a investigação dos cancelamentos do runtime; não há garantia de leitura única entre visitantes, isolates ou datacenters. As requisições dos visitantes continuam sujeitas à cobrança normal do Worker.

## Monitor opcional no DealniBot

O novo módulo `apurar_collector.consumption_alerts` é separado do diagnóstico de saúde. Os modelos `infra/systemd/apurar-consumption.{service,timer}` reaproveitam token e destinatário externos de `/etc/apurar/alerts.env`; a configuração de métricas fica em `/etc/apurar/consumption.env`. Os alertas existentes de saúde não mudam.

O timer verifica o monitor a cada minuto. Estado persistido limita as consultas Analytics a uma a cada cinco minutos; tentativas de entrega Telegram podem ocorrer após 60s. Uma chamada GraphQL somente leitura compara duas janelas consecutivas de dez minutos, encerradas há pelo menos cinco minutos para acomodar o atraso das métricas. Portanto, os alertas de consumo não são instantâneos e não limitam gastos.

A consulta seleciona somente o Worker `apurar` e o bucket `apurar-snapshots`, ambos configuráveis. Usa requisições, CPU, erros do Worker e operações R2. CPU em microssegundos é convertida para milissegundos; operações R2 são classificadas em A, B, gratuitas e não classificadas.

| Condição                        | Padrão inicial configurável                            |
| ------------------------------- | ------------------------------------------------------ |
| Tráfego                         | 50.000 requisições Worker em dez minutos               |
| CPU                             | 1.000.000 CPU ms em dez minutos                        |
| R2                              | 500.000 operações em dez minutos                       |
| Estimativa bruta de consumo     | US$ 1/h no ritmo observado                             |
| Crescimento                     | 3× a janela anterior, com mínimo de 10.000 requisições |
| Normalização                    | Abaixo de 80% dos limites para evitar oscilação        |
| Analytics indisponível repetido | Três consultas inválidas consecutivas                  |

As condições são deduplicadas por estado, sem novos avisos apenas porque os contadores mudaram. São enviadas normalizações somente após amostras válidas. Entregas e novas tentativas são persistidas; erros do Telegram não confirmam uma entrega. O estado de consumo é separado do estado de saúde.

Dados ausentes, nulos, inválidos, truncados ou com erro GraphQL são indisponibilidade. Uma série vazia pode representar zero quando a outra série da mesma janela tem linhas válidas (por exemplo, nenhum visitante com atividade R2 do coletor). Se as duas séries da janela atual estão vazias, ela permanece inconclusiva: o monitor falha, preserva os alertas anteriores e nunca substitui a amostra pela janela anterior.

Uma janela atual válida permite avaliar os limites absolutos mesmo quando a janela anterior não tem amostras. Nesse caso a base anterior é desconhecida, sem conversão para zero: crescimento não gera um novo alerta nem confirma normalização de um alerta já ativo até existir comparação válida. O JSON do monitor distingue `analytics_valid` (janela atual) de `growth_valid` (comparação disponível). Uma base anterior malformada, nula, truncada ou com métricas inválidas continua sendo falha, não simples ausência de tráfego.

Falhas registram `analytics_reason` em categoria sanitizada, como `empty_current_window`, `http_403`, `graphql_error` ou `transport_failed`, sem corpo de resposta, credenciais ou destinatário. A categoria persiste entre consultas e é removida depois de amostra atual válida. A falha repetida de Analytics mantém aviso próprio e não confirma recuperação do tráfego ou consumo. O serviço permanece com saída de erro se a janela atual for inconclusiva ou a entrega de uma notificação estiver pendente.

## Significado da estimativa

A mensagem informa custo **bruto estimado por hora e por 24h**, extrapolando a janela observada. Não é fatura, gasto mensal real, previsão garantida ou teto de cobrança. As tarifas de referência são Worker US$ 0,30/milhão de requisições e US$ 0,02/milhão de CPU ms; R2 Standard A US$ 4,50/milhão e B US$ 0,36/milhão.

Não são descontadas franquias compartilhadas. Armazenamento, mensalidades, impostos, arredondamento de unidades e operações R2 não classificadas ficam fora da estimativa. A classificação e as tarifas precisam ser revistas se a Cloudflare ou a classe do bucket mudar. O alerta de orçamento por e-mail da conta continua independente deste monitor.

## Configuração e ativação

O exemplo sem segredos é `infra/consumption.env.example`. A credencial Analytics deve ser dedicada, somente leitura e restrita à conta do Apurar, com permissão Account Analytics Read. Não reutilizar token administrativo nem credencial de escrita do publicador R2. Token, conta e destinatário são configurados fora do Git; estado e logs não incluem credenciais ou destinatário.

A instalação precisa conferir as permissões reais da credencial, configurar os arquivos externos e validar uma consulta autenticada antes de habilitar o timer. Os exemplos e testes não criam token, não modificam VPS/Cloudflare, não ativam serviços e não enviam teste Telegram. Não passar credenciais como argumentos de linha de comando.

O módulo oferece `--help` com limites e variáveis; sua execução normal consulta Cloudflare e pode enviar mensagens, portanto não deve ser usada como teste offline. Os testes injetam transporte e respostas fictícias. A suíte completa pode ser executada pela raiz com `npm run check:ci-local`.

Fontes: [Analytics do R2](https://developers.cloudflare.com/r2/platform/metrics-analytics/), [Workers](https://developers.cloudflare.com/workers/platform/pricing/) e [R2 Standard](https://developers.cloudflare.com/r2/pricing/).
