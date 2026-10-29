# Revisão de layout mobile e computador — 25/10/2026

Revisão local com dois agentes: um para celular e outro para desktop/tablet. Abrangeu painel presidencial, primeiro turno, governadores, exterior, busca, menu, diálogos e histórico. Sem commit, push ou deploy nesta etapa.

## Problemas corrigidos

- Em 768×1024, o mapa ficava com aproximadamente 162px de altura, com rótulos comprimidos e parte do resultado presidencial cortada. Tablets a partir de 700px agora dividem resultados e mapa em duas colunas, com rolagem no cartão quando necessária e linha do tempo visível.
- A coluna de resultados de 300px agora apresenta candidaturas secundárias e indicadores em uma coluna; os retratos dos dois líderes cedem espaço aos nomes e partidos.
- Janelas abaixo de 700px, inclusive 512×384, usam fluxo vertical. A lateral fixa de paisagem deixava mapa e linha do tempo comprimidos nesse tamanho, relevante para uso com zoom.
- No celular de 320px, o zoom do mapa de governadores cobria marcadores como SE e ES. Governadores e exterior agora reservam uma linha aos controles, preservando o recorte do canvas ao aproximar.
- Os controles de retorno ao estado e as candidaturas secundárias passam a ter altura mínima de 44px em telas pequenas ou com ponteiro de toque.

## Referências pesquisadas

[W3C — Reflow](https://www.w3.org/WAI/WCAG22/Understanding/reflow.html) orienta a preservar conteúdo e funcionalidade em larguras equivalentes a 320 CSS px, com exceções para conteúdo bidimensional como mapas. A revisão usa fluxo vertical para janelas estreitas e mantém espaço útil para os mapas.

[W3C — Target Size Minimum](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html) trata de alvos mínimos e espaçamento; controles maiores facilitam o toque. Os controles ajustados seguem os 44px já usados pelo projeto.

[NN/g — Mobile Tables](https://www.nngroup.com/articles/mobile-tables/) recomenda preservar a legibilidade das informações, evitando comprimir dados em colunas estreitas. Os indicadores e as candidaturas secundárias foram reorganizados conforme a largura real do cartão.

Nenhum código ou asset dessas fontes foi incorporado.

## Validação e limites

Os testes `layout-tablet.spec.ts` verificam área útil do mapa, ausência de transbordamento horizontal, fluxo em janelas estreitas, alinhamento das colunas, leitura de nomes/valores e acesso por rolagem. `mobile-controles-mapa.spec.ts` verifica geometria e acesso aos controles de zoom em 320, 390 e 430px, além dos alvos de toque.

As capturas e logs locais ficam em `.artifacts/revisao-layout/`, fora do Git. Dados de teste são interceptados apenas no navegador e não alimentam produção. A revisão usa Chrome desktop e emulação mobile; não equivale a uma certificação completa WCAG nem a testes em aparelhos físicos. Marcadores geográficos pequenos permanecem com as dimensões existentes para evitar sobreposição; busca e filtros são alternativas de seleção.

`APURAR_TEST_PORT=4341 npm run check:ci-local` terminou com sucesso: dependências, licenças, inventários, geografia, limites, tipos, formato, testes de qualidade, 238 testes JavaScript/TypeScript, 363 testes Python, build e 396 testes de navegador aprovados. Outros 32 casos de navegador foram pulados pelas condições de projeto/viewport da suíte. A execução não dependeu de CI remoto.
