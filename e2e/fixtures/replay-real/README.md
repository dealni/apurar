# Replay presidencial com captura real

`manifest.body`, `snapshots.body` e `history.body` preservam exatamente os bytes das respostas públicas capturadas em 25/10/2026, sem modificar horários, eleição, votos, modelo ou projeções. `provenance.json` registra URLs públicas, horários de captura, SHA-256, tamanhos, release observada e limitações. O hash identifica igualdade de bytes com a captura; não é assinatura do TSE.

O acervo da eleição 6258 tem quatro revisões no mesmo horário da fonte, **24/10/2026 às 19:19:13 BRT**. Todas têm zero votos e zero seções contadas. Duas revisões mantêm a projeção, uma a suspende por coleta municipal parcial e a última a retoma. Esses registros permitem conferir proveniência, desempate entre revisões e o tratamento da pré-apuração. Não representam quatro momentos de votação e não comprovam avanço da apuração, correção de contagens ou resultado final.

O arquivo portável `capture-pack.br` contém 14 corpos concatenados, com os bytes originais: os três objetos de cada uma das quatro publicações presidenciais do arquivo, o suplemento e o índice público do arquivo. São **175.896 bytes compactados**, que expandem para 10.833.226 bytes. O formato usa Brotli nativo de `node:zlib`; `capture-pack.json` registra offsets, URLs, tamanhos e SHA-256 de cada corpo, do pacote e do conteúdo descompactado. A compressão compartilha os bytes semelhantes dos municípios e não edita o JSON capturado. O pacote fica restrito aos testes e não integra o bundle web. Não depende de arquivos fora do Git, downloads durante os testes ou permissões de produção.

As capturas existentes continham os três objetos da última publicação. Uma busca em 1.834 arquivos locais confirmou que os nove objetos das três publicações anteriores estavam ausentes. Foram feitos **nove GETs públicos sequenciais** para esses objetos imutáveis, todos conferidos contra os SHA-256 do arquivo público já capturado. Não houve SSH, escrita remota ou alteração de produção. Os originais e a evidência da busca permanecem em `/Users/dealni/Developer/output/replay-presidencial-local-real-2026-10-25/`.

`loadRealPresidentialReplay()` carrega a captura completa atual. `loadRealPresidentialPublications()` retorna as quatro publicações integrais reais em ordem do arquivo. `loadCorePublication(indiceOuId)` seleciona uma delas. Cada publicação contém os corpos originais, snapshot, histórico, municípios e a observação do arquivo; seu manifesto é uma projeção de transporte dos ponteiros arquivados, explicitamente derivada, sem inventar uma captura de `/api/manifest`. As quatro publicações têm horários de publicação distintos, entre 01:58:31 e 08:17:38 UTC de 25/10/2026; todas conservam o mesmo horário da fonte anterior. O helper recusa bytes divergentes e intercepta todas as consultas de API no navegador, sem consultar produção.

```sh
APURAR_TEST_PORT=4331 npm run test:browser -- --grep 'real'
```

O harness preserva o relógio do navegador por padrão. Se um teste alterar apenas o relógio local para observar controles, deve registrar essa condição e preservar os horários da captura. Não mova as observações para o dia da eleição nem adapte resultados de outra eleição para aparentar uma trajetória real do segundo turno de 2026.
