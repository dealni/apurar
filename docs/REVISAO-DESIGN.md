# Revisão de design e reaproveitamento visual

## Identidade vigente local em 25/10/2026

O redesign solicitado usa uma referência visual pública. A paleta local passa a fundo `#08090a`, painéis `#0f1011`, bordas `#23252a`, texto `#f7f8f8` e acento `#5e6ad2`. A fonte Inter Variable é servida localmente com licença OFL preservada; os tokens comuns estão em `apps/web/src/design/theme.css`.

O escopo inclui entrada, menu global, apuração atual, arquivo histórico, diagnóstico, mapas, busca, filtros, consultas de governadores/exterior/arquivo e exportação PNG. Cores eleitorais e de cobertura preservam seu significado. Horários, avisos, dados, projeções e rotas mantêm seus contratos. A adaptação não acrescenta conteúdo, marca, runtime ou chamadas externas de outro serviço.

A implementação e revisão foram distribuídas por área entre agentes, com revisores independentes de funcionalidade e layout. A inspeção visual verifica desktop e celular, estados indisponíveis, demonstração e histórico, junto dos testes existentes. Esta mudança é local; produção exige autorização própria de deploy.

### Validação da implementação local

Em 25/10/2026, `APURAR_TEST_PORT=4395 npm run check:ci-local` concluiu com sucesso: gates de dependências, licenças, integridade, geografia, limites, tipos, formato e qualidade; 183 testes Vitest, 275 testes do coletor e 164 testes de navegador desktop/celular, além do build. Revisões independentes de funcionalidade e visual não deixaram achados pendentes. As capturas da revisão permanecem em artefatos externos ao repositório; a validação usa dados locais/fixtures e não comprova coleta ao vivo em produção. O build conserva o aviso de chunks acima de 500 kB.

## Registro anterior de 24/10/2026

Revisão realizada em 24/10/2026 sobre o acervo público de terceiros, com consulta às convenções de `Sites/portfolio` e `Sites/citrya`. A inspeção das origens foi somente leitura. Este documento registra recomendações; não comprova a implementação nem a validação do Apurar.

## Origem e alcance

O material de referência é uma reconstrução local de páginas públicas de terceiros, usando Vite, módulos ES, Preact/htm recuperado e TypeScript na infraestrutura. O diretório inspecionado não é um repositório Git e não contém `AGENTS.md` próprio.

A página inicial anuncia o segundo turno. O painel completo recuperado está em `/1turno/`. Portanto, a referência não fornece um produto de segundo turno pronto para publicação. Seu README também informa que o conteúdo capturado e possíveis simulações não foram certificados como resultados eleitorais oficiais.

## Linguagem visual

| Elemento   | Referência observada                           | Aplicação recomendada                                    |
| ---------- | ---------------------------------------------- | -------------------------------------------------------- |
| Fundo      | Escuro quente `#0f0e0d`                        | Ambiente de acompanhamento prolongado                    |
| Painéis    | `#151412`, superfícies secundárias discretas   | Separação de resultados, histórico e projeções           |
| Texto      | `#fafaf9`, níveis progressivos de cinza        | Hierarquia editorial e leitura de números                |
| Progresso  | Verde `#3dd68c`                                | Atualização e apuração, sem confundir com cor partidária |
| Tipografia | Faustina nos títulos e Geist nos controles     | Instalar fontes de origem oficial com suas licenças      |
| Resultados | Duelo, percentuais grandes e números tabulares | Comparação imediata dos dois candidatos                  |
| Navegação  | Mapa, filtros e painéis compactos              | Seleção por cargo e território                           |
| Celular    | Abas e painéis roláveis                        | Priorizar duelo, progresso e atualização                 |
| TV         | Tipografia ampliada e redução de controles     | Leitura à distância e tela cheia                         |

Os arquivos mais úteis para consultar a referência são:

- `src/features/apuracao/styles/01-fundamentos.css`;
- `src/features/apuracao/styles/24-modo-tv.css`;
- `src/features/apuracao/styles/25-layout-celular.css`;
- `src/features/apuracao/styles/26-shell-e-manchete.css`;
- `src/features/apuracao/styles/27-shell-paineis.css`;
- `src/features/apuracao/styles/28-projecoes.css`;
- `src/features/inicio/estilo.css`;
- `docs/ESTILOS.md` e `docs/CONTRATOS-APURACAO.md`.

