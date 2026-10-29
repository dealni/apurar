# Layout com prioridade no mapa — 25/10/2026

Revisão local autorizada para deixar o Apurar mais limpo e destacar o mapa no celular. O trabalho foi dividido em cinco áreas, cada uma com um agente de implementação e outro de revisão independente: cabeçalho e navegação, Presidente e primeiro turno, governadores, exterior e desktop/tablet. As correções da revisão responsiva anterior foram preservadas.

## Organização da interface

No celular, a marca, o menu, a busca e as ações do mapa dividem um cabeçalho compacto. Exterior, compartilhar/exportar e tela cheia permanecem acessíveis em “Ações do mapa”, com rótulos e alvos de toque. O replay e a barra da fonte mantêm seu contexto temporal. Durante a rolagem, o seletor de cargo permanece abaixo da faixa da fonte; o atalho aos resultados calcula o espaço real ocupado pelas duas barras, inclusive com quatro cargos em duas linhas.

Presidente e primeiro turno apresentam um contexto breve, o mapa e seus controles antes dos resultados completos. “Ver resultados” transfere o foco para os detalhes. A seleção de um local preserva a posição quando o mapa já está visível. Projeção experimental e demais indicadores continuam separados da contagem oficial.

Governadores e exterior apresentam filtros compactos e o mapa antes dos detalhes e listas. Ajuda cartográfica e explicações secundárias ficam em controles de expansão rotulados. Fontes, falta de dados e cobertura parcial continuam identificadas. O zoom dispõe de espaço próprio para preservar os marcadores.

No computador, as superfícies laterais ficaram mais discretas; tablets preservam resultados e mapa lado a lado onde essa disposição cabe. Colunas estreitas recebem ajustes para manter nomes, totais e controles legíveis.

## Referências e decisões

A [divulgação progressiva do NN/g](https://www.nngroup.com/articles/progressive-disclosure/) orienta a mostrar primeiro o essencial e oferecer opções secundárias com rótulos claros. O agrupamento de ações e a ajuda expansível aplicam esse princípio.

As [orientações do NN/g para bottom sheets](https://www.nngroup.com/articles/bottom-sheet/) alertam para painéis que cobrem o conteúdo relevante e para interações longas dentro de sobreposições. Os resultados completos permanecem no fluxo da página, sem uma sobreposição fixa sobre o mapa.

Os critérios do W3C de [reflow](https://www.w3.org/WAI/WCAG22/Understanding/reflow.html) e [tamanho dos alvos](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html) orientam leitura e acesso aos controles. A revisão preserva alvos de 44px nos controles móveis ajustados e verifica larguras a partir de 320px.

Nenhum código, fonte ou asset dessas referências foi incorporado.

## Revisão e validação

Os revisores independentes verificaram geometria, cliques reais, teclado/foco, toque, zoom, pan, rolagem, dados disponíveis/ausentes, seleção municipal/estadual/país/cidade, replay, fontes e cobertura. Entre os problemas identificados e corrigidos durante a revisão estão um resumo que interpretava votos válidos ausentes como ausência de resultados e uma ajuda cartográfica que não recebia clique devido a `pointer-events` herdado.

Os novos testes são `clean-cabecalho.spec.ts`, `clean-presidente-mapa.spec.ts`, `clean-governadores.spec.ts`, `clean-exterior.spec.ts` e `clean-desktop.spec.ts`. Os testes existentes passam a abrir as ações e os filtros compactos para exercitar a navegação real, sem contornar esses controles.

Capturas e logs permanecem em `.artifacts/clean-*` e `.artifacts/review-clean-*`, fora do Git. Dados de teste interceptados no navegador não alimentam produção. A verificação usa Chrome e emulação mobile; não substitui testes em aparelhos físicos, Safari ou uma auditoria completa de acessibilidade. Esta revisão não inclui commit, push ou deploy.

## Resultado final dos testes

A validação local aprovou os gates de dependências, licenças, inventários, geografia, limites, tipos e formato, além de 97 testes dos gates, 238 testes JavaScript/TypeScript e 363 testes Python. Build aprovado. A rodada final `APURAR_TEST_PORT=4356 npm run test:browser` terminou com **513 testes aprovados e 63 pulados pelas condições de perfil da suíte**, sem falhas. O CI remoto não foi usado como evidência.

As regressões encontradas durante a integração foram corrigidas e revalidadas: filtros e zoom no modo alternativo com abas, gestos em TV/tablet, acesso às ações após a hidratação do primeiro turno e seletor de cargos sob a faixa da fonte. Os testes de geometria aguardam o resize inicial e o fim da animação de zoom para comparar elementos no mesmo quadro, preservando as verificações de área útil e não sobreposição.
