# Coletor e projeção do Apurar

Python **3.11+**, biblioteca padrão para coleta, modelo, testes e geração local. A importação dos módulos não inicia rede. O publicador remoto usa o SDK oficial AWS Boto3 opcional, fixado em `requirements-r2.txt`; a Cloudflare documenta seu uso com R2.

Este serviço foi extraído de `Aplicativos/apuracao`. O processo acompanha somente o segundo turno presidencial de 2026; não carrega replay nem prior de 2022. Preserva o motor matemático existente e os limites de consistência. [Proveniência](MIGRACAO.json) registra hashes dos arquivos originais e migrados; [equivalência](tests/fixtures/model-equivalence.json) congela cinco cenários calculados no motor original.

## Verificar sem rede

Na raiz do repositório:

```sh
python3 -B services/collector/check.py
```

O gate confere sintaxe Python e executa testes de cliente TSE/coleta, modelo, equivalência, snapshot, lock, persistência, publicação parcial e transporte de dados. A base mínima pública congelada já acompanha o checkout em `resources/runtime-data.zip`; os testes verificam também o carregamento de clone limpo, sem diretório operacional e sem gravações automáticas. A suíte não acessa o TSE nem o R2.

## Executar demonstração offline

```sh
cd services/collector
python3 -B -m apurar_collector --demo --save-fixture .artifacts/fixture-demo.json
python3 -B -m apurar_collector --fixture .artifacts/fixture-demo.json --output .artifacts/replay-bucket
```

Sem argumentos, executa demonstração uma vez. `--fixture` lê envelope local `{collection, prior}`; sempre produz `mode: demo`, mesmo que a entrada tenha sido copiada de dados reais. Os números/candidaturas da fixture padrão são fictícios. O algoritmo de projeção é o mesmo usado no runtime.

A saída espelha o layout R2 sob `.artifacts/bucket/demo/6258/`: `latest.json` aponta para snapshot, municípios e histórico em chaves com SHA-256. Demo não funciona como fallback do feed oficial e **nunca pode ser publicada remotamente** pelo CLI. Todos os arquivos de execução ficam ignorados pelo Git.

## Dados mínimos incluídos, sem rede

Um clone limpo já consegue inicializar o modelo usando `resources/runtime-data.zip` (311.013 bytes), com cadastro e prior públicos congelados e verificados por `dataset-manifest.json`. Quando `--data-dir` é omitido, o serviço usa o diretório operacional `data/` se existir; caso contrário lê o ZIP em memória, sem extrair nem gravar arquivos. Um `--data-dir` explicitamente informado e inexistente continua sendo erro. SQLite e arquivos brutos nunca integram esse pacote.

O bootstrap externo continua disponível para conferir novamente a migração. A origem local precisa conter os arquivos identificados em `dataset-manifest.json`. O bootstrap confirma o hash do manifesto original e de cada arquivo antes de copiar:

```sh
python3 -B -m apurar_collector --bootstrap /Users/dealni/Developer/Aplicativos/apuracao/data
```

Somente `cadastro.json` e `prior_runoff2026.json` são copiados para `services/collector/data/`. Nenhum SQLite vivo, WAL/SHM, replay, histórico de 2022 ou acervo de estudos é necessário. O runtime exige os hashes fixados no manifesto versionado; uma mudança legítima de base requer revisão explícita desse manifesto.

Para transportar a base numa instalação posteriormente autorizada:

```sh
python3 -B -m apurar_collector --export-dataset .artifacts/apurar-runtime-data.zip
python3 -B -m apurar_collector --import-dataset .artifacts/apurar-runtime-data.zip --data-dir .artifacts/restored-data
```

O ZIP tem apenas os dois arquivos e o manifesto, é determinístico e recebe arquivo `.sha256`. A importação compara o manifesto com o checkout, confere o conteúdo e rejeita nomes inesperados, duplicados, traversal e arquivos excessivos antes de gravar. Não transporta credenciais. A exportação/importação local foi exercitada e os arquivos restaurados passaram na verificação de hashes.

## Coleta ao vivo — ação explícita

Os comandos abaixo acessam a fonte e não fazem parte da verificação offline:

```sh
python3 -B -m apurar_collector --live --once
python3 -B -m apurar_collector --live
```

