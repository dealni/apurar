# Revisão geral do Apurar — 25/10/2026

Revisão e correções locais autorizadas pelo proprietário, com 24 agentes especializados em implementação, pesquisa e revisão independente. O checkout estava limpo no início. Não houve commit, push, deploy, alteração de dados em produção ou envio de mensagens. Os repositórios de origem foram preservados.

## Escopo e correções

| Área                     | Resultado da revisão                                                                                                                                                                                                                                                                      |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Painel `/apurar/`        | Demonstração identificada sem rótulo ao vivo; erro antes do primeiro lote explícito; horário com data e fuso; motivo de suspensão da projeção preservado; resultado final acessível e separado da estimativa experimental.                                                                |
| Histórico                | Barra da fonte usa o snapshot congelado; consulta atual do coletor tem identificação própria; exterior atual não aparece dentro do recorte histórico; retorno ao presente restaura a publicação atual.                                                                                    |
| Diagnóstico `/simples/`  | Polling não encerra nem modifica replay; identificação municipal inclui território/UF; busca normaliza acentos/espaços; índices históricos inválidos são recusados.                                                                                                                       |
| Busca e mapas            | Foco, Tab/Shift+Tab, Escape, retorno ao acionador e rolagem do item ativo corrigidos; busca vazia não apresenta rótulo de deputados; geometria e correspondência das 5.571 localidades preservadas.                                                                                       |
| Governadores e exterior  | Votos ocultos, dados anteriores e paletas incompletas não geram cores enganosas; busca sem acentos; percentuais indisponíveis quando faltam votos; cobertura e horários próprios preservados.                                                                                             |
| Arquivo e exportações    | CSV/JSON preservam cobertura, dados anteriores e URL de origem, inclusive nacional; CSV neutraliza fórmulas; carregamento/ausência/filtros explícitos; seleção usa referências imutáveis.                                                                                                 |
| Início e anúncios        | Validação acessível, foco contido no modal e fundo inerte; buscas normalizadas; não há promessa de entrega de e-mail nem simulação de backend.                                                                                                                                            |
| Acessibilidade           | Preferência de movimento reduzido acompanha mudanças do sistema; atalhos de histórico respeitam campos, controles, links, elementos editáveis e diálogos.                                                                                                                                 |
| API e contratos          | Ponteiros exigem SHA-256 coerente; saturação rejeita assincronamente; histórico valida totais; horários exigem fuso e data civil válida; seções/cobertura e extremos do arquivo são conferidos.                                                                                           |
| Coletor e modelo         | Renovação de catálogo remove alvos aposentados; catálogo inválido preserva estado; respostas antigas permanecem pendentes; identidades de UF/eleição/turno incompatíveis suspendem somente a estimativa; restauração suplementar é atômica e rejeita dados incompletos/agendas inválidas. |
| Publicação e recuperação | Objetos imutáveis confirmados antes dos ponteiros; recibos suplementares revalidados; horários comparados como instantes; recuperação confronta conteúdo integral, referências, ordem, extremos e metadados, além dos hashes.                                                             |
| Saúde e alertas          | Último sucesso/filas preservados; falha local não bloqueia saúde remota; desativação do suplemento remove alertas antigos; handlers restaurados; estado recuperado validado; temporários privados; transporte Telegram e deduplicação endurecidos com testes simulados.                   |
| SEO e desempenho         | Canonical/metadados coerentes; primeiro turno identificado como arquivo; sitemap; painel real indexável e demonstração com `noindex` condicional sem distinção por robô; carga de zonas sem uso removida somente da entrada do segundo turno.                                             |

O motor matemático continua exclusivamente no Python. Parâmetros de projeção não foram alterados. A revisão preserva reduções legítimas de votos em correções oficiais e a diferença entre votos computados por candidatura e votos válidos. Ausência continua diferente de zero.

