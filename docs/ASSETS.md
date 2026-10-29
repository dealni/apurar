# Assets eleitorais incorporados

Origem da importação inicial: `acervo público de terceiros/public`. Destino: `apps/web/public/`. A importação integral ocorreu em 24/10/2026, sem modificar a origem. A limpeza local de 25/10/2026 retirou o material comercial e os inventários de captura sem consumidor; o estado atual é derivado dessa importação, com arquivos próprios do Apurar.

O inventário atual cobre **6.903 arquivos**, totalizando **84.247.794 bytes**, excluindo somente `public/_headers`, configuração de segurança própria do Apurar. Inclui `robots.txt` adaptado e `sitemap.xml` próprio, fontes, retratos, mapas, locais de votação e feeds arquivados. Nenhum arquivo individual chega a 100 MiB; o maior tem 1.159.561 bytes.

Foram removidos `public/anunciar/`, `ads.txt`, `captura-index.json`, `captura-resources.json` e a imagem de compartilhamento `og-2t.jpg`, que trazia marca comercial da referência. Também foram retiradas apenas duas imagens comerciais sem referências ativas em `public/1turno/assets/`: `anuncio.0c5c22b7d8.webp` (G4) e `og.933bb11ba1.jpg` (Pandora). Essa remoção não alcança dados eleitorais, mapas, retratos ou as duas fontes compartilhadas.

## Dados preservados

Os feeds em `public/1turno/feed/` pertencem à captura original: são arquivo histórico de referência e não uma fonte oficial ao vivo para o segundo turno. Permanecem preservados, junto dos locais de votação, retratos, mapas, fontes e dados de comparação com 2022 e com o primeiro turno. Sua disponibilização mantém as consultas históricas de `/1turno/` por decisão explícita do proprietário.

A projeção do segundo turno consome exclusivamente o backend do Apurar em namespace separado. Os arquivos históricos não substituem a origem da apuração ao vivo nem fazem o horário da captura parecer uma atualização atual. Cadastros e fotos preservados não confirmam por si os finalistas de 2026.

## Integridade

O manifesto [ASSETS.sha256](ASSETS.sha256) identifica os bytes atuais mantidos em `public/`, com uma linha por arquivo e caminho relativo à raiz do repositório. Arquivos adaptados são identificados por sua versão local; o manifesto não afirma que a árvore atual seja cópia integral ou idêntica à origem. Verificação local:

```sh
shasum -a 256 -c docs/ASSETS.sha256
```

O gate `scripts/quality/imported-assets.json` mantém hash, quantidade e bytes de cada grupo incorporado, além de arquivos individuais e da malha oficial própria. O digest agrega, em ordem por componente do caminho, o prefixo `source` documentado, caminho relativo, byte NUL, SHA-256 do conteúdo e LF. Por incluir o prefixo de procedência, uma mudança nessa descrição também muda o digest agregado.

| Grupo atual                  | Arquivos |      Bytes | SHA-256 agregado                                                   |
| ---------------------------- | -------: | ---------: | ------------------------------------------------------------------ |
| `public/`, exceto `_headers` |    6.903 | 84.247.794 | `7a1332aa666120a428e7ef774ee9af4fd67b41950fb1dfc13e1100f8cee550f3` |
| `src/data/generated/`        |      128 |  2.144.795 | `6e7e5cb9685574b788b1a824b2b02f17df78a777e3045a60b61770338cf922a0` |

## Dados gerados e segurança

`src/data/generated/` conserva mapas, cadastros e comparações eleitorais da referência. A limpeza comercial não altera esses dados. A geografia oficial municipal usada no segundo turno tem procedência própria em [MALHA-OFICIAL-2025.md](MALHA-OFICIAL-2025.md).

`public/_headers` mantém as regras de segurança do Apurar, fontes locais e estilos inline exigidos pela interface. Scripts e conexões permanecem restritos à própria origem. Não há ativação de serviços comerciais da referência.

Licenças e limites de redistribuição seguem [PROVENIENCIA.md](PROVENIENCIA.md). A disponibilização do repositório não declara licença permissiva ou autoria do Apurar sobre material de terceiros. Os documentos anteriores de entrega e revisão registram o estado existente em suas respectivas datas.

## Tipografia do tema escuro

Em 25/10/2026 foram acrescentados `public/fonts/InterVariable.woff2`, copiado de um acervo tipográfico de referência, e `public/fonts/Inter-LICENSE.txt`, obtido do projeto oficial Inter. A fonte mantém seus bytes e licença SIL OFL 1.1. Essa etapa não incorporou captura de página, marca, imagem ou runtime de outro serviço. Os estilos adaptam tokens de apresentação. As fontes anteriores continuam no acervo histórico, mas a interface usa Inter local, registrada como Apurar Sans.

## Marca e retratos do segundo turno

A integração de 25/10/2026 acrescentou 36 arquivos em `public/brand/` (604.065 bytes), `favicon.svg` e 14 fotografias WebP em `public/candidates/` (76.424 bytes), além de substituir `favicon.ico` e `apple-touch-icon.png`. São 51 arquivos novos e dois ícones substituídos, sem alteração do acervo eleitoral histórico. A marca deriva do trabalho local ArpoFlow autorizado pelo proprietário; o símbolo e o sistema de lettering têm procedência em [MARCA-APURAR.md](MARCA-APURAR.md). Os retratos vieram do TSE e possuem identidades, fontes e hashes em `src/data/candidate-portraits.json`, conforme [RETRATOS-CANDIDATOS.md](RETRATOS-CANDIDATOS.md).

O grupo `src/features/apuracao/` contém 297 arquivos, soma 1.227.707 bytes e digest `0b82e92c99a700c92dad1b8f562394529a55366969613c3aed841ca94f65cb34`. Além da marca local, recebeu correções de exportação por cargo, liberação da tela cheia, navegação, layout responsivo e composição com prioridade no mapa. O singleton `1turno/index.html` soma 2.547 bytes e SHA-256 `9a4e6025a161a7398b3c1c2f4086189a5eb4810001c5c2501a144a5dbd713d18`, com favicon, cartão social e conteúdo inicial de recuperação local. A [padronização da interface](PADRONIZACAO-INTERFACE.md) e a [revisão de layout](REVISAO-LAYOUT-2026-10-25.md) registram o escopo. Os dados eleitorais, as geometrias e os demais singletons mantêm seus bytes anteriores. A revisão de 29/10/2026 renomeou tokens/arquivos de tema e generalizou metadados opcionais da referência; o manifesto registra os novos nomes, bytes e hashes. O grupo de geografia oficial mudou somente pela descrição em `provenance.json`, sem alteração dos polígonos.

A auditoria de recursos estáticos e dependências necessárias está em [RECURSOS-LOCAIS.md](RECURSOS-LOCAIS.md). Fontes, scripts, estilos, mapas, bandeiras, ícones e retratos ativos não dependem de CDN de terceiros. A consulta à API e a coleta de resultados oficiais permanecem necessárias.

A remoção da página intermediária mantém a apuração diretamente na raiz. O sitemap passa a listar somente a raiz canônica e o primeiro turno; a marca histórica aponta para a apuração. Nenhum dado eleitoral foi alterado.
