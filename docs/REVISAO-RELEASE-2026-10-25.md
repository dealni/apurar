# Revisão independente e publicação — 25/10/2026

O proprietário autorizou uma nova revisão com agentes, os ajustes necessários, commit, push, deploy e conferência em produção. Nove novos agentes receberam interface, publicação/arquivo, suplemento, núcleo Python, gate de dependências, operação, alinhamento entre telemetria e CSP, runtime do Worker e verificação de fontes. A rodada anterior permanece registrada em `REVISAO-AGENTES-2026-10-25.md`; seus resultados não são apresentados como validação desta release.

## Novas correções

- Uma pendência prioritária indisponível podia voltar ao início da fila em todo ciclo e impedir a coleta das unidades saudáveis. A ordenação inicial ocorre quando chega estrutura nova; as retentativas preservam a rotação da fila.
- A recuperação de horário futuro agora atravessa toda a cadeia: condicionais do cache TSE, aceitação nacional/municipal em memória e persistência SQLite. Uma geração anterior mais de 60s no futuro pode ser substituída por uma geração corrente. A exceção é estreita: regressões normais e conflitos ordinários de IDG continuam recusados, e reduções oficiais posteriores permanecem permitidas. Testes passam por `LiveSession`, banco e reinício.
- A ausência isolada do objeto imutável do índice histórico deixa de impedir sua recuperação. A publicação exige uma cópia íntegra do outro destino ou uma reconstrução com SHA exatamente igual ao ponteiro. Conteúdo presente e corrompido continua recusado; contagem, horário e trajetória continuam impedindo regressão.
- A revisão do navegador considera fontes anteriores ao início da eleição. O horário real da fonte deve permanecer visível sem criar um intervalo de timeline invertido nem oferecer observações inexistentes.

O achado P2 de cobertura regional foi acrescentado à regressão do replay presidencial pausado a 320 px: as seis linhas conservam o aviso completo dentro da coluna, sem interseção com a barra. A quebra de linha do CSS é preservada.

O achado P3 foi tratado sem ampliar a CSP: as respostas HTML recebem `Cache-Control: public, max-age=0, must-revalidate, no-transform` para impedir a injeção automática do beacon. APIs e assets imutáveis conservam suas políticas. A opção é conferida no runtime local do Worker e na resposta efetiva após o deploy; configurações de Analytics de servidor e do monitor de consumo não são alteradas.

O ensaio do Worker completo também identificou exports numéricos do entrypoint incompatíveis com o workerd local. As constantes de timeout ficam no módulo auxiliar; o entrypoint conserva apenas o handler. Um teste de qualidade passa a inicializar o runtime real com R2 local e assets, cobrindo o caso que build e testes unitários isolados não detectavam.

O aviso de preload da Inter foi investigado sem alterações especulativas. As três entradas já usam `as="font"`, tipo WOFF2, `crossorigin` e o mesmo caminho do `@font-face`. Em 12 navegações Chrome (três rotas, 320/1440 px, carga fria/recarregamento), a fonte foi carregada uma vez por navegação, usada na renderização e não gerou o aviso. A inspeção CDP confirmou Inter Variable como fonte custom em texto visível, inclusive no mobile. Uma navegação de produção também não reproduziu o aviso. Isso não exclui uma condição transitória no navegador que originou o relato.

As alterações novas de núcleo e arquivo tiveram revisão cruzada. A interface e o gate também passaram por revisão independente, sem necessidade de desfazer os ajustes anteriores. Dados reais, SQLite, credenciais e artefatos operacionais continuam fora do Git.

## Publicação e evidência

O pre-commit executa `npm run check`; o pre-push exige checkout limpo e executa `npm run check:ci-local` sobre o HEAD enviado. Os hooks não são ignorados e o CI remoto não é usado como evidência.

A publicação conserva a correção do Worker que isola leituras por requisição. Coletor e Worker/frontend devem ter o mesmo SHA nesta release; o marcador `/_release.json` registra as versões, hash do lock, árvore do coletor e horário de build. O processo mantém um único escritor e usa a infraestrutura existente, sem criar recursos, alterar os demais aplicativos ou configurar deploy automático.

O coletor é preparado em diretório próprio, com dependências fixadas, testes offline no Python da VPS e validação da base. A troca preserva estado/publicações, cria checkpoint consistente com o escritor parado e realiza ensaio isolado de recuperação. Os timers existentes ficam pausados durante a manutenção e são retomados após a saúde do novo ciclo; não são executados manualmente para provocar mensagens.

O recibo, os logs dos gates, versões efetivas, hashes, verificações HTTP e capturas desta publicação ficam fora do Git em `Developer/output/deploy-apurar-revisao-agentes-2026-10-25/`. Esse diretório contém a evidência efetiva da operação, incluindo o que foi confirmado e eventuais limites; este documento não substitui o recibo.

## Limites

As verificações reais usam navegação e consultas espaçadas, sem carga artificial. Não comprovam precisão estatística eleitoral nem comportamento do fornecedor durante toda a votação. A janela de confirmação remota continua em 300s. Não existe transação distribuída entre os ponteiros dos destinos, e rollback de código não reverte automaticamente dados já publicados no R2. O aviso de chunks grandes do build é preexistente.
