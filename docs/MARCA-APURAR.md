# Marca Apurar

A marca usa o símbolo e o desenho geométrico do ArpoFlow, conforme solicitação do proprietário em 25/10/2026. O nome foi adaptado para **Apurar**, com contornos vetoriais próprios, sem dependência de fonte instalada. Os arquivos do ArpoFlow foram apenas lidos e permanecem intactos.

## Procedência

Origem local: `Sites/arpoflow/apps/dashboard/public/brand/arpoflow-mark.svg` e `Sites/arpoflow/scripts/brand/lettering.mjs`, em `Developer/`.

O símbolo original foi preservado integralmente. O lettering reutiliza os glifos `A`, `p`, `u` e `r` do sistema do ArpoFlow; o `a` minúsculo é uma extensão geométrica com a mesma altura, peso e desenho arredondado. O espaçamento foi ajustado para o nome Apurar. Nenhuma configuração, conta, serviço ou credencial foi incorporada. O reaproveitamento é de trabalho local do proprietário e não altera as licenças gerais dos projetos.

## Cores e aplicação

| Cor     | Valor     | Uso                                            |
| ------- | --------- | ---------------------------------------------- |
| Grafite | `#23272A` | Marca em superfícies claras e fundo dos ícones |
| Verde   | `#80E629` | Segmento de destaque do símbolo                |
| Branco  | `#FFFFFF` | Símbolo e nome nas versões `-inverse`          |

Use a versão normal em superfícies claras e `-inverse` em superfícies escuras. As assinaturas SVG e PNG têm fundo transparente. O ícone e o cartão social têm fundo grafite. A versão monocromática destina-se a aplicações com uma única tinta.

Preserve a proporção e uma margem externa mínima equivalente a 20% da altura do símbolo. Não aplique filtros CSS para trocar a cor, sombras, distorção ou cores eleitorais à marca. No cabeçalho, o SVG horizontal pode ser exibido em 150 × 37 px ou 126 × 31 px; em espaços menores, prefira o símbolo isolado. O verde identifica a marca e não um partido, candidato ou resultado.

## Arquivos

Os arquivos estão em `apps/web/public/brand/`.

| Nome-base                | Composição                           | Exportação                                        |
| ------------------------ | ------------------------------------ | ------------------------------------------------- |
| `apurar-logo-horizontal` | Símbolo e nome lado a lado           | SVG 1000 × 244; PNG 1000 × 244 e `@2x` 2000 × 488 |
| `apurar-logo-stacked`    | Símbolo acima do nome                | SVG 800 × 720; PNG 800 × 720 e `@2x` 1600 × 1440  |
| `apurar-mark`            | Símbolo transparente                 | SVG; PNG 534 × 491 e `@2x` 1068 × 982             |
| `apurar-wordmark`        | Nome em contornos                    | SVG; PNG 693 × 194 e `@2x` 1386 × 388             |
| `apurar-icon`            | Símbolo branco e verde sobre grafite | SVG; PNG 16, 32, 48, 180, 192 e 512 px            |
| `apurar-mark-monochrome` | Símbolo em grafite                   | SVG; PNG 1x e 2x                                  |
| `apurar-social`          | Cartão para compartilhamento         | PNG 1200 × 630                                    |

Os quatro primeiros nomes também têm versões `-inverse`. Os PNGs em dobro usam o sufixo `@2x` após o nome completo, por exemplo `apurar-logo-horizontal-inverse@2x.png`.

Na raiz pública, `favicon.svg` usa o mesmo ícone, `favicon.ico` contém imagens PNG de 16, 32 e 48 px e `apple-touch-icon.png` tem 180 × 180 px. Há também uma cópia do touch icon em `brand/apple-touch-icon.png` para integração de metadados.

## Acessibilidade e exportação

Uma imagem que identifica o site deve ter `alt="Apurar"`. Se o link já tiver nome acessível ou texto visível equivalente, a imagem deve usar `alt=""` para evitar duplicação. O SVG não contém scripts, recursos externos nem texto dependente de fontes. O nome Apurar é formado por paths; o nome acessível pertence ao componente que exibe a imagem.

Os PNGs foram rasterizados a partir dos SVGs com Sharp; não foram redesenhados em bitmap. Para regenerar uma exportação, rasterize o SVG correspondente na largura da tabela. O ICO usa as três exportações do ícone e um diretório ICO com as dimensões e offsets de cada PNG. Preserve as variantes vetoriais como origem da arte.
