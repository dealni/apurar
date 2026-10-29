# Histórico, publicação e retenção

O coletor publica um novo lote somente quando há mudança material no resultado nacional, nos metadados da fonte, na cobertura, na projeção ou nos municípios. Consultas idênticas reutilizam o último snapshot e ponteiro, inclusive após reinício. `source.collected_at` e `published_at` continuam identificando a coleta/publicação daquele lote; não são renovados artificialmente. `heartbeat-live.json`, no diretório de estado, registra uma consulta idêntica separadamente, com `checked_at` e o horário original da fonte. Esse heartbeat permanece operacional local. Separadamente, `health-live.json` registra cada ciclo; sua versão pública `live/6258/health.json` alimenta o campo `health` do manifesto, sem criar resultado eleitoral ou renovar horários do snapshot.

O recibo `publication-live.json` só é salvo depois de concluir a publicação local e, quando habilitada, a remota. Falhas remotas não marcam um lote como concluído: a próxima tentativa publica novamente. Habilitar o publicador remoto após uma execução local também força a publicação. O recibo conserva o ponteiro anterior para apoiar recuperação e revisão da retenção.

Depois de validar e publicar o lote local, `pending-live.json` registra a pendência remota. O CLI tenta esse upload antes de consultar novamente o TSE, inclusive após reinício e em `--once`. A recuperação lê os objetos locais e confere seus SHA-256; reutiliza exatamente os horários, IDs, municípios e histórico originais. Um backoff global do TSE não bloqueia essa tentativa de R2. A pendência só é removida depois da confirmação remota e dos recibos locais; um dado rejeitado na construção do snapshot não cria pendência nem impede a próxima coleta.

## Observações completas e amostra pública

`history-live.sqlite3` conserva todas as observações diferentes do histórico nacional, com ordem de inserção e horário da fonte. Não existe truncamento em 500 observações. Correções oficiais com o mesmo horário são conservadas; uma sequência A → B → A conserva as três revisões. Repetir uma observação consecutivamente não gera outro registro. Mudanças municipais que não alteram o ponto nacional ainda produzem novo lote municipal, sem acrescentar um ponto nacional idêntico.

O arquivo `history-live.json` do formato anterior, quando presente, é importado uma única vez e preservado no disco. A migração recupera o que ainda existe nele; pontos que uma versão anterior já descartou não são reconstruídos automaticamente do R2.

A API entrega no máximo 500 pontos distribuídos uniformemente ao longo da trajetória ordenada pelo horário da fonte e pela revisão. O primeiro e o último ponto sempre permanecem na amostra; as revisões intermediárias continuam no arquivo integral, mesmo quando não selecionadas para o gráfico. A amostra não cria valores interpolados.

A observação é gravada antes da publicação, para não perder uma informação recebida durante falha de upload. Assim, o arquivo integral pode conter uma observação cuja publicação isolada falhou; ela poderá aparecer em um histórico posteriormente publicado. IDs dos pontos identificam observações e não garantem que exista um objeto público com aquele ID. Os envelopes públicos continuam pertencendo ao snapshot atual.

## Política de retenção e revisão local

- Arquivo integral SQLite, respostas brutas, base e credenciais: preservados; nenhuma exclusão automática.
- Objetos imutáveis locais: elegíveis para revisão somente após sete dias, protegendo os três objetos do lote atual e do lote anterior. `latest.json` nunca é candidato.
- `health.json`: objeto operacional mutável separado do histórico, substituído a cada ciclo; não representa observação eleitoral.
- Objetos R2 de resultados: preservados; o mecanismo abaixo não acessa a rede nem exclui objetos remotos. Uma política remota precisa considerar as referências imutáveis, recuperação e caches antes de ser implantada.

Gerar um plano local somente leitura:

```sh
cd services/collector
python3 -B -m apurar_collector.maintenance \
  --state-dir /var/lib/apurar/state \
  --output /var/lib/apurar/public \
  --retain-days 7 > /tmp/apurar-retencao.json
```

O JSON lista chaves protegidas, candidatos e bytes. O comando não oferece execução destrutiva nem instala agendamento. Revisar o plano e conferir novamente os ponteiros antes de qualquer limpeza futura. Não executar remoção manual durante publicação. O plano não representa autorização de exclusão ou alteração em produção.

A deduplicação evita crescimento por polling idêntico, mas mudanças reais continuam produzindo objetos. Monitorar espaço do estado e volume do bucket durante a eleição; retenção remota e arquivamento após o evento permanecem ações operacionais separadas. Nesta correção não houve exclusão local de dados operacionais, exclusão remota ou deploy.

## Arquivo integral e suplemento

A rodada ampliada adiciona `publication-archive.sqlite3`, que referencia os lotes presidenciais e suplementares confirmados. O plano de manutenção somente leitura protege todos esses objetos e os índices públicos; ele não sugere apagar dados que sustentam consultas históricas. Os objetos atuais de suplemento e arquivo também permanecem protegidos.

Não foi ativada exclusão automática local ou R2. Depois do evento, a política é congelar o acervo, validar recuperação e revisar o plano de órfãos com pelo menos sete dias antes de autorizar qualquer remoção. Índices públicos podem estar em caches; não são tratados como órfãos apenas por existir índice mais recente. Alertas monitoram crescimento e espaço com limites configuráveis.