Apenas `--live` habilita consultas ao TSE. `--once` executa um ciclo limitado; a reconciliação inicial completa pode exigir vários ciclos. Sem essa opção, o processo acompanha os intervalos e backoff da fonte. O perfil local usa uma quota compartilhada de no máximo 70 requisições/s, com oito consultas em voo e sem rajadas, abaixo do teto oficial de 100/s por IP. Respostas 304, erros e redirecionamentos também usam essa cota. Respostas 403/429 suspendem toda a coleta por pelo menos dez minutos, respeitando `Retry-After` maior; a pausa restante é restaurada após reinício. Arquivos 404 mantêm espera de dez minutos por URL. Não iniciar outro coletor ou consumidor independente no mesmo IP sem contabilizar a cota agregada.

O processo grava resposta bruta antes da normalização em `.artifacts/state/raw/`, mantém o cache oficial SQLite vinculado a 6258 e restaura nacional/municípios após reinício. Um lock impede duas instâncias no mesmo diretório. Em erro de rede, bloqueio ou dado não divulgável, conserva o último bundle publicado. Correções oficiais posteriores podem reduzir contagens e são aceitas pelo coletor original.

Não há servidor HTTP na VPS. Cada ciclo com mudança material calcula uma vez; visitantes consomem objetos publicados pelo Cloudflare. O histórico não ganha pontos por consultas repetidas à mesma observação. O arquivo SQLite conserva a trajetória completa; o feed público amostra até 500 pontos cobrindo início e fim. Consultas sem mudança material reutilizam o lote anterior; o heartbeat operacional é separado. Detalhes em [histórico e retenção](../../docs/HISTORICO-E-RETENCAO.md).

## Publicação remota — ação explícita separada

```sh
python3 -m venv .venv
.venv/bin/python -m pip install -r requirements-r2.txt
.venv/bin/python -B -m apurar_collector --live --publish-r2 --once
```

