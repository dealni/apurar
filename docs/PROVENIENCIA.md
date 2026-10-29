# Procedência e reaproveitamento

## Preparação do encerramento em 29/10/2026

A entrada do chat público foi retirada dos três HTMLs da interface. O singleton
de `1turno/index.html` no inventário de integridade registra os novos bytes e o
SHA-256 dessa retirada; dados eleitorais e assets históricos permanecem intactos.
O procedimento e os limites para publicação do repositório estão em
[encerramento](ENCERRAMENTO-2026-10-29.md). Esta adaptação local não comprova a
interrupção dos serviços em produção nem altera as licenças dos terceiros.

A limpeza textual posterior retirou dois blocos sem consumidores de promoção de
perfis pessoais da captura, sem alterar componentes renderizados ou arquivos
visuais. O inventário de `features/apuracao` registra os bytes dessa adaptação.
As referências à origem e as licenças permanecem; caminhos locais passaram a
usar referências relativas sem identificar a conta do sistema operacional.

O Apurar integra trabalho local do proprietário. As pastas de origem foram lidas e não devem ser movidas, apagadas ou modificadas para viabilizar o novo produto.

Na revisão de padronização de 25/10/2026, a interface histórica recebeu uma barra superior que identifica o arquivo do primeiro turno e a data da captura, substituindo o aviso que cobria controles inferiores. O conteúdo inicial sem JavaScript identifica o arquivo, e o atalho de busca compartilha a proteção de foco dos painéis atuais. Essas são adaptações de apresentação e navegação: os dados, as comparações e os arquivos das pastas de origem permanecem preservados. O inventário derivado de `features/apuracao` e da entrada HTML foi recalculado após as alterações; nenhum hash de dados eleitorais ou de assets externos foi substituído.

## Núcleo eleitoral

Origem: `Developer/Aplicativos/apuracao`. Coleta, cálculo, armazenamento e testes são a referência de comportamento. A migração vive em `services/collector`; seu README registra comandos e limites. Bases operacionais entram por bootstrap verificado, sem acervos ou caches versionados. A evidência original de 114 testes Python aprovados em 24/10/2026 é uma regressão do núcleo existente, não uma certificação da versão integrada ou da acurácia futura.

## Referência visual

Origem: acervo de páginas públicas de terceiros capturado em 24/10/2026 e adaptado localmente. O proprietário autorizou o trabalho local de integração e os ajustes dos arquivos; essa autorização não transfere direitos de terceiros.

Usar a hierarquia editorial, painéis, organização das informações e arquivos que contribuam para o produto. Preservar identificação e licenças dos arquivos efetivamente incorporados. A captura original contém conteúdo de terceiros e runtime recuperado com versão/licença não verificadas; a autorização para trabalhar localmente não comprova licença geral de redistribuição desses terceiros. Esta distribuição não declara uma licença permissiva abrangendo a captura.

A importação inicial preservou início, primeiro turno e anúncios. Na limpeza local de 25/10/2026, a home capturada e a página comercial `/anunciar/` foram retiradas, junto de seus formulários, métricas, anúncios e catálogos de repercussão. A raiz passou a usar uma página própria de acesso, sem cadastro. Na integração seguinte de 25/10/2026, o acesso ficou restrito a Apuração e Primeiro turno: governadores e exterior foram incorporados ao mapa principal; demonstração, versão simples e acesso ao arquivo oficial foram removidos. Isso não altera a procedência dos componentes ainda incorporados.

A página histórica `/1turno/`, seus dados eleitorais e as comparações com 2022 e com o primeiro turno permanecem preservados por decisão explícita do proprietário. A rota `/apurar/` reaproveita componentes, layouts, estilos, mapas e arquivos visuais adaptados ao nosso contrato. O runtime recuperado é substituído por dependências oficiais Preact/htm, preservando a API visual. O motor de simulação/previsão da referência não pertence ao fluxo novo `/apurar/`; seus recursos históricos originais permanecem em `/1turno/`. O painel React anterior em `/simples/` e o acesso à demonstração foram removidos na integração de 25/10/2026. Dados arquivados nunca são fallback da nova projeção ao vivo. O inventário atual de assets está em `ASSETS.md`, e o escopo da limpeza em [LIMPEZA-LEGADO-2026-10-25.md](LIMPEZA-LEGADO-2026-10-25.md).

## Dados oficiais e autenticidade

Documentação de eleição e URLs oficiais vêm do TSE. Hash SHA-256 dos objetos comprova igualdade de bytes entre publicação e leitura, não assinatura do TSE. A aplicação não deve alegar verificação JWS ou status de entidade homologada sem a respectiva implementação/verificação.

