# Totais municipais oficiais

Revisão local de 24/10/2026. Esta alteração exige publicação posterior do coletor e do Worker/frontend; não modifica a implantação existente.

## Origem e significado

O coletor usa o resultado unificado EA20 do TSE, para Presidente, eleição 6258. O município conserva seu próprio horário de geração, seus totais e a destinação de cada candidato. A consulta não atualiza artificialmente o horário da fonte.

| Campo EA20      | Contrato               | Significado                       |
| --------------- | ---------------------- | --------------------------------- |
| `e.te`          | `electorate`           | Eleitorado total do município     |
| `e.est`         | `electorate_totalized` | Eleitorado das seções totalizadas |
| `e.esi`         | `electorate_installed` | Eleitorado das seções instaladas  |
| `e.c`           | `turnout`              | Comparecimento                    |
| `e.a`           | `abstention`           | Abstenção                         |
| `v.vv`          | `valid`                | Votos válidos                     |
| `v.vvc`         | `computed`             | Votos computados                  |
| `v.vb`          | `blank`                | Votos brancos                     |
| `v.tvn`         | `null`                 | Votos nulos                       |
| `v.van`         | `annulled`             | Votos anulados                    |
| `v.vansj`       | `sub_judice`           | Votos anulados sub judice         |
| `v.tv`          | `total`                | Total de votos                    |
| candidato `vap` | candidato `votes`      | Votos computados do candidato     |
| candidato `dvt` | candidato `validity`   | Destinação dos votos do candidato |

Referência: [TSE — EA20, arquivo de resultado unificado](https://www.tse.jus.br/eleicoes/eleicoes-2026-content/arquivos/divulgacao-de-resultados/tse-ea20-arquivo-de-resultado-unificado).

O denominador de comparecimento/abstenção é o eleitorado das seções instaladas (`e.esi`). Na sua ausência, usa-se a soma de comparecimento e abstenção somente se os dois forem conhecidos. O eleitorado total municipal não substitui esse denominador durante uma apuração parcial. Sem denominador positivo, a taxa fica indisponível.

A soma de `vap` serve à participação entre candidatos computados, com identificação explícita na interface. Ela não preenche `vv` nem `vvc`. Campos ausentes permanecem `null`; zero informado pelo TSE permanece zero. Uma destinação especial municipal não é substituída pela destinação nacional.

## Caminho dos dados e compatibilidade

Python publica os 12 totais municipais e a destinação dos candidatos. Worker e frontend usam a mesma validação de inteiros seguros, não negativos ou `null`. Envelopes antigos sem `totals` continuam legíveis, com totais desconhecidos; um objeto `totals` presente exige as 12 chaves. Municípios indisponíveis não podem trazer totais conhecidos.

O cache aceita preencher metadados opcionais antes ausentes em uma geração já persistida, inclusive após reinício. Votos, candidatos, identidade, horário e valores já conhecidos não podem ser substituídos por esse caminho. Assim, a atualização não depende de uma nova geração do TSE para enriquecer o cache antigo.

Busca, cartões municipais, agregação estadual, diagnóstico e CSV usam os novos campos. A agregação estadual exige cobertura completa para cada total. O CSV mantém as 20 colunas anteriores na mesma ordem e acrescenta os totais, a destinação e os votos computados por candidato. Ausências são células vazias; zero é `0`.

O histórico não herda totais nem destinações da observação atual. Usa a destinação registrada no próprio ponto quando disponível. A alteração não modifica o motor de projeção nem cria projeção municipal no diagnóstico.

## Design e verificação

As páginas preservadas, CSS, assets e motor matemático permanecem sem alterações. Os novos totais usam os componentes e a organização visual existentes do acervo público de terceiros.

A suíte inclui casos de ausência/zero, destinação especial, computados diferentes de válidos, participação parcial, rejeição de números inválidos, cache persistente, histórico e exportação. Os testes de navegador cobrem desktop e celular.

A fixture congelada `services/collector/tests/fixtures/tse-6258-precount.json` contém respostas públicas do Brasil e de Acrelândia, com URLs e hashes dos bytes capturados. O teste integrado passa essas respostas pelo parser e produtor Python, validador do Worker, busca, cartão e diagnóstico. Acrelândia apresenta 10.208 eleitores e 45 seções, com zero votos nesta observação anterior à apuração. Esse teste verifica o tratamento do retorno oficial; não equivale a validação de toda a eleição ao vivo nem a calibração estatística do modelo. Cenários de destinação divergente são sintéticos e ficam restritos aos testes.
