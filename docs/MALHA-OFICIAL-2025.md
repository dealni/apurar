# Malha municipal oficial do Apurar

Atualização local de 24/10/2026, sem publicação implícita. A rota `/apurar/` usa a Malha Municipal Digital 2025 do IBGE, disponível em 2026, mantendo os componentes e estilos do acervo público de terceiros.

## Cobertura e fonte

A malha de apresentação contém exatamente **5.571 localidades**: os 5.569 municípios, Brasília/DF e Fernando de Noronha/PE. Cada código IBGE possui correspondência no cadastro TSE da eleição 6258. Inclui Boa Esperança do Norte/MT (`5101837`, TSE `MT:73709`), que faltava na captura original.

Fonte: [IBGE — Malha Municipal](https://www.ibge.gov.br/geociencias/organizacao-do-territorio/malhas-territoriais/15774-malhas.html), [ZIP oficial BR_Municipios_2025](https://geoftp.ibge.gov.br/organizacao_do_territorio/malhas_territoriais/malhas_municipais/municipio_2025/Brasil/BR_Municipios_2025.zip).

O arquivo oficial contém 5.573 entidades. As áreas operacionais Lagoa Mirim (`4300001`) e Lagoa dos Patos (`4300002`) são excluídas por não serem localidades eleitorais municipais. Exterior continua sendo uma camada e unidade separada.

O ZIP foi capturado com SHA-256 `840bbe6f73726ef9d1460ce49fdfe01a278935c41180d3c893e25ca21db083bd`. O hash identifica os bytes revisados; não constitui uma assinatura do IBGE.

## Processamento e preservação

`scripts/geography/regenerate.py` confere o hash do ZIP e usa `mapshaper@0.6.113`, com projeção Policônica SIRGAS2000 compatível com o mapa existente, simplificação topológica de 600 m, conservação das formas, limpeza e quantização de um milhão de níveis. A saída mantém o contrato TopoJSON, 33 lotes de arcos e 27 lotes municipais. É uma malha simplificada para visualização, não para medições cadastrais.

A árvore `apps/web/src/data/official-geography-2025/` registra URL, parâmetros, exclusões, contagens e hashes de cada arquivo em `provenance.json`. O gate de integridade registra esse derivado separadamente da captura original. A versão histórica em `src/data/generated/` permanece intacta; `/1turno/` continua usando seus próprios índices, geometria e dados arquivados.

A população dos municípios existentes conserva os valores da referência; não foi atualizada integralmente para 2025 e não representa eleitorado. Boa Esperança do Norte recebe 5.877 habitantes da [estimativa oficial IBGE/SIDRA 2025](https://servicodados.ibge.gov.br/api/v3/agregados/6579/periodos/2025/variaveis/9324?localidades=N6%5B5101837%5D). O eleitorado exibido continua vindo dos totais oficiais do TSE.

Regeneração explícita, a partir de um ZIP oficial obtido separadamente:

```sh
python3 -B scripts/geography/regenerate.py /caminho/BR_Municipios_2025.zip
npm run check:geography
```

A regeneração requer acesso ao pacote de processamento fixado. O ZIP de aproximadamente 226 MB permanece fora do Git. Após regenerar, diferenças de fonte, parâmetros ou bytes exigem revisar a proveniência e o inventário antes de aceitar os novos hashes.

## Clique em Fernando de Noronha

O enquadramento continental de Pernambuco é preservado. O teste de seleção usa limites próprios que incluem todos os polígonos da UF, inclusive ilhas. Um filtro pelos limites de cada município evita testar polígonos distantes.

A câmera usa `focusBox`: o maior componente municipal ancora o enquadramento e componentes separados por mais de 150 km não ampliam essa caixa. Isso evita que as ilhas oceânicas de Vitória/ES afastem a câmera nacional ou estadual. Os limites completos, caminhos e componentes permanecem disponíveis para desenho e seleção. A seleção precisa continua sendo feita no polígono desenhado.

## Verificação

`check:geography`, incluído no gate principal, verifica correspondência exata das 5.571 identidades, UF, duplicatas, geometria e anéis presentes, referências de arcos, coordenadas e transformação. O gate de integridade confere hashes da nova árvore e conserva os hashes da captura histórica.

Os testes cobrem a inclusão de Boa Esperança do Norte na malha, busca e seleção, o clique em Fernando de Noronha, rejeição de pontos fora do polígono e a preservação da caixa continental. Os testes de navegador usam dados eleitorais sintéticos identificados nas fixtures; não publicam nem alteram resultados reais.

A revisão independente também decodificou os arcos de todas as geometrias, verificando continuidade, fechamento dos anéis e áreas externas positivas. A validação adicional Shapely/GEOS da saída quantizada confirmou 5.571 geometrias válidas; `scripts/geography/validate.py` permite repetir essa auditoria com dependência de desenvolvimento opcional. Cobertura cartográfica não equivale a disponibilidade de resultados: município sem feed oficial continua identificado como indisponível.