Definir fora do Git: `R2_ACCOUNT_ID`, `R2_BUCKET`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`. O SDK usa endpoint HTTPS derivado do account ID, assinatura AWS, região `auto`, timeouts e retries limitados. Nenhuma credencial é impressa. Não há autenticação por query string nem bucket público de escrita.

O publicador grava primeiro os objetos imutáveis, confirma cada leitura e só então troca `live/6258/latest.json`. Qualquer falha anterior à troca preserva o ponteiro. Manifestos incluem `snapshot_id`; os envelopes extras repetem esse ID para impedir mistura de lotes. Uma publicação com timestamp anterior ao ponteiro é rejeitada, comparando instantes com fuso.

A escrita do ponteiro pressupõe **um único escritor por bucket/prefixo**. O lock local não coordena hosts diferentes. Não iniciar dois publicadores em máquinas ou diretórios diferentes; múltiplos escritores exigiriam coordenação remota antes de habilitá-los.

Os modelos de serviço e variáveis ficam em [infraestrutura](../../infra/README.md), e o runbook em [operação](../../docs/OPERACAO.md). Ativar serviço, enviar dados ao R2 ou instalar em VPS é deploy e exige autorização própria.

## Contratos e limites

- Snapshot mantém `schema_version: 1`, eleição 6258/2026/2/Presidente, votos oficiais separados de projeção, horários da fonte/coleta/publicação e `mode` explícito.
- Campos adicionais: `totals`, `coverage`, metadados da fonte e `projection.votes/notes/experimental/pre_count`.
- Municípios: `{schema_version:1,election:"6258",snapshot_id,items:[...]}`. `ibge_code` propaga o código IBGE7 `cdi` do cadastro TSE para join cartográfico direto. Unidade indisponível mantém `counted/as_of: null`, sem fabricar zero. IDs incluem `SP:00001` e `ZZ:aggregate`.
- Histórico: `{schema_version:1,election:"6258",snapshot_id,points:[{snapshot_id,as_of,sections,candidates,projection}]}`.
- O prior usa exclusivamente o primeiro turno de 2026 renormalizado entre 13/22. A taxa inicial de votos válidos por seção pode diferir no segundo turno; não há transferência individual identificada nem probabilidade calibrada.
- Desvios municipais/nacionais acima de 3%, cadastro incompleto ou projeção abaixo da votação nacional suspendem somente a estimativa. A apuração oficial continua disponível. No encerramento, a estimativa é substituída pelo total final oficial.
- Assinatura JWS ainda não foi integrada: `source.signature_verified` permanece `false`. Hash dos objetos comprova integridade do bundle, não autenticidade da fonte.
- Os identificadores e o contrato TSE precisam ser conferidos contra a configuração oficial antes do deploy. O adapter migrou o contrato 6258/13/22 existente; não afirma ter realizado essa conferência pela implementação offline.
- A política local de retenção e o plano somente leitura estão em `docs/HISTORICO-E-RETENCAO.md`. Arquivo integral e respostas brutas são preservados; objetos locais sem referências ficam elegíveis para revisão após sete dias. Nenhuma limpeza destrutiva automática ou regra remota R2 foi ativada.

Fontes de implementação: [Boto3 no R2](https://developers.cloudflare.com/r2/examples/aws/boto3/) e [SDK Boto3](https://pypi.org/project/boto3/).

## Cadência e saúde operacional

A política comum fica em `resources/timing.json`, consumida pelo Python e pelo TypeScript. Ciclos normais aguardam 15s depois do trabalho, filas pendentes 2s e encerramento coerente 300s; exceções aguardam 30s. As UFs são revisitadas em varredura completa após 45s do término da anterior, com janela de até oito consultas em voo e sob a quota compartilhada de 70 requisições/s. Rede, cálculo e publicação se somam a esses intervalos; não há garantia de latência municipal fixa.

Cada ciclo registra duração do trabalho, pendências, estado e última consulta nacional bem-sucedida em `health-live.json`, no estado local. O pequeno objeto mutável `live/6258/health.json` também é publicado; o Worker o valida e o inclui em `/api/manifest`. Isso não troca o lote eleitoral nem seus horários. Falha da saúde não bloqueia os votos oficiais. Pendência recuperada de R2 recebe estado próprio até nova consulta ao TSE.

O navegador consulta a cada 15s visível ou 60s oculto e consulta imediatamente ao voltar. Um manifesto com o mesmo ID e as mesmas três referências reutiliza o lote previamente validado. Erros de lote preservam a geração anterior. A idade do resultado e a saúde do processo são distintas; dois minutos sem um novo resultado não significam falha do coletor. O estado final tolera a cadência de cinco minutos mais um minuto para rede/cache.

A ativação exige deploy autorizado do coletor e do Worker/frontend compatíveis.

## Aceleração local da coleta

O núcleo começa com lotes de 256 municípios e adapta o tamanho até 512, com janela de admissão de 8s. O CLI admite até 128 detalhes suplementares, sob janela de admissão de 15 segundos. Não existe coleta zonal nem opção `--zone-budget`. Os totais estaduais vêm primeiro; municípios de governador e cidades do exterior compartilham a capacidade restante. Esses números são tetos, não metas obrigatórias: filas menores ou bloqueios reduzem o trabalho. Filas suplementares pendentes usam pausa de 2s entre ciclos, inclusive se o núcleo já estiver atualizado ou finalizado. Bloqueios e falhas nacionais preservam suas esperas maiores. Veja [avaliação e limites](../../docs/COLETA-RAPIDA.md). As alterações locais exigem nova publicação autorizada.

### Remoção local das zonas

A coleta mantém 5.572 unidades presidenciais, seis totais estaduais de governador, 469 municípios estaduais e 186 cidades exteriores. Com o total nacional são 6.234 resultados distintos, sem as 6.805 consultas zonais anteriores. Estados antigos são migrados removendo somente alvos, resultados e filas zonais do estado ativo, sem apagar publicações imutáveis. O envelope compatível conserva `zones: []`, capacidade desativada e contadores zonais zerados. As alterações aguardam publicação autorizada.

## Monitor opcional de tráfego e consumo

`apurar_collector.consumption_alerts` consulta Analytics Cloudflare somente leitura e usa o DealniBot externo para avisos deduplicados. É separado do monitor de saúde, não consulta TSE e não altera a coleta. Os testes usam apenas respostas e entregas fictícias. Valores enviados são estimativas brutas por hora/24h, sem franquias; não são fatura nem consumo mensal real. Instalação e ativação exigem deploy autorizado. Veja [tráfego e consumo](../../docs/ALERTAS-CONSUMO.md).
