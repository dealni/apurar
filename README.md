# Apurar

**Produção encerrada em 29/10/2026.** Serviços e timers foram interrompidos e
bloqueados na VPS; domínios personalizados do Worker foram removidos e os acessos
`workers.dev` e previews, desativados. Dados e snapshots foram preservados.
O código permanece disponível para estudo e execução local; as referências de
publicação abaixo descrevem a operação anterior. Consulte o
[encerramento e revisão](docs/ENCERRAMENTO-2026-10-29.md).

A versão preparada para disponibilização pública inicia um histórico Git
independente, com um único commit raiz. O histórico anterior e o checkout
anterior à preparação foram preservados em backups privados fora do repositório.
A publicação do código não reativa a produção nem altera as licenças dos
materiais incorporados.

Painel para acompanhar o segundo turno de 2026: Presidente, governadores nas UFs com disputa e exterior com resultados oficiais. A interface apresenta resultados oficiais e o gráfico de projeção experimental separado da apuração. Integra o motor Python local, componentes eleitorais adaptados de um acervo público de terceiros, Vite, API eleitoral somente leitura e módulo de chat WebSocket em Cloudflare Workers, com snapshots no R2. Coleta e cálculo ficam em um processo isolado na VPS apps. A origem externa dos componentes e os limites de redistribuição estão documentados em [procedência](docs/PROVENIENCIA.md).

**Publicado em 24/10/2026 na Cloudflare, com coletor na VPS Apps. Atualizações do código exigem publicação autorizada e verificação da release efetiva. Nenhum deploy está implícito no push.** As páginas preservadas identificam seus dados arquivados. O motor experimental permanece no coletor e nos contratos; sua projeção é exibida no painel para desktop e celular e fica fora do PNG e do texto compartilhados.

Domínio principal anterior: **https://apurar.app**, cuja raiz `/` abria o painel ao vivo (o endereço `/apurar/` permanecia compatível). O domínio e o endereço `workers.dev` foram desativados no encerramento. DNS e HTTPS são gerenciados na Cloudflare; o registro permanece na Hostinger. Consulte [domínio e validação](docs/DOMINIO.md).

## Executar

Requisitos: Node 24.22.1, npm 12.2.1 e Python 3.11+. Para desenvolvimento web:

```sh
npm ci
npm run dev
```

Abra `http://127.0.0.1:4325`. A raiz abre diretamente o painel de apuração, sem página intermediária. O primeiro turno permanece acessível pelo menu. A rota `/1turno/` mantém a página histórica, seus dados eleitorais e os recursos de comparação com 2022 e com o primeiro turno. O painel atual está em `/apurar/`, com resultados oficiais. A página comercial `/anunciar/` e a home capturada foram removidas. O mapa principal reúne Presidente, governadores e exterior. Demonstração, versão simples e acesso ao arquivo oficial foram removidos. Parâmetros antigos são limpos; links de governadores e exterior abrem a seleção correspondente no mapa principal. O painel aguarda a API e nunca usa dados sintéticos como fallback. Vite sozinho não executa o Worker; para exercitar a API, compile e execute Wrangler local:

```sh
npm run build
npm exec --offline -- wrangler dev --local --port 4327
```

Sem objetos no R2 local, a API responde indisponível. O pacote de coleta e seus comandos de bootstrap, execução offline, coleta explícita e publicação estão em [services/collector/README.md](services/collector/README.md).

## Funcionalidades

- Compartilhamento com WhatsApp, Telegram, X, Facebook, cópia do link da vista selecionada e opção separada de imagem/PNG. No celular, “Mais opções” usa o compartilhamento do sistema quando disponível.

- Chat público ao vivo com apelido, reconexão, histórico limitado e proteção básica contra excesso de mensagens. Consulte [uso e operação do chat](docs/CHAT-AO-VIVO.md). Ativação e operação seguem o procedimento de publicação autorizada.