Dependências mantêm suas licenças originais, verificadas pelo gate do lockfile. Não existe licença global de código aberto declarada para esta distribuição.

## Runtime da interface recuperada

A captura trazia `src/vendor/htm-preact.js` sem versão identificável, SHA-256 `6d5b4d33bb99e6e6f47b70f7a9e09d58b924e715a476939df110eab7cda7688c` (990 linhas e oito funções acima do limite de complexidade). Esse runtime foi substituído por uma ponte de 26 linhas para `preact@11.0.2` e `htm@3.1.1`, pacotes oficiais com licença MIT e versões fixadas no lock. A ponte preserva `window.htmPreact` com `h`, `render` e os seis hooks usados na aplicação, além de `window.htm.bind(h)` e export default. Nenhuma exceção de tamanho ou complexidade fica ativa para vendor, feed, config, integração ou UI. Os pacotes são verificados junto das demais dependências no gate de licenças.

## Malha municipal oficial do segundo turno

A rota `/apurar/` usa a malha municipal IBGE 2025 derivada em `apps/web/src/data/official-geography-2025/`. Fonte, processamento, hashes, exclusões e limites estão em [MALHA-OFICIAL-2025.md](MALHA-OFICIAL-2025.md) e no manifesto `provenance.json` dessa árvore. A captura geográfica original permanece intacta para as páginas históricas.

## Tema escuro de 25/10/2026

Por solicitação do proprietário, a identidade visual foi adaptada a partir de uma referência pública de paleta, superfícies, tipografia, bordas, controles e espaçamento. A interface mantém a marca Apurar e seus fluxos eleitorais; nenhuma marca ou código de serviço autenticado foi incorporado nessa etapa. A incorporação binária foi Inter Variable, com licença SIL OFL 1.1 preservada em `apps/web/public/fonts/Inter-LICENSE.txt`; fonte oficial da licença: <https://github.com/rsms/inter/blob/master/LICENSE.txt>. Os arquivos externos de consulta permanecem fora deste repositório.

## Revisão de interface com Apple HIG em 25/10/2026

