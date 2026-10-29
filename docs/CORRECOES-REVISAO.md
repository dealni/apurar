# Correções da revisão geral — 24/10/2026

Correções locais posteriores à primeira publicação. Não houve commit, push, deploy, troca de serviço, alteração do bucket ou exclusão de dados operacionais nesta rodada. A versão publicada inicialmente continua sendo `821dae94192665de0501d6b3cf581b13c49f51c8` até um novo deploy autorizado. O design do acervo público de terceiros foi mantido; as alterações abaixo se concentram na nova funcionalidade `/apurar/` e no seu feed.

## Dados oficiais, cobertura e modelo

O parser aceita votos computados (`vap`) diferentes dos válidos (`vv`), preservando destinações e totais adicionais do EA20. Uma inconsistência com as premissas do modelo suspende a estimativa, sem impedir a publicação dos números oficiais. A interface separa a base percentual das candidaturas dos votos válidos e identifica destinações especiais. Não se criam probabilidades, intervalos calibrados nem chamadas de vencedor.

O encerramento nacional não interrompe mais a sincronização municipal. O coletor continua com lotes limitados, respeita backoff, reconcilia revisões finais e funciona quando iniciado após o encerramento. Um resultado nacional final confirmado naquele ciclo continua publicável mesmo se a etapa municipal falhar. Uma falha da própria fonte nacional conserva o último resultado válido.

Uma UF com municípios ausentes ou denominadores desconhecidos não pode aparecer como 100% apurada. O subtotal observado recebe aviso de cobertura incompleta; ausência não equivale a zero e não certifica conclusão. Identidades usam o catálogo oficial, inclusive a unidade que ainda não tem polígono no mapa herdado.

## Histórico e publicação

Todas as observações do histórico são conservadas em SQLite. A API apresenta uma amostra de até 500 pontos cobrindo toda a trajetória, sem eliminar o início do arquivo integral. Consultas sem mudança material reutilizam o mesmo lote, inclusive após reinício. O heartbeat operacional permanece separado do horário do resultado. Falhas de upload são repetidas sem marcar o lote como concluído. Uma pendência durável conserva o bundle e seus horários exatos; o CLI tenta publicá-la antes da próxima coleta, inclusive após reinício, sem depender de liberação do backoff global do TSE. Entradas inválidas não criam pendência nem impedem a coleta seguinte.

Os clientes usam `/api/manifest` e URLs imutáveis por SHA-256 para carregar snapshot, municípios e histórico da mesma geração. Aplicam o conjunto somente depois de todas as validações e conservam o último lote válido em falha. Publicações com `published_at` anterior ao último aceito são recusadas; correções oficiais que reduzem votos continuam aceitas quando a publicação é mais nova. Os endpoints anteriores permanecem disponíveis para compatibilidade.

A política e o plano de revisão de retenção estão em [HISTORICO-E-RETENCAO.md](HISTORICO-E-RETENCAO.md). A deduplicação reduz crescimento por polling; não foi ativada exclusão automática nem regra remota que possa remover referências ainda utilizadas.

## Interface e compartilhamento

O relógio anterior ao dia eleitoral usa tempo assinado, evitando contador congelado e horário artificial 00:00. Os horários reais da fonte permanecem visíveis. A busca não converte eleitorado ausente em zero. Zonas/bairros e cidades do exterior sem integração atual são identificados como indisponíveis, preservando organização, mapas e navegação visual. Cadastros geográficos de referência não são apresentados como resultados atuais. A comunicação antiga de presença `/api/vivo` foi removida da nova rota.

O PNG compartilhado inclui a projeção nacional e os avisos correspondentes, com data/hora da fonte e identificação de demonstração/replay quando aplicável. O resultado oficial final tem identificação própria; uma projeção indisponível não é substituída por números inventados. O CSV continua no diagnóstico `/simples/`.

As páginas históricas, a página de anúncios e os assets capturados permanecem preservados. Formulários sem serviço de envio continuam informando indisponibilidade; não foi incorporado um backend privado inexistente.

## Verificação

A revisão foi dividida entre implementadores e revisores independentes, com regressões de encerramento, destinação de votos, cobertura incompleta, histórico acima de 500 observações, deduplicação/reinício/falha de upload, consistência de gerações, relógio, ausências e PNG em desktop/celular. A validação integrada final `npm run check:ci-local` passou com **296 testes**: 88 de qualidade, 58 Vitest, 88 Python e 62 de navegador desktop/celular. O build e o empacotamento Wrangler `--dry-run` também passaram, sem publicação. Os resultados e limites efetivos estão no relatório externo da rodada; CI remoto não foi usado como evidência.

Limites: a fonte ainda estava em pré-apuração durante a revisão, portanto não há demonstração de acurácia futura nem ensaio real da noite completa de segundo turno. A assinatura JWS continua opcional e não verificada. Compartilhamento Web Share depende do suporte/permissões do navegador; a geração e o download do PNG são testados independentemente dessa interface nativa.

## Fontes técnicas

- [TSE — EA20 e destinação dos votos](https://www.tse.jus.br/eleicoes/eleicoes-2026-content/arquivos/divulgacao-de-resultados/tse-ea20-arquivo-de-resultado-unificado).
- [TSE — informações técnicas de divulgação](https://www.tse.jus.br/eleicoes/informacoes-tecnicas-sobre-a-divulgacao-de-resultados).
- [Cloudflare — consistência do R2](https://developers.cloudflare.com/r2/reference/consistency/).
- [Cloudflare — ciclo de vida dos objetos](https://developers.cloudflare.com/r2/buckets/object-lifecycles/). Não foi aplicada expiração automática: uma regra por idade não considera por si só o ponteiro publicado.
