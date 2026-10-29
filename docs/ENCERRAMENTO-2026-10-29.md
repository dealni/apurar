# Encerramento de produção e revisão para publicação

Em 29/10/2026, o proprietário solicitou a interrupção completa da produção do
Apurar e a publicação do repositório no GitHub. As etapas abaixo preservam os
dados existentes e exigem verificação dos recursos efetivamente configurados.

## Resultado da interrupção

O responsável pela operação confirmou nove unidades de serviço/timer mascaradas
na VPS, incluindo coleta, alertas, consumo, backup e TURN exclusivos dos sistemas
encerrados. No Apurar, os domínios personalizados foram removidos e os acessos
`workers.dev` e previews foram desativados. Bucket, snapshots e dados foram
preservados. A configuração local também mantém `workers_dev: false` e
`routes: []`, sem destinos públicos configurados. Uma reativação futura exige
uma decisão explícita e revisão dos recursos. O recibo externo da operação é a fonte da conferência remota;
os testes locais abaixo não representam essa conferência.

## Interromper a operação

- Confirmar `srv924325` pelo alias SSH `vps-apps` antes de alterar a VPS.
- Parar e desabilitar o coletor e os serviços/timers exclusivos do Apurar,
  incluindo alertas e consumo. Conferir unidades carregadas, timers, processos e
  tarefas agendadas para impedir retomada automática.
- Retirar a aplicação pública da Cloudflare, incluindo domínios personalizados,
  rotas, endereço `workers.dev`, previews, agendamentos e integrações de execução
  que estiverem efetivamente presentes. Conferir também conexões de chat abertas.
- Verificar HTTP nos endereços publicados e confirmar que não servem a aplicação
  nem sua API. Parar apenas o coletor não interrompe o Worker ou os assets.
- Manter bancos, snapshots, releases e backups existentes. Remoção de dados não
  é requisito para interromper a execução.

Credenciais, conteúdo de ambientes e dados de usuários não entram nos recibos.
O registro da operação deve identificar recursos e resultado sem seus segredos.
Alterações nos arquivos locais não constituem prova de execução remota.

## Revisar a publicação do GitHub

`package.json` usa `private: true` para impedir publicação acidental no npm; esse
campo não controla a visibilidade do repositório no GitHub e deve permanecer.

As licenças das dependências são verificadas pelo gate local. Essa verificação
não abrange direitos dos arquivos capturados. [Procedência](PROVENIENCIA.md) e
[assets](ASSETS.md) registram código/interface derivados de capturas públicas, fotografias, memes
e marcas de terceiros. Não há comprovação
geral de licença de redistribuição desse material, nem licença global permissiva
do Apurar. Tornar o repositório público não altera essas condições e não autoriza
declarar esse material como de autoria própria ou sob licença permissiva.

A revisão deve cobrir todas as branches e tags remotas, objetos históricos,
LFS, releases, anexos e demais superfícies que a mudança de visibilidade expõe.
Remover um segredo apenas do checkout atual não o retira do histórico. Eventuais
segredos encontrados precisam ser revogados antes da publicação; registrar apenas
o tipo e a localização, sem reproduzir valores.

## Validação local

Executar `npm run check:ci-local` para validar integridade, dependências, licenças,
limites, lint, tipos, formatação, testes Python/JS, build e navegador. Essa
validação é local e não comprova a desativação remota ou direitos autorais.

Havia alterações locais anteriores à revisão, incluindo a remoção da entrada do
chat e ajustes no coletor e no Worker. Elas foram preservadas. O inventário do
HTML histórico foi atualizado para essa remoção, sem substituir o acervo.

Na revisão local, passaram dependências, 335 licenças de dependências,
integridade, geografia, limites, ESLint/Ruff, tipos, formatação, 105 testes de
qualidade, 261 testes JS/TS e build. O Vite informa bundles superiores a 500 kB;
isso é aviso de tamanho, sem falha de compilação.

A primeira execução identificou três falhas entre 391 testes Python, associadas
às alterações locais que já existiam. A revisão corrigiu e validou os contratos:

- A conciliação volta a suspender a previsão quando votos, candidaturas ou
  seções divergem mais de 3%. O aumento local para 20% não tinha justificativa
  documentada e permitia a previsão no cenário de regressão existente.
- A restauração do estado valida horários e contagens originais antes de migrar
  a referência temporal do exterior. Assim, a migração não oculta um horário
  inválido ou posterior à geração persistida.