- Página histórica `/1turno/` preservada, incluindo dados e comparações eleitorais com 2022 e com o primeiro turno.
- Apuração diretamente na raiz e menu global com Apuração e Primeiro turno; página intermediária de acesso removida.
- Rota `/apurar/`: resultado presidencial, votos por candidato e seções totalizadas, sem faixa fixa superior de status.
- Resultados oficiais na tela e no PNG; projeção experimental e curva no painel para desktop e celular, fora do compartilhamento. Antes da contagem, o painel aguarda o início da apuração sem mostrar percentuais projetados.
- Busca municipal e filtro por UF, com estados explícitos para locais sem dados.
- Tooltip municipal de Presidente mostra também votos e percentuais de Lula e Flávio no primeiro turno de 2026, a partir do arquivo histórico local. Os percentuais consideram todos os votos válidos daquele turno; dados ausentes recebem aviso próprio.
- Painel sempre na última publicação, sem replay ou seleção de horário; tela cheia/TV e exportação PNG preservadas. O primeiro turno mostra o resultado arquivado mais recente.
- Governadores, mapa municipal próprio, países/cidades do exterior com busca e fonte própria.
- API de publicações confirmadas preservada no backend para rastreabilidade. O acervo começa na ativação; não reconstrói observações passadas ausentes.
- Diagnóstico e alertas Telegram deduplicados, ensaio de restauração isolado, ferramenta temporal e carga exclusivamente local.
- Cache com leituras isoladas por requisição no Worker e monitor opcional de tráfego/consumo pelo DealniBot, com configuração externa e ativação explícita.
- Polling resiliente, saúde do coletor separada da idade do resultado e reutilização de lotes inalterados; snapshots e detalhes identificados por versão.
- API eleitoral GET/HEAD, ETag, cache real, objetos SHA-256 e recusa de conteúdo incompatível.

O núcleo presidencial usa a eleição **6258**. O suplemento oficial usa **6260/cargo 3** nas seis UFs com segundo turno (AC, AM, DF, ES, RN e TO), 469 municípios dessas disputas e 186 cidades do exterior. O mapa de governadores tem modelo próprio para não misturar seções ou horários presidenciais. A coleta atual usa municípios e totais, sem resultados zonais; cada resultado mostra o próprio horário e cobertura. Países somam apenas cidades oficiais conhecidas e informam quando a cobertura é parcial. Não existe projeção para governadores. Não há detalhamento por zona ou bairro na apuração ao vivo.

A versão efetiva de produção deve ser conferida pelo marcador `/_release.json`.

**Implementação ampliada do segundo turno.** A confirmação da versão em produção deve ser feita pelo marcador `/_release.json` e pelo recibo externo da publicação.

## Estrutura

| Caminho               | Responsabilidade                                            |
| --------------------- | ----------------------------------------------------------- |
| `apps/web/`           | interface, estados, filtros, histórico e apresentação       |
| `apps/edge/`          | Worker leitor R2, cache, integridade, rotas públicas e chat |
| `services/collector/` | coleta TSE, projeção Python, snapshots e publicação         |
| `packages/contracts/` | contrato e validação de snapshots                           |
| `e2e/`                | navegador desktop e celular                                 |
| `scripts/quality/`    | dependências, licenças, limites e hooks                     |
| `infra/`              | preparação operacional, sem provisionamento automático      |
| `docs/`               | plano, revisões, procedência e evidências                   |

## Validação

Prepare o linter Python no ambiente virtual local (uma vez por clone ou após
atualizar `requirements-dev.txt`):

```sh
npm run setup:python-quality
```

```sh
npm run lint            # ESLint JS/TS e Ruff Python
npm run check           # deps, licenças, limites, lint, tipos, formato e testes
npm run check:all       # check e build
npm run check:ci-local  # inclui navegador real
```

Os testes de navegador usam Google Chrome instalado e portas exclusivas. `APURAR_TEST_PORT` permite outra porta quando necessário. O hook pre-push exige checkout limpo e HEAD validado; executa gates locais. Nunca use `--no-verify`. Conventional Commits em pt-BR são obrigatórios. O GitHub Actions não é usado como evidência de aprovação; a conta foi informada como bloqueada por cobrança.

