# Revisão de arquitetura do Apurar

Revisão de 24/10/2026, somente leitura dos projetos irmãos e documentação oficial. Este documento é uma recomendação; não comprova infraestrutura provisionada, publicação ou execução em produção.

## Direção

Preservar o núcleo Python existente do `apuracao` e migrá-lo por extração de responsabilidades, sem reescrever os cálculos durante a integração. A interface React/Vite deve ser estática, servida por Cloudflare Workers Static Assets. Um Worker somente de leitura entrega os snapshots do R2; a VPS apps fica com coleta, normalização e cálculo. Nenhuma requisição pública deve depender diretamente da VPS.

```text
TSE → collector Python único na VPS apps
      → arquivo bruto + manifesto/hash
      → normalização → projeções determinísticas
      → R2: snapshot imutável
      → verificar objetos publicados
      → R2: latest.json

Navegador → Workers Static Assets
          → Worker de API somente leitura
          → R2: latest.json / snapshots
```

Separar leitura pública e escrita operacional. O collector recebe uma credencial restrita ao bucket necessário; o Worker leitor recebe binding R2 e não expõe operações de escrita. Não transportar autenticação, PostgreSQL ou gateway dos irmãos sem um requisito concreto. Journal local e snapshots R2 bastam para o MVP, desde que recuperação e retenção sejam testadas.

## Padrões encontrados nos irmãos

Os checkouts `portfolio`, `citrya` e `arpoflow` estavam limpos na consulta. O `portfolio` é referência para frontend estático e Static Assets; `arpoflow`, para contratos compartilhados, publicação de objetos imutáveis e conferência antes de trocar o ponteiro. Citrya e Arpoflow mantêm documentação com dono por assunto.

Node `>=24.22.1 <25`, npm `>=12.2.1 <13`, dependências exatas, lockfile, Lefthook e commitlint são os padrões atuais lidos. Os limites de produto são 500 linhas físicas por arquivo, complexidade ciclomática 15 e 150 linhas efetivas por função. A reprodução dos gates deve considerar também Python; os checkers TypeScript existentes não comprovam limites sobre Python.

Referências locais: `../portfolio/README.md`, `../portfolio/wrangler.jsonc`, `../portfolio/package.json`, `../citrya/README.md`, `../citrya/package.json`, `../arpoflow/README.md` e `../arpoflow/package.json`.

## Componentes e contratos

Manter frontend, Worker leitor, núcleo Python e contratos em diretórios separados. A organização pode usar `apps/web`, `apps/api`, `apps/collector`, `packages/contracts`, `fixtures`, `infra`, `scripts` e `docs`, adaptando-se à fundação implementada. Não manter duas implementações de projeção com resultados potencialmente divergentes: o cálculo deve ser produzido pelo núcleo Python e consumido pelo frontend.

O contrato público precisa ter versão explícita. Cada publicação inclui eleição, turno, cargo, abrangência, versão do modelo, horários de geração da fonte, coleta e publicação, ID da fonte, hash e indicação de simulação ou dado oficial. Não confundir pleito com identificador da eleição.

Snapshots usam chaves imutáveis com eleição, abrangência e hash. Primeiro publicar todos os objetos de um conjunto, depois conferir leitura/hashes e só então mover `latest.json`. Um único escritor evita corrida; múltiplos escritores exigem coordenação e atualização condicional. Não assumir transação entre objetos R2.

O navegador aceita um conjunto completo e mantém o último válido em caso de erro. Exibir horário e estado de desatualização; nunca substituir falta de dados por zero, nem apresentar demonstração como apuração real. Não misturar agregados Brasil, UF e município de momentos diferentes sem expor seus horários.

## Cache e custo

