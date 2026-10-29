# Entrega e validação local

24/10/2026. Registro da integração inicial. A primeira versão foi publicada posteriormente em 24/10/2026; ver `OPERACAO.md`. Correções da revisão posterior estão descritas em `CORRECOES-REVISAO.md` e permanecem locais até novo deploy autorizado.

## Resultado implementado

A página inicial e `/1turno/` e `/anunciar/` preservam o sistema original. A nova rota `/apurar/` reaproveita o design completo do `acervo público de terceiros`: mapas e navegação territorial, placar, cartões, busca, histórico e tela cheia/TV. A identidade é Apurar e a disputa é a presidencial do segundo turno de 2026. O painel anterior permanece em `/simples/` como diagnóstico; não constitui outro motor.

A nova rota `/apurar/` consome exclusivamente a API do Apurar. Nela, o simulador e o motor de previsão da referência foram removidos; a fachada `simulation.js` conserva somente metadados e compatibilidade visual. Os recursos originais permanecem intactos na rota histórica `/1turno/`, identificada como material arquivado. O runtime Preact/htm recuperado foi substituído por dependências oficiais fixadas. A rota nova não carrega feeds ou candidaturas da captura como se fossem atuais. O conteúdo público completo foi preservado para as páginas originais, com os avisos de arquivo correspondentes.

O coletor Python migra o núcleo existente, preserva os cálculos e executa sem servidor público. Ele coleta, concilia e calcula uma vez por versão, gera snapshot, municípios e histórico e publica objetos imutáveis com SHA-256 antes de atualizar o ponteiro. O Worker é somente leitura, verifica os objetos e mantém cache/ETag. SQLite e dados operacionais permanecem fora do Git. A base pública mínima do primeiro turno foi incluída em ZIP verificado de 311 KB; o modelo inicia em um clone limpo sem depender da pasta do projeto antigo.

O catálogo oficial do TSE fornece 5.571 correspondências IBGE→TSE. Todos os 5.570 polígonos municipais herdados receberam identidade oficial, sem aproximação por nomes. A malha visual herdada não contém geometria para o município adicional do cadastro; isso não exclui seus votos do agregado nacional ou da API.

## Revisão independente

Implementadores e revisores trabalharam separadamente em motor/coletor, frontend, integração e gates. Foram identificados e corrigidos:

- Municípios sem resultado rejeitando o feed inteiro; a ausência agora permanece explícita.
- Detalhes de um lote combinados com total nacional de outro; contratos exigem `snapshot_id` correspondente.
- Replay herdando totais e rótulos de uma atualização posterior; cada ponto usa seus próprios dados.
- Atualizações repetidas expulsando observações úteis do histórico.
- Revisões no mesmo minuto selecionando uma versão anterior; a seleção usa a última revisão daquele minuto.
- Linha temporal com espaçamento uniforme; a posição agora respeita o tempo, inclusive após meia-noite.
- Alegações de faixa de confiança/chamada de vencedor da referência, ausentes no nosso modelo.
- Animação numérica herdada exibindo temporariamente 90% do valor; os valores eleitorais do feed são apresentados diretamente.
- Ausência de dados exibida como zero, carregamento infinito ou eleitorado inventado.

## Evidências

Os 292 arquivos da interface original de apuração foram comparados byte a byte. A página de anúncios também foi restaurada e comparada; a home recebeu somente o acesso à nova projeção, ajuste do contador e metadados locais. O plugin de fragmentos HTML foi restaurado para manter todas as seções da home e de anúncios.

A suíte final aprovada soma **233 testes**: 88 de qualidade, 39 Vitest, 66 Python e 40 Playwright. Os logs locais ficam em `.artifacts/qualidade-restauracao-final.log` e `.artifacts/qualidade-recursos-delta.log`.

O comando completo é `npm run check:ci-local`, também executado pelo pre-push sobre HEAD e checkout limpo. Ele reúne dependências, licenças, integridade dos assets importados, limites, tipos, formato, testes de qualidade, contratos/Worker/adapter, núcleo Python, build e navegador desktop/celular. A saída efetiva de cada execução prevalece sobre contagens intermediárias de relatórios.

Foram ensaiados localmente o fluxo Python → objetos/bucket simulado → Worker → parsers e navegador, upload parcial, conteúdo adulterado, referência ausente, correção de votos, indisponibilidade e conservação do último snapshot válido. O SDK Boto3 real foi instalado em venv local e exercitado com Stubber para escrita/leitura/404, sem credenciais nem chamadas remotas. As dependências opcionais de publicação estão fixadas em `requirements-r2.txt`.

O empacotamento Wrangler com `--dry-run` passou. Uma execução Wrangler exclusivamente local confirmou assets HTTP 200 com CSP, API ausente HTTP 503 sem inventar resultados, HEAD sem corpo e escrita pública HTTP 405. Esses testes não publicam um Worker ou bucket remoto.

As fontes oficiais foram pesquisadas e o parser foi conferido com arquivos públicos correntes do TSE: configuração, total nacional e catálogo municipal. A apuração do segundo turno ainda estava sem seções totalizadas nessa consulta. Detalhes e hashes estão em `FONTE-TSE-2026.md`.

## Limites e próxima decisão

O sistema implementado cobre o modelo presidencial existente. Não há probabilidades de vitória, intervalo de confiança calibrado ou projeção para governadores. A assinatura JWS é opcional no formato documentado e não está verificada pelo aplicativo; o campo de autenticidade permanece explícito. Testes de mecanismo e equivalência não demonstram acurácia futura.

Os formulários de avisos e anúncios não têm o backend privado da origem; o comportamento local permanece explícito, sem confirmar cadastro ou envio. A implementação nova solicitada é a projeção, e não um serviço de e-mail ou publicidade.

Este era o estado anterior ao primeiro deploy. Posteriormente foram publicados Worker/assets na Cloudflare e ativado o coletor na VPS Apps, com bucket privado R2. Não houve configuração de domínio próprio. O estado operacional e a distinção entre versão publicada e correções locais constam em `OPERACAO.md`.