O typecheck usa a linha TypeScript compatível com as integrações, com versões exatas e lock. O override `undici:7.30.1` corrige a dependência transitiva do Wrangler/Miniflare indicada pelo audit nesta implantação inicial; revisar ao atualizar Wrangler. `allowScripts` explicita os lifecycle permitidos. O Lefthook instala hooks pelo `prepare` do projeto.

O ESLint cobre fontes JS/TS e scripts; Ruff cobre o coletor, seus testes e os
scripts Python. Ferramentas são fixadas e o gate não instala pacotes. Escopo,
exceções do legado, limites e pesquisa oficial estão em
[ferramentas de qualidade](docs/FERRAMENTAS-QUALIDADE.md).

## Dados e modelo

O segundo turno usa a base municipal do primeiro turno de 2026 renormalizada entre os finalistas. O modelo atualiza perfis nacional, estadual e local e preserva votos já contados. A conciliação deve suspender a projeção quando os insumos divergem. A tolerância operacional não é margem estatística.

Dados grandes, caches SQLite/WAL/SHM e segredos ficam fora do Git. O bootstrap verifica os hashes dos insumos. A base pública mínima está incluída em ZIP verificado de 311 KB; um clone limpo pode inicializar o modelo sem a pasta do projeto anterior. O frontend e os arquivos eleitorais da referência foram incorporados para preservar os recursos históricos e a interface adaptada. A limpeza do legado comercial está registrada em [LIMPEZA-LEGADO-2026-10-25.md](docs/LIMPEZA-LEGADO-2026-10-25.md). Estudos e bancos operacionais continuam fora do bundle.

Integridade SHA-256 entre publicador e Worker não equivale a assinatura TSE verificada. A procedência e o limite da verificação estão em [PROVENIENCIA.md](docs/PROVENIENCIA.md).

## Infraestrutura e documentação

`wrangler.jsonc` define o Worker `apurar`, o binding `SNAPSHOTS` e domínios `apurar.app`/`www.apurar.app`, mantendo `workers.dev`, com previews e observabilidade desativados. A conta é selecionada por credencial externa. A configuração não cria bucket, registro de domínio ou serviço VPS; os vínculos personalizados pressupõem a zona DNS já configurada. Não há script de deploy automático em hooks, GitHub Actions ou push. Credenciais do publicador são externas ao Git. Um único escritor publica objetos imutáveis antes de mover o ponteiro público.

- [Malha municipal oficial e seleção no mapa](docs/MALHA-OFICIAL-2025.md).
- [Totais municipais oficiais e separação de votos](docs/TOTAIS-MUNICIPAIS.md).
- [Correções da revisão geral](docs/CORRECOES-REVISAO.md).
- [Segunda revisão geral — 25/10/2026](docs/REVISAO-CLEAN-SEGUNDA-RODADA-2026-10-25.md).
- [Revisão clean do sistema — 25/10/2026](docs/REVISAO-CLEAN-SISTEMA-2026-10-25.md).
- [Revisão de qualidade de código e configuração — 25/10/2026](docs/REVISAO-QUALIDADE-2026-10-25.md).
- [Entrega, revisão e limites da validação](docs/ENTREGA.md).
- [Plano completo e critérios de aceite](docs/PLANO-INTEGRACAO.md).
- [Operação, publicação e recuperação](docs/OPERACAO.md).
- [Revisão do modelo](docs/REVISAO-MODELO.md).
- [Revisão visual](docs/REVISAO-DESIGN.md).
- [Assets e procedência dos mapas/fontes](docs/ASSETS.md).
- [Fonte TSE conferida em 2026](docs/FONTE-TSE-2026.md).
- [Revisão de arquitetura](docs/REVISAO-ARQUITETURA.md).