Histórico e arquivo agora validam amostras de 2 a 500 observações antes de abrir o banco. A amostragem SQL preserva ordenação e extremos, transferindo ao Python no máximo 500 corpos em vez de carregar o acervo inteiro. O índice público do arquivo recusa mais de 8 MB antes de escrever objetos ou mover ponteiros; o registro integral continua preservado no SQLite. A consulta de ordenação ainda tem custo proporcional ao acervo.

## Pesquisa

Foram consultadas fontes primárias, sem executar coleta em massa:

- [Documentação técnica TSE 2026](https://www.tse.jus.br/eleicoes/informacoes-tecnicas-sobre-a-divulgacao-de-resultados): códigos de eleição, arquivos oficiais, quota por IP e bloqueios.
- [EA20 do TSE](https://www.tse.jus.br/eleicoes/eleicoes-2026-content/arquivos/divulgacao-de-resultados/tse-ea20-arquivo-de-resultado-unificado): geração/totalização, votos computados, destinação, seções e ausência de divulgação.
- [W3C — diálogos modais](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/): foco contido, Escape e fundo inerte.
- [W3C — movimento reduzido](https://www.w3.org/WAI/WCAG21/Techniques/client-side-script/SCR40): preferência do sistema.
- [Google — noindex](https://developers.google.com/search/docs/crawling-indexing/block-indexing) e [JavaScript SEO](https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics): rastreamento necessário para ler a diretiva e metadados condicionais.

`docs/FONTE-TSE-2026.md` foi atualizado para distinguir a pesquisa histórica de 24/10 da configuração local conferida em 25/10. O README foi corrigido: PNG fica em `/apurar/`, enquanto `/simples/` oferece CSV e TV.

## Validação

O conjunto integrado executou `npm run check:all`: dependências/lock, 245 licenças, inventário de procedência, malha municipal, limites, TypeScript, Prettier, testes de qualidade, JavaScript, Python e build.

Resultado integrado final, sem falhas:

| Verificação                                                                   | Resultado                             |
| ----------------------------------------------------------------------------- | ------------------------------------- |
| Testes de qualidade dos gates/hooks                                           | 92 aprovados                          |
| Vitest — contratos, Worker e integração web                                   | 183 aprovados em 28 arquivos          |
| Coletor Python                                                                | 275 aprovados                         |
| Playwright completo — Chrome desktop e celular                                | 136 aprovados                         |
| Total                                                                         | 686 testes aprovados                  |
| Dependências/lock, licenças, procedência, geografia, limites, tipos e formato | Aprovados                             |
| Build Vite/TypeScript                                                         | Aprovado, com aviso de chunks grandes |
| `git diff --check`                                                            | Aprovado                              |

Foram executados `npm run check:all`, `npm run test:browser` e, após os últimos ajustes Python, `npm run check` novamente. A primeira passagem completa do navegador encontrou quatro asserções com texto antigo de espera após a melhoria do aviso de falha inicial; foram atualizadas para exigir o novo aviso explícito e a suíte completa foi repetida com sucesso. Testes focados dos agentes usaram portas exclusivas. A validação integrada acima prevalece sobre contagens parciais dos agentes.

## Limites concretos

- Testes usam dados sintéticos e ensaios locais. Não comprovam a trajetória eleitoral real, precisão do modelo, disponibilidade dos fornecedores ou release efetiva em produção.
- Formulários sem backend continuam explicitamente indisponíveis. Não foram criados cadastros, entregas ou serviços externos.
- Não existe transação distribuída entre ponteiros local e remoto. Uma falha no segundo destino pode produzir divergência temporária; não gera recibo de sucesso integral e é recuperável no próximo ciclo.
- `noindex` da demonstração depende da execução de JavaScript pelo buscador. A URL canônica aponta para o painel real.
- O build ainda avisa sobre chunks grandes, em especial mapas e acervo histórico. Remover a carga de zonas sem uso reduz trabalho desnecessário; não constitui medição de velocidade em dispositivos reais.
- Esta revisão não inclui envio Telegram real, publicação R2 real, reinício de serviços, teste de carga remoto ou deploy. CI remoto não foi usado como evidência; os gates são locais.