- Cidades do exterior preservam a intenção anterior de usar a geração oficial
  do arquivo, em vez de atribuir o fuso de Brasília ao relógio local sem offset.
  Os testes agora distinguem esse contrato da totalização estadual, que continua
  rejeitando um horário posterior à própria geração. Foi acrescentada regressão
  de migração válida sem alterar votos.

O chat permanece ausente nas três entradas públicas. Para preservar a cobertura
do módulo arquivado, o Vite inclui uma entrada de ensaio somente no build que
recebe `APURAR_TEST_PORT`; os testes confirmam a ausência do chat na página
original antes de montar o módulo. O build normal não contém essa entrada.
Passaram 544 cenários de navegador das demais funcionalidades e 26 do chat,
em desktop e celular. Outros 70 cenários foram pulados pelas condições já
existentes dos testes. Nenhum teste abriu conexão com serviços de produção.

Após as correções, `npm run check:all` concluiu com sucesso: 105 testes de
qualidade, 261 testes JS/TS, 393 testes Python e build, além dos gates estáticos.
O resultado de navegador foi validado nas duas execuções complementares acima.

## Limpeza textual para disponibilização do código

Por escolha explícita do proprietário, código, assets e aparência foram
preservados, com retirada de textos, links e dados identificáveis desnecessários.
Foram retirados dois blocos sem consumidores de autopromoção pessoal herdada,
com perfis de redes sociais, nome e identificador de terceiro. Os componentes
renderizados, arquivos visuais e dados oficiais eleitorais foram preservados.
Os caminhos absolutos que identificavam a conta local foram convertidos em
referências relativas ao diretório de desenvolvimento; a URL de uma conta
Workers anterior virou exemplo parametrizado no procedimento operacional.

Licenças, avisos de terceiros e procedência continuam documentados. Esta limpeza
não atribui ao Apurar a autoria dos arquivos capturados nem concede direitos de
redistribuição. Na primeira etapa, as remoções alcançaram apenas o checkout: o histórico Git
anterior ainda conservava as referências originais. A etapa posterior,
autorizada pelo proprietário, prepara uma publicação sanitizada com histórico
independente, descrita abaixo.

Após essa limpeza, `npm run check:all` passou novamente, com as mesmas contagens
de testes. Outros 22 cenários de navegador para interface histórica, entrada e
identificação do arquivo também passaram. A busca final nas fontes da interface
não encontrou os perfis pessoais retirados ou o caminho identificável da conta
local; isso não é uma afirmação sobre commits anteriores.

O recibo externo desta tarefa deve registrar o resultado efetivo da interrupção,
a visibilidade final do GitHub e quaisquer pendências. A existência deste
procedimento não significa que essas ações já tenham sido concluídas.

## Segunda revisão para publicação em 29/10/2026

Nomes e domínios dos sites comerciais de referência foram retirados de textos opcionais, metadados, inventários e identificadores internos. O tema e seus consumidores usam nomes do Apurar, sem alteração dos valores visuais. A busca por bytes nos 8.110 arquivos atuais rastreados ou preparados para inclusão e no build não encontrou os nomes/domínios alvo; arquivos ignorados e histórico Git não fazem parte dessa afirmação. Termos técnicos de CSS como `linear-gradient` não identificam um serviço.

Após os ajustes, `npm run check:all` passou: 105 testes de qualidade, 261 testes JS/TS, 393 testes Python e build. Passaram 68 cenários de navegador focados no design, arquivo histórico, interações e composição do mapa em desktop e celular; dois foram pulados pelas condições existentes. As licenças, fontes oficiais e créditos foram preservados. A limpeza textual não demonstra direitos gerais de redistribuição dos componentes e assets capturados. Naquele momento, ela ainda não alterava os commits anteriores.

## Histórico independente para publicação

Em etapa posterior de 29/10/2026, o proprietário autorizou explicitamente commit, push forçado e substituição do histórico público dos dois projetos. A versão preparada do Apurar inicia um histórico independente com um único commit raiz. O histórico anterior e o checkout anterior à preparação foram preservados em backups privados externos ao repositório, com verificação dos arquivos. Nenhuma referência de backup deve ser enviada ao GitHub. A mudança de visibilidade será conferida após o envio e registrada no recibo externo, sem presumir publicação concluída apenas pela existência deste documento.

Os registros anteriores de etapas sem commit ou push descrevem o estado nas datas em que foram escritos. A substituição da branch pública não declara autoria exclusiva, não concede direitos de redistribuição e não garante remoção de objetos antigos já retidos pelo provedor, clones ou caches de terceiros. A produção permanece encerrada.