Fontes: [TSE 2026](https://www.tse.jus.br/eleicoes/informacoes-tecnicas-sobre-a-divulgacao-de-resultados), [Workers Static Assets](https://developers.cloudflare.com/workers/static-assets/), [R2](https://developers.cloudflare.com/r2/reference/consistency/).

## Cadência e saúde da coleta

Política única em `services/collector/resources/timing.json`: coleta normal 15s, filas 2s, varredura completa de UFs com pausa de 45s, navegador visível 15s/oculto 60s, cache 10s e encerramento 300s. O bloqueio padrão 403/429 é de 600s, respeitando `Retry-After` maior; 404 permanece em 600s. A quota compartilhada é de até 70 consultas/s, sem rajadas, com oito consultas em voo.

Os intervalos do coletor começam após o trabalho; a interface não promete atualização municipal a cada 15s. Consulte o README do coletor para o contrato de saúde e a distinção entre espera da fonte, falha de coleta e encerramento. A ativação em produção exige deploy do coletor e do Worker/frontend da mesma release.

## Operação ampliada

O nacional confirmado continua sendo publicado durante falhas municipais, com dados anteriores e cobertura explícita; somente a projeção é suspensa. Falhas de acompanhamento de UF tornam a saúde parcial, mantendo a fila rápida. `--disable-projection` ou `APURAR_PROJECTION_ENABLED=false` suspende apenas a estimativa; `APURAR_PROJECTION_REASON` fornece o motivo.

O suplemento tem geração própria em `/api/supplemental`, com objetos SHA-256 independentes do lote presidencial. A coleta compartilha o cliente e a quota TSE, preserva estado e usa até oito consultas em voo para municípios e totais. Registros zonais de estados antigos são removidos do estado ativo sem apagar publicações imutáveis. Uma falha adicional não interrompe o placar presidencial. O arquivo em `/api/archive` conserva referências integrais SQLite e oferece amostra pública de até 500 observações, preservando início/fim.

Alertas pelo DealniBot são executados por `infra/systemd/apurar-alerts.{service,timer}` e `infra/alerts.env.example`. Credenciais e destinatário ficam externos ao Git; instalar/ativar exige deploy autorizado. Testes não enviam mensagens. Consulte [ensaios operacionais](docs/ENSAIOS-OPERACIONAIS.md), [suplemento oficial](docs/SEGUNDO-TURNO-SUPLEMENTAR.md) e [arquivo de publicações](docs/ARQUIVO-OFICIAL.md).

Ferramentas e testes não demonstram precisão eleitoral do segundo turno sem trajetória real; o modelo não fornece probabilidade de vitória, margem de erro calibrada ou transferência individual.

As leituras concorrentes e o novo monitor estão documentados em [tráfego e consumo](docs/ALERTAS-CONSUMO.md). O monitor estima consumo bruto a partir do Analytics; não representa a fatura nem impõe limite de gasto. A coleta e a cadência do navegador permanecem iguais.

A navegação e os cuidados para publicar a nova entrada estão documentados em [Navegação](docs/NAVEGACAO-2026-10-25.md).

## Design local

A entrada, navegação global, painéis atual e histórico, consultas e exportação PNG compartilham a paleta escura, Inter local e superfícies consistentes. Os tokens comuns ficam em `apps/web/src/design/theme.css`; cores de candidatos, mapas e avisos mantêm seu significado. Consulte [procedência](docs/PROVENIENCIA.md) e [assets](docs/ASSETS.md). A revisão local de 25/10/2026 também aplica as Apple Human Interface Guidelines à hierarquia, legibilidade, foco, contraste e alvos de toque. A alteração visual local exige publicação autorizada para chegar à produção.

A revisão clean de 25/10/2026 dá prioridade ao mapa no celular, com cabeçalho compacto, ações agrupadas e resultados completos abaixo do mapa. Presidente e primeiro turno oferecem “Ver resultados”; governadores e exterior mantêm filtros e fontes próprias. O desktop usa painéis de apoio mais discretos. Decisões, referências, revisão independente e limites estão em [layout com prioridade no mapa](docs/LAYOUT-MAPA-PRIMEIRO-2026-10-25.md).