A pedido do proprietário, a base visual e as interações foram refinadas usando as diretrizes públicas de [acessibilidade](https://developer.apple.com/design/human-interface-guidelines/accessibility), [layout](https://developer.apple.com/design/human-interface-guidelines/layout) e [tipografia](https://developer.apple.com/design/human-interface-guidelines/typography) da Apple. A referência orienta hierarquia, contraste, espaços, foco e controles confortáveis; nenhum asset, fonte ou código proprietário da Apple foi incorporado. Inter Variable e sua licença permanecem.

As adaptações abrangem início, painéis atual e histórico, consultas oficiais e diagnóstico. O histórico recebeu estilos de acessibilidade, isolamento do fundo da busca e navegação por teclado nos seletores do mapa; seus dados e comparações foram preservados. O inventário derivado de `features/apuracao` registra os novos bytes e hashes dessa versão local. Na revisão de 29/10/2026, os tokens foram padronizados como `--apurar-theme-*`, com todos os consumidores atualizados e os valores visuais preservados.

## Segunda revisão por elemento em 25/10/2026

A segunda rodada dividiu o frontend em dez elementos, cada um com um agente de ajustes e um revisor independente: início/tokens; navegação/cabeçalho; busca/modais; resultados/candidaturas; mapas/legendas; timeline/gráficos; consultas oficiais; arquivo; exportação; diagnóstico. As adaptações locais incluem suporte sem JavaScript no início, texto ampliado, foco e composição de texto, controles e legendas mobile, leitura do arquivo e exportação com contexto. As árvores históricas continuam derivadas da mesma origem; não houve incorporação de assets de terceiros. Os dados eleitorais, mapas oficiais e motor Python permanecem com a procedência descrita acima. O inventário histórico registra os bytes da revisão integrada.

## Marca derivada ArpoFlow e retratos locais em 25/10/2026

Por pedido explícito do proprietário, a marca Apurar passou a usar o símbolo e o sistema geométrico de lettering do ArpoFlow. As origens locais `Sites/arpoflow/apps/dashboard/public/brand/arpoflow-mark.svg` e `Sites/arpoflow/scripts/brand/lettering.mjs` foram somente lidas. O símbolo foi preservado; o nome Apurar usa os glifos existentes e a extensão geométrica do `a` minúsculo. SVGs, PNGs, ícones e cartão social foram gerados para o Apurar, sem incorporar contas, configurações ou serviços do ArpoFlow. Detalhes e dimensões: [MARCA-APURAR.md](MARCA-APURAR.md).

As 14 fotografias dos finalistas acompanhados no segundo turno foram obtidas diretamente dos caminhos oficiais do TSE, conferidas com SQ, número, nome de urna e partido, e convertidas para WebP sem gerar conteúdo artificial. O manifesto `apps/web/src/data/candidate-portraits.json` registra URLs e SHA-256 da fonte JPEG, do arquivo WebP e dos resultados usados na conferência de identidade. A aplicação carrega as cópias locais. O download público e a integridade por hash não conferem uma licença permissiva geral sobre fotografias de terceiros nem significam assinatura TSE verificada. O acervo histórico não foi substituído; documentação: [RETRATOS-CANDIDATOS.md](RETRATOS-CANDIDATOS.md).

O inventário consolidado em [ASSETS.md](ASSETS.md) inclui as novas artes e fotos. A auditoria de [recursos locais](RECURSOS-LOCAIS.md) não encontrou outro asset externo ativo que exigisse download. APIs de resultados atualizados não foram substituídas por snapshots estáticos, e lacunas da captura histórica continuam explicitamente indisponíveis.

## Padronização pelo primeiro turno

A rodada de padronização de 25/10/2026 reutiliza o mapa, cabeçalho, controles, cartões e abas do primeiro turno como referência local para Presidente, governadores e exterior. Não incorpora novos dados ou assets externos. O código histórico recebeu correções na exportação por cargo, liberação da tela cheia e conteúdo inicial de recuperação; seus dados eleitorais permanecem intactos. Os hashes derivados estão atualizados em `scripts/quality/imported-assets.json`. Consulte [padronização da interface](PADRONIZACAO-INTERFACE.md).

## Revisão responsiva de 25/10/2026

A revisão mobile e desktop adaptou a apresentação histórica e atual sem incorporar assets externos: tablets usam resultados e mapa lado a lado, janelas estreitas usam fluxo vertical, e controles de retorno e candidaturas secundárias receberam alvos maiores. O código histórico recebeu o novo módulo `40-tablet.css` e os limites responsivos correspondentes. O inventário derivado foi recalculado para esses arquivos; os grupos de dados eleitorais e geografia, fotos e demais assets mantêm seus hashes. As referências públicas e a validação estão em [revisão do layout](REVISAO-LAYOUT-2026-10-25.md).

## Layout com prioridade no mapa em 25/10/2026

A nova rodada clean reorganiza a interface atual e histórica, preservando os dados e as comparações. Os módulos locais `41-cabecalho-clean.css`, `42-mobile-mapa-presidente.css` e `45-desktop-clean.css` complementam os estilos existentes; a árvore histórica também recebe os ajustes equivalentes de composição e navegação. Referências de divulgação progressiva, mapas e acessibilidade orientaram as decisões sem incorporar assets externos. O inventário derivado foi recalculado para a apresentação revisada. Consulte [layout com prioridade no mapa](LAYOUT-MAPA-PRIMEIRO-2026-10-25.md).

## Chat público — 25/10/2026

O chat foi escrito para o Apurar em arquivos isolados de interface, contratos e Worker. As três entradas HTML recebem somente a importação do novo módulo; o inventário da entrada histórica foi atualizado para essa adaptação. Nenhum chat de terceiro, credencial ou serviço dos projetos de referência foi incorporado. Referências técnicas e limites estão em [CHAT-AO-VIVO.md](CHAT-AO-VIVO.md).

## Remoção da exibição de pessoas online em 25/10/2026

Por pedido do proprietário, foram removidos os contadores de audiência da
interface histórica, do painel atual e do chat. O inventário derivado de
`features/apuracao` foi recalculado para registrar apenas essa mudança de
apresentação. Dados eleitorais e arquivos da origem permanecem preservados.

## Menu de compartilhamento em 25/10/2026

O cabeçalho histórico e o painel atual passam a usar o mesmo diálogo de
compartilhamento, com atalhos de composição para redes sociais, cópia do link e
acesso à imagem/PNG existente. Os links preservam a vista selecionada e não
publicam conteúdo automaticamente. Ícones simples em SVG são locais, sem SDKs,
fontes ou scripts de redes sociais. O inventário derivado do histórico foi
recalculado; seus dados eleitorais e as pastas de origem não foram alterados.

Referências: [WhatsApp](https://faq.whatsapp.com/5913398998672934),
[Telegram](https://core.telegram.org/widgets/share) e
[X](https://publish.x.com/).

## Logos oficiais de compartilhamento — 25/10/2026

Os arquivos locais em `apps/web/src/runtime/assets/social/` foram extraídos sem
alterações dos pacotes oficiais: [WhatsApp](https://www.meta.com/brand/resources/whatsapp/whatsapp-brand/)
(glyph verde RGB 2026), [Facebook](https://www.meta.com/en-gb/brand/resources/facebook/logo/)
(logo primário PNG), [Telegram](https://telegram.org/tour/screenshots) (Logo.svg)
e [X](https://about.x.com/en/who-we-are/brand-toolkit) (logo.svg branco).
As cores e proporções dos arquivos originais foram mantidas. São marcas de seus
respectivos proprietários, usadas para identificar os destinos de compartilhamento.
Nenhum SDK ou script remoto foi incorporado.

A projeção deixou de ser apresentada na interface atual e no PNG; o motor Python,
os contratos e os arquivos eleitorais históricos permanecem preservados.

## Memes do chat — 25/10/2026

Por solicitação do proprietário, 20 PNGs foram baixados da
[biblioteca pública FrankerFaceZ](https://www.frankerfacez.com/emoticons/),
com metadados da API oficial. Os bytes originais estão em
`apps/web/src/features/chat/assets/`, sem alterações. Cada imagem tem página de
origem, URL de download, uploader, tamanho e SHA-256 no manifesto
`apps/web/src/features/chat/emotes-manifest.json`. Uploader identifica a conta
que publicou o emote, não comprova autoria ou licença sobre o meme original.
Não foi atribuída licença de software aos assets de terceiros.

A integração é local, com códigos textuais reconhecidos por lista fechada; não
interpreta HTML nem permite imagens ou URLs arbitrárias enviadas pelo visitante.

## Remoção do replay — 25/10/2026

Os painéis atual e histórico deixam de apresentar linha do tempo, reprodução,
pausa e seleção de horários, inclusive pelo teclado. A consulta automática da
última publicação e a comparação com o primeiro turno continuam disponíveis.
O acervo de publicações e os contratos do backend não foram alterados.
O inventário do código histórico foi recalculado para esta adaptação local.

## Imagens 4× e bandeiras vetoriais — 25/10/2026

Os 20 emotes foram obtidos novamente na opção 4× da API FrankerFaceZ e
convertidos com `cwebp -lossless -exact -m 6`. O manifesto registra hashes e bytes
da fonte PNG e do WebP. A decodificação dos 20 arquivos confirmou igualdade
pixel a pixel. São 412.688 bytes de origem e 288.722 bytes otimizados.
O Facebook oficial foi reduzido proporcionalmente de 2084 × 2084 para 112 × 112
pixels (4× sua exibição de 28 px) e convertido em WebP: 54.771 → 2.216 bytes.

As 27 bandeiras SVG vêm de [br-state-flags](https://github.com/arthurreira/br-state-flags),
revisão `dee38e893ef00037dc5e1a1bbd886b0ab80a3dab`, com licença MIT preservada.
Os arquivos otimizados do fornecedor permanecem intactos. Origens e hashes estão
em `src/runtime/state-flags-manifest.json`. Imagens são carregadas da própria
origem, e os nomes dos estados continuam disponíveis nos controles e tooltips.
O inventário da interface histórica foi atualizado; seu acervo eleitoral permanece intacto.

Foram consultados os sete arquivos de fotos BR, AC, AM, DF, ES, RN e TO do
[acervo oficial TSE de candidaturas de 2026](https://dadosabertos.tse.jus.br/dataset/candidatos-2026).
As 14 fotografias correspondentes aos SQ cadastrados também têm 161 × 225 pixels.
Não foi encontrada resolução maior nessa fonte. As fotos atuais foram mantidas,
sem ampliação artificial, alteração de rosto ou substituição por fotografia sem
vínculo verificado. O DivulgaCandContas recusou o acesso automatizado consultado.

## Preparação pública em 29/10/2026

Nomes, domínios e caminhos dos sites usados como inspiração foram retirados dos textos, metadados e identificadores internos opcionais. O tema foi renomeado para `theme.css` e os estilos de painéis, para `32-paineis-tema.css`; os valores e a aparência permanecem. As descrições continuam identificando honestamente componentes adaptados de terceiros, sem declarar autoria exclusiva ou licença de redistribuição não demonstrada. Licenças, fontes oficiais e créditos obrigatórios foram preservados. Os inventários registram os novos nomes e bytes; dados eleitorais e imagens não foram alterados. Esta limpeza não alcança os commits antigos do Git.