Static Assets permite entrega de assets sem execução de Worker; a documentação informa requests estáticos gratuitos e ilimitados. Requests que invocam o código do Worker seguem a cobrança e limites do plano. Não ativar `run_worker_first` indiscriminadamente. Fonte: [Billing and Limitations](https://developers.cloudflare.com/workers/static-assets/billing-and-limitations/).

R2 oferece consistência forte nas operações do bucket, mas cache de domínio pode manter objetos antigos ou respostas 404. Objetos imutáveis têm TTL longo; `latest.json`, TTL curto e controlado. Publicar o objeto antes de anunciar a URL evita cache negativo. Fonte: [R2 consistency](https://developers.cloudflare.com/r2/reference/consistency/).

Não usar KV como ponteiro crítico de atualização a cada poucos segundos: propagação pode demorar 60 segundos ou mais entre localidades. Fonte: [How KV works](https://developers.cloudflare.com/kv/concepts/how-kv-works/).

Começar com polling condicional e intervalo configurável, pausado em abas ocultas. Avaliar SSE somente após medir necessidade. No Worker leitor, cache reduz leituras R2, mas não elimina invocações do Worker. Medir requests, leituras, bytes e CPU antes de estimar custo ou capacidade. Bucket público com domínio e Cache Rules é alternativa futura caso o volume justifique retirar a execução de Worker da distribuição de JSON. Fonte: [R2 public buckets](https://developers.cloudflare.com/r2/buckets/public-buckets/).

## Fonte TSE 2026

O TSE informa segundo turno em **25/10/2026**, pleito **3221**. O adapter deve consultar configuração EA11 para os identificadores de eleição e confirmar os caminhos no ambiente oficial, sem inferir IDs de exemplos antigos. A divulgação é anunciada a partir das 17h, horário de Brasília.

A documentação 2026 reúne EA10/11/12/14/15/16/18/20 e manual JWS. O TSE esclarece que IDG identifica cada arquivo: não há garantia documentada de monotonia nem de igualdade entre arquivos de uma carga. Para Presidente, a informação oficial de eleito deve vir da totalização nacional EA20 Brasil, pois não está previsto EA10 específico.

Fontes oficiais:

- [Informações técnicas sobre divulgação 2026](https://www.tse.jus.br/eleicoes/informacoes-tecnicas-sobre-a-divulgacao-de-resultados).
- [Especificações e manuais de divulgação 2026](https://www.tse.jus.br/eleicoes/eleicoes-2026-content/arquivos/divulgacao-de-resultados).
- [Divulgação dos resultados 2026](https://www.tse.jus.br/eleicoes/eleicoes-2026-content/divulgacao-dos-resultados-das-eleicoes-2026).

Registrar URL oficial, hash, horário e identificadores de cada resposta. Validar autenticidade conforme o manual JWS e não rotular uma resposta como assinatura verificada antes de implementar esse procedimento. Conferir os requisitos de redistribuição apontados na página oficial antes de publicar.

## Coleta e recuperação

Um processo Python supervisionado por systemd, sem porta pública, recebe limites de CPU/memória e diretório próprio. Usar limite de concorrência, timeout, requests condicionais quando suportados, backoff com jitter e bloqueio de rodadas sobrepostas. Não coletar o TSE por visitante.

Arquivar a entrada antes de normalizar. Reprocessar a mesma entrada deve ser idempotente. Não descartar automaticamente redução de votos: ela pode representar retotalização; preservar o bruto, registrar revisão e exigir tratamento explícito do normalizador.

Replay injeta relógio e sequência de entradas gravadas, sem acesso à fonte ao vivo. Backtests não podem consultar resultados futuros. Uma falha na projeção não interrompe a entrega da apuração oficial. Rollback pode selecionar snapshot anterior; a interface deve comunicar a idade do dado e a revisão. Restore exige ensaio de reconstrução a partir de entradas e manifestos, não apenas existência de arquivos.

## Gates e aceite

- Lint, formato, tipos e build do frontend/Worker; validação Python compatível com a versão preservada do núcleo.
- Contratos TSE e snapshot com fixtures oficiais; payload truncado, campo ausente, candidato ausente, decimal com vírgula, empate, zero, revisão de total, repetição e atraso.
- Equivalência dos cálculos antes/depois da extração Python sobre fixtures congeladas; mudanças de modelo devem ter versão e avaliação próprias.
- Replay determinístico; backtest sem acesso futuro e sem interpretar porcentagem apurada como amostra aleatória do país.
- Integração local collector → R2 simulado → Worker → frontend, incluindo publicação parcial e falha de upload.
- Playwright em desktop/celular: filtros, atualização, foco, estado obsoleto, demonstração explícita, tabela alternativa ao mapa e movimento reduzido.
- Testes de falha: TSE indisponível, timeout, reinício do collector, leitura R2 falha e conservação do último snapshot válido.
- Gitleaks, licenças, dependências, limites de tamanho/complexidade e revisão de configuração/segredos.
- `check:all` no pre-push local, sem `--no-verify`. CI remoto indisponível não significa aprovado ou reprovado.

## Sequência operacional

1. Extrair e congelar comportamento do núcleo Python; registrar contratos e fixtures reais TSE 2026.
2. Integrar dados normalizados e replay à fundação React/Vite e Worker leitor; manter demonstração explícita até haver coleta validada.
3. Entregar apuração oficial, fonte, horários e estados de erro; integrar projeções somente após equivalência e backtest.
4. Ensaiar publicação, interrupção e recuperação integralmente em ambiente local/isolado.
5. Preparar manifestos e runbooks revisáveis. Provisionamento e deploy dependem de autorização própria; este plano não os executa.
6. Após autorização e antes de abrir o público, confirmar configuração do pleito, relógio, credenciais, retenção e resultados oficiais; acompanhar coleta antes de liberar o ponteiro público.

Considerando a proximidade do segundo turno, a prioridade é um MVP correto e rastreável. Riscos principais: diferenças de layout TSE entre anos, retotalização, distribuição geográfica desigual da apuração, suposição incorreta sobre IDG, cache do ponteiro, custo de polling e aparência de resultado oficial em projeções. Projeção deve ser desligável sem desligar apuração.
