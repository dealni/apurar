# Diagnóstico, recuperação, modelo e carga local

Os comandos abaixo são locais e não enviam alertas, consultam o TSE, publicam no R2, instalam agendamento ou alteram produção. Executar módulos Python a partir de `services/collector`. Não apontar o ensaio de carga para produção.

## Diagnóstico alertável

```sh
python3 -B -m apurar_collector.diagnostics \
  --state-dir /copia/local/state --output /copia/local/public \
  --max-age 360 --max-pending 100 --min-free 1073741824 --max-bytes 10737418240
```

Retorna JSON e código 0 se todos os limites forem satisfeitos; código 1 exige atenção. Os limites são explícitos e precisam ser escolhidos para o ambiente, inclusive a cadência final de cinco minutos. O exemplo não define uma política universal. Verifica horário da saúde e última consulta nacional, fila, UFs com falha, upload pendente, disco e tamanho do acervo. Não confunde idade da fonte com erro. Os estados reais `live`, `collecting`, `finished` e `awaiting` são aceitos quando horários e fila respeitam os limites; `awaiting` pode não ter consulta nacional bem-sucedida enquanto aguarda divulgação, mantendo `success_age_seconds: null` em vez de inventar sucesso. Saúde vencida continua sendo erro. `finished` usa cadência de 300s: o exemplo de 360s inclui margem de rede/cache. A saúde suplementar, quando presente, alerta `status: error` ou contagem `errors > 0`; fila de bootstrap sozinha é aceitável até `--max-pending`, aplicado também a `pending` e `zones_pending`. Não substitui medir a última publicação nem varredura completa municipal. Nunca inclui credenciais no relatório. Pode ser integrado posteriormente a supervisor autorizado, sem criar envios externos por conta própria.

## Restauração isolada

```sh
python3 -B -m apurar_collector.recovery \
  --state-dir /copia/local/state --output /copia/local/public --mode live
```

Cria e remove diretório temporário; a origem é somente leitura. Reconstrói SQLite via backup da API em conexão readonly (inclui dados WAL), exige `integrity_check`, lista contagens por tabela e confere ponteiro, recibo, estado e SHA-256 dos três objetos presidenciais. Quando existe suplemento de governadores/exterior/zonas, valida também seu ponteiro independente, horário, hash e objeto, sem exigir `snapshot_id` presidencial. A ausência em instalações legadas aparece explicitamente em `capabilities.supplemental_bundle: false`; objetos suplementares órfãos ou recibo sem ponteiro causam falha. Recusa symlinks. Para ensaio determinístico, usar cópia consistente produzida com escritor parado; divergência entre arquivos simultaneamente alterados causa falha, nunca sucesso parcial. O arquivo de publicações, quando presente, também passa por validação do índice público e de todas as referências presidenciais e suplementares do SQLite integral, inclusive observações que não aparecem na amostra pública. Índice ausente em instalação legada fica explícito em `capabilities.archive_index`/`archive_integral: false`; arquivo configurado mas incompleto ou corrompido falha. O diagnóstico inclui falhas de `archive-status.json` para alerta deduplicado. Não é um backup nem realiza retomada de coleta/upload. Não remove pendências, não muda proveniência e não publica um bundle copiado. `--mode demo` é somente para ensaios fictícios identificados.

## Avaliação temporal do modelo

```sh
python3 -B -m apurar_collector.backtest /copia/local/trajetoria.json
```

Entrada: envelope com `provenance: {kind: "real" | "synthetic", description}`, `prior` no contrato atual, `prior_as_of` com fuso, `final: {as_of, votes}` e `observations: [{cutoff, collection}]`. Cada coleção é o contrato normalizado consumido pelo motor. Cortes devem crescer, ser anteriores ao resultado final e posteriores à base; dados nacionais e municipais posteriores ao corte são recusados. O resultado final entra somente na avaliação, nunca no motor. O comando não reconstrói coleções a partir do final nem ajusta parâmetros; avalia cada prefixo explicitamente fornecido. Proveniência declarada precisa ser auditada na origem.

Relatório por corte: cobertura municipal, disponibilidade, notas e erro em pontos percentuais por candidatura; agregado: erro absoluto médio/máximo e disponibilidade. Disponibilidade não é cobertura de intervalo de confiança. Não há intervalo estatístico calibrado. Os estudos existentes em `Aplicativos/apuracao/estudos/2026` são de primeiro turno; sua reprodução não comprova precisão no segundo turno. Uma trajetória real do segundo turno ainda é necessária para medir o erro real do motor. Fixtures sintéticas comprovam execução e rejeição de futuro, não precisão eleitoral.

## Carga da API local

Na raiz, iniciar Worker conforme README (`npm run build` e Wrangler `--local`). Em outro terminal:

```sh
python3 -B scripts/ops/load-local.py http://127.0.0.1:4327/api/manifest \
  --requests 100 --concurrency 8 --max-p95-ms 1000
```

Somente IP loopback HTTP, sem proxy ou redirects. Mede respostas esperadas, falhas, vazão e p95 com limites de duração/concorrência. API sem bundle deve responder 503; `--expected-status 503` permite ensaiar apenas essa indisponibilidade, nunca comprova entrega de dados. Para carga útil, pré-carregar bundle fictício exclusivamente no R2 local e exigir 200. Não é ensaio Cloudflare nem estimativa de audiência: plano, limites de invocações, audiência pretendida, cache e custo precisam ser avaliados separadamente antes de declarar capacidade. Não provisiona nem paga recursos.

## Alertas opcionais pelo DealniBot

O usuário escolheu Telegram pelo DealniBot. O destinatário fica em `.artifacts/alerts.env`, ignorado e sem token. A ativação continua dependente de deploy/agendamento autorizado; estes testes não enviaram mensagens. Fornecer `APURAR_ALERT_TELEGRAM_CHAT_ID` e `APURAR_ALERT_TELEGRAM_TOKEN` externamente, ou `APURAR_ALERT_TELEGRAM_TOKEN_FILE` apontando para arquivo restrito contendo somente o token. Não copiar segredo do bot para o Git ou logs. Importar o módulo nunca inicia envio.

```sh
python3 -B -m apurar_collector.diagnostics_alerts \
  --state-dir /copia/local/state --output /copia/local/public \
  --alert-state /copia/local/alerts/state.json \
  --max-age 360 --max-pending 100 --min-free 1073741824 \
  --max-bytes 10737418240 --retry-seconds 60
```

Este comando **envia mensagem** quando explicitamente executado com credenciais. Não o usar no ensaio offline. Agendar futuramente uma única instância em serviço autorizado; lock impede duplicidade no mesmo diretório. Estado saudável inicial permanece silencioso; mudança dos problemas gera um alerta; repetição fica silenciosa e recuperação gera aviso. Fingerprint só é confirmado após Telegram responder `ok: true`. Falha mantém o estado anterior e impõe pausa local, sem imprimir URL/token ou descrição remota. Backoff pode ser ampliado conforme a frequência operacional. Falha de arquivo de estado exige atenção, não dispara repetição cega.
