# Bairros: fontes oficiais e limite de operação

Pesquisa em 24/10/2026, exclusivamente leitura pública. Não se habilitou bairro no painel ao vivo.

## O que as fontes realmente permitem

- [EA16 — seções eleitorais](https://www.tse.jus.br/eleicoes/eleicoes-2026-content/arquivos/divulgacao-de-resultados/tse-ea16-arquivo-de-configuracao-de-secoes-eleitorais): UF, município, zona, seção, agregações e horário de chegada do auxiliar. Não contém bairro, endereço nem votação. Um GET pequeno do catálogo AC do pleito 3221 confirmou a estrutura, ainda sem chegada de boletins.
- [Instruções de download 2026, versão 19/10](https://www.tse.jus.br/eleicoes/eleicoes-2026-content/arquivos/divulgacao-de-resultados/tse-instrucoes-para-download-dos-arquivos-da-divulgacao-2026): o EA18 informa situação e hashes dos arquivos da urna. O BU está em uma pasta identificada por hash e é outro arquivo, em ASN.1. Não é um resultado agregado por bairro. O PDF específico EA18 respondeu sem extração textual pela ferramenta web; o download direto retornou 403, sem contornar a restrição. A caracterização acima é da descrição explícita nas instruções atuais.
- [Eleitorado 2026](https://dadosabertos.tse.jus.br/dataset/eleitorado-2026), recurso “Eleitorado por local de votação”: existe cadastro oficial de seção → local → bairro, inclusive segundo turno. Foram lidos somente os primeiros 65.536 bytes do ZIP com HTTP Range 206; o arquivo completo tem 167.636.252 bytes. O primeiro CSV contém `CD_MUNICIPIO`, `NR_ZONA`, `NR_SECAO`, `NR_SECAO_PRINCIPAL`, `NR_LOCAL_VOTACAO`, `NM_BAIRRO`, `AA_ELEICAO`, `NR_TURNO` e `DT_ELEICAO`. A amostra estava gerada em 24/10/2026 e continha registros de 25/10/2026/turno 2.
- [Resultados 2026](https://dadosabertos.tse.jus.br/dataset/resultados-2026), recurso “Votação por seção eleitoral”: o próprio portal declara atualização **ao final de cada turno**. Uma leitura Range 206 de 65.536 bytes do ZIP AC conferiu o cabeçalho com `ANO_ELEICAO`, `NR_TURNO`, `CD_ELEICAO`, `CD_CARGO`, `NR_VOTAVEL`, `QT_VOTOS` e identidade da seção. Esse CSV não é um feed ao vivo.

Portanto, é possível agregar votos oficiais por **bairro do local de votação** com esses CSVs após a publicação do turno. Não é possível apresentar essa soma como bairro de residência do eleitor, nem dividir votos de uma urna agregada entre bairros distintos sem informação adicional.

## Implementação disponibilizada

`apurar_collector.neighborhoods.aggregate_neighborhoods(catalog_rows, vote_rows, office=..., catalog_source=..., votes_source=...)` aceita iteradores de linhas CSV já obtidos de fontes oficiais. Não faz rede nem lê arquivos automaticamente. Valida eleição, turno, cargo, data, códigos e duplicidades; mantém zero realmente observado, sinaliza ausência/cobertura parcial, recusa atribuições ambíguas e votos atribuídos a seções agregadas sem validação própria. O resultado tem `mode:"archive"` e `live_supported:false` e não pode ser misturado com o envelope ao vivo.

A funcionalidade de bairro ao vivo exigiria implementar e validar o parser BU ASN.1, escolher corretamente a versão da urna efetivamente totalizada e suas correções, baixar o cadastro de locais completo, reconciliar seções agregadas e consumir centenas de milhares de auxiliares/boletins incrementalmente. Com aproximadamente 499 mil seções e pelo menos um auxiliar e um BU por seção, uma passagem ingênua se aproxima de um milhão de requisições: no teto local de 20/s, pelo menos cerca de 14 horas, antes de latência, novos boletins, erros e concorrência com a coleta principal. É uma estimativa de ordem de grandeza, pois seções agregadas reduzem urnas principais; não é medição de carga.

Não foram feitos esses downloads em massa nem habilitadas novas fontes no cliente ao vivo. A capability de bairro ao vivo deve continuar `false`; o módulo offline não altera esse estado.
