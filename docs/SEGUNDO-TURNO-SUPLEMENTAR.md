# Dados oficiais adicionais do segundo turno

A revisão local remove a coleta de zonas. Mantém governadores e seus municípios, cidades do exterior e países agregados, sem alterar o resultado presidencial principal. As mudanças dependem de nova publicação autorizada.

## Fonte e cobertura

O [EA11 oficial](https://resultados.tse.jus.br/oficial/comum/config/ele-c.json) identifica a eleição estadual 6260, turno 2, cargo 3, nas UFs AC, AM, DF, ES, RN e TO. O [catálogo estadual EA12](https://resultados.tse.jus.br/oficial/ele2026/6260/config/mun-e006260-cm.json) contém essas seis abrangências e 469 municípios. Estados ausentes não são apresentados como zero nem consultados por adivinhação de URLs.

O [catálogo federal EA12](https://resultados.tse.jus.br/oficial/ele2026/6258/config/mun-e006258-cm.json) fornece 186 cidades exteriores. Campos de zonas presentes no catálogo são ignorados. Não são construídos alvos nem consultados arquivos EA20 zonais.

Países são somas explícitas das cidades oficiais disponíveis, ligadas à geografia pelo código TSE. Cada país informa sua cobertura parcial e não tem arquivo TSE próprio. Não usa votos históricos, não calcula projeção e não fabrica zero para locais ausentes.

## Integração e limites

`SupplementalCollector(client, state_dir).step(budget=128, stop_event=None, max_seconds=15)` utiliza o mesmo cliente do núcleo presidencial, com limite compartilhado de 70 consultas/s, oito em voo, sem rajadas. Respostas 403/429 suspendem tudo por pelo menos 600s, respeitando Retry-After maior; a pausa é restaurada após reinício.

Os seis totais estaduais vêm primeiro. Depois, um cursor percorre municípios estaduais e cidades exteriores, com até 128 detalhes por ciclo. O orçamento de 15s controla admissão: uma requisição já iniciada pode terminar depois, dentro do timeout. Falha preserva último resultado válido com indicador de atraso. Catálogo, cursor e vencimentos são persistidos; cada detalhe entra no máximo uma vez por ciclo.

O suplemento tem **661 alvos**: 6 totais + 469 municípios + 186 cidades. Países são agregados sem consultas adicionais. Catálogo é revalidado periodicamente. Não existe parâmetro `--zone-budget` nem agendamento de zonas após mudanças municipais.

## Migração e compatibilidade

A restauração de `supplemental-state.json` filtra zonas dos alvos, resultados e retries e descarta a fila antiga. Resultados e carimbos dos alvos restantes são preservados. Uma regressão restaura 6.805 zonas legadas e comprova que nenhuma URL zonal é consultada.

O envelope continua na versão 1: `zones: []`, `capabilities.zones: false` e `coverage.zones` com zero. Esses campos existem somente para leitura compatível durante a atualização do Worker e navegador. A saúde mantém contagem zonal zerada; filas antigas não aceleram ou degradam o diagnóstico atual.

Objetos imutáveis arquivados não são apagados nem reescritos. O leitor valida observações antigas, mas a interface e exportações excluem seus registros zonais. Não há aba, busca, seletor ou atalho zonal em `/apurar/`, inclusive demonstração. Links antigos apontam para o município correspondente. A página arquivada de primeiro turno permanece independente.

## Proveniência e validação

`as_of` e `generated_at` são da fonte, sem substituição pela hora de consulta. Ausência de votação mantém null; correções oficiais podem reduzir votos. Governadores e exterior não entram na projeção presidencial.

Os testes offline verificam migração, ausência de URLs zonais, orçamento, concorrência, backoff e preservação dos municípios/totais/exterior. O contrato compartilhado cobre o envelope sem zonas e a leitura histórica. Testes de navegador cobrem a retirada dos acessos, links antigos e arquivo/exportação sem zonas.