Os tokens e a hierarquia servem como referência de estudo para uma implementação original. Não se recomenda copiar os módulos CSS recuperados nem sua estrutura de seletores.

## Procedência e assets

`config/third-party.json` da referência declara `contentLicense: "not-declared"`, `redistributionAuthorized: false` e runtime htm/Preact com versão desconhecida e licença não verificada. O gate `scripts/quality/check-licenses.mjs` preserva explicitamente essas limitações.

O Apurar deve ter componentes próprios, dependências oficiais, fontes com licença preservada e assets obtidos de fontes com procedência registrada. Não transportar o pacote recuperado, fotografias, mapas, marcas e arquivo da captura para o novo repositório. Não atribuir licença própria ao conteúdo de terceiros.

As fotografias de deputados e feeds municipais ausentes na origem não podem virar conteúdo fabricado. Ausência de dado deve ser representada como indisponibilidade, sem substituir por zero.

## Composição recomendada

1. Cabeçalho editorial com identidade Apurar, eleição, cargo e território.
2. Status com horário da última atualização, origem e condição do feed.
3. Duelo com dois candidatos, percentuais e votos, acompanhado do progresso de apuração.
4. Resumo de eleitorado, seções e totais pertinentes ao contrato disponível.
5. Mapa com alternativa acessível em tabela ou lista.
6. Histórico temporal e painel de projeção com identificação e metodologia próprias.
7. Modo TV, navegação mobile e acesso permanente à metodologia.

Componentes sugeridos: `AppShell`, `Header`, `ConnectionStatus`, `RaceSelector`, `CandidateDuel`, `CountingProgress`, `ElectionTotals`, `ResultsMap`, `ResultsTable`, `Timeline`, `ProjectionPanel`, `MethodologyDrawer` e `TvView`.

## Separação dos estados de informação

A interface precisa diferenciar aguardando início, demonstração, dado oficial, projeção, feed atrasado e erro. Um relógio chegando ao horário previsto não comprova que a coleta iniciou. Resultados demonstrativos não devem receber indicação de transmissão ao vivo.

Projeção e totalização oficial devem ocupar áreas distintas, com rótulos, horário e explicação de metodologia. Cores e textos precisam manter esse significado em celular, TV e imagens de compartilhamento. A classificação de eleito deve seguir um contrato explícito, com origem identificada.

## Estratégia de implementação

O painel recuperado possui inicializadores ordenados, dependências circulares e 24 células de estado compartilhado. Esses contratos estão documentados em `docs/CONTRATOS-APURACAO.md`. Transplantar esse conjunto manteria acoplamento e lógica de simulação difíceis de sustentar.

Recomenda-se implementar a interface original em TypeScript, consumindo um contrato de dados único. Coleta, normalização, projeção, armazenamento e transporte devem permanecer separados dos componentes. Os componentes recebem o estado validado e não inferem votos ou vencedores a partir da aparência do feed.

Adotar as convenções úteis da família Sites: `src/`, `public/`, `scripts/quality/`, `scripts/operacao/`, `e2e/`, versões fixadas, Lefthook, commitlint e portões locais. A estrutura estática de `Sites/portfolio`, servida por Cloudflare Workers Static Assets, é referência adequada para o frontend. O processo Next/backend de Citrya não precisa ser reproduzido para manter a organização familiar.

## Ordem de entrega e revisão

1. Painel original com contrato tipado, demonstração explícita e layout responsivo.
2. Adapter de dados reais e histórico, com projeção separada dos totais oficiais.
3. Mapa, tabela acessível, modo TV, busca e estados de erro/desatualização.
4. Verificação em navegador desktop/celular, teclado e movimento reduzido.
5. Ensaio de atualização, snapshots repetidos, cache e indisponibilidade da coleta.

A revisão visual deve conferir leitura dos nomes longos, percentuais, contraste, foco visível, áreas de toque, ausência de cortes em telas baixas e estabilidade do layout durante atualizações. Um feed indisponível deve preservar o último dado válido com aviso e horário, sem aparentar uma atualização bem-sucedida.

## Limites desta revisão

Não foram executados testes ou build da referência, nem verificadas licenças externas na internet nesta revisão. As conclusões de procedência vêm das declarações locais examinadas. A criação do documento não implica aprovação de publicação, deploy, dados eleitorais, modelo estatístico ou funcionamento ponta a ponta.
