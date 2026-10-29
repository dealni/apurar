# Malha oficial de apresentação — IBGE 2025

A nova rota `/apurar/` usa a Malha Municipal Digital 2025 do IBGE, publicada em 2026. O diretório histórico `apps/web/src/data/generated/geography` permanece intacto para as páginas preservadas do acervo público de terceiros.

Fontes:

- [Produto, composição e limitações da malha municipal IBGE](https://www.ibge.gov.br/geociencias/todos-os-produtos-geociencias/15774-malhas.html).
- [Arquivo nacional original `BR_Municipios_2025.zip`](https://geoftp.ibge.gov.br/organizacao_do_territorio/malhas_territoriais/malhas_municipais/municipio_2025/Brasil/BR_Municipios_2025.zip).
- [Nota metodológica oficial 2025, publicada em 2026](https://biblioteca.ibge.gov.br/index.php/biblioteca-catalogo?view=detalhes&id=2102268).
- [População estimada de Boa Esperança do Norte, SIDRA 6579/9324, ano 2025](https://servicodados.ibge.gov.br/api/v3/agregados/6579/periodos/2025/variaveis/9324?localidades=N6%5B5101837%5D).

O arquivo nacional contém 5.573 unidades: 5.569 municípios, Brasília/DF, Fernando de Noronha/PE e duas áreas estaduais operacionais (Lagoa Mirim e Lagoa dos Patos). Excluímos somente as áreas operacionais `4300001` e `4300002`, sem município nem cadastro eleitoral próprio. As 5.571 identidades restantes coincidem integralmente com o mapeamento IBGE/TSE do aplicativo, incluindo `5101837`, Boa Esperança do Norte.

A origem usa coordenadas geográficas SIRGAS 2000. A conversão para Policônica SIRGAS 2000 preserva a projeção esperada pelo renderizador da referência. A simplificação topológica ponderada (`interval=600`, `keep-shapes`) e a limpeza mantêm todos os polígonos municipais principais, com fronteiras compartilhadas. O resultado é quantizado em 1.000.000 posições e dividido nos mesmos 33 grupos de arcos. A quantização de um milhão evita duas autointerseções que surgiam ao arredondar a saída para cem mil posições; a validação GEOS da saída final cobre as 5.571 geometrias. As pequenas ilhas secundárias podem perder detalhe; esta derivação serve à apresentação, não a medições cadastrais ou definição jurídica de limites. A limpeza desta geração removeu três resíduos topológicos e preservou todas as 5.571 unidades.

Os atributos populacionais existentes são preservados da captura para manter os recursos da referência; eles não são eleitorado nem dados municipais de apuração. Boa Esperança do Norte recebe a estimativa oficial 2025 de 5.877 habitantes. Os demais valores `p` não foram atualizados para 2025. Votos e eleitorado continuam sendo recebidos separadamente pelo feed do coletor TSE.

## Reprodução

Baixe o ZIP oficial separadamente. O gerador exige o SHA-256 registrado antes de extrair ou executar a conversão. Ele usa `mapshaper@0.6.113` apenas como ferramenta de desenvolvimento via `npm exec`, sem acrescentar dependências ao aplicativo.

```sh
python3 scripts/geography/regenerate.py /caminho/BR_Municipios_2025.zip
```

A geração usa temporários isolados, exige exatamente o conjunto de identidades do cadastro TSE e grava somente `apps/web/src/data/official-geography-2025/`. `provenance.json` contém URL, hash do arquivo original, parâmetros, contagens e SHA-256/bytes de cada arquivo gerado. A população original é lida da captura histórica preservada. O ZIP bruto de aproximadamente 226 MB fica fora do Git e do bundle.

A validação geométrica independente pode ser repetida com Python 3.12 e `shapely==2.1.2` em um ambiente temporário, sem adicionar dependências ao runtime do aplicativo:

```sh
python3.12 -m venv /tmp/apurar-geo-validity
/tmp/apurar-geo-validity/bin/pip install shapely==2.1.2
/tmp/apurar-geo-validity/bin/python scripts/geography/validate.py
```

Esse verificador decodifica os arquivos finais quantizados, preserva buracos e multipolígonos e exige todas as identidades, áreas positivas e geometrias válidas pelo GEOS. O aviso de dez interseções emitido durante a simplificação ocorre antes de `-clean`; a validação verifica a saída efetivamente consumida pelo aplicativo.
