# Revisão geral de código e configuração — 25/10/2026

Revisão local autorizada do frontend, Worker, contratos, coletor Python,
infraestrutura declarativa e gates. Três agentes implementaram correções em
escopos separados; dois agentes revisaram os diffs independentemente. Nenhum
commit, push, deploy, acesso às VPS ou envio de mensagens foi realizado.

## Correções

| Área         | Problema observado                                                                                                                         | Correção e evidência                                                                                                                                                                                                      |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Coletor      | Resposta com `dg/hg` inválidos podia entrar no cache e impedir a recuperação de respostas seguintes, até reiniciar o processo.             | Validação antes de substituir dados/ETag; tipos inválidos geram `ValueError`. Três testes novos cobrem recuperação, preservação do cache e catálogos sem horário.                                                         |
| Worker       | Leitura opcional de `health.json` travada consumia o prazo total e derrubava o manifesto oficial.                                          | Prazo próprio de 1s; falha de saúde retorna `health: null` e conserva o manifesto. Regressões cobrem travamento de `get` e de `text`.                                                                                     |
| Worker       | Após expirar o prazo de 8s, uma leitura R2 podia continuar a cadeia de consultas.                                                          | Sinal interno verificado antes e depois das etapas de leitura; testes verificam que não há consultas seguintes nem gravação tardia no cache.                                                                              |
| Web          | Após recuo do relógio local, cache presidencial podia confirmar publicação agora futura e impedir a recuperação para publicação corrigida. | Cache revalida o snapshot e os dois clientes compartilham a regra temporal. A proteção contra regressão continua quando a publicação anterior permanece temporalmente válida. Dois testes novos.                          |
| Testes       | Descoberta Vitest restrita a uma subpasta da web e arquivos `.test.ts`.                                                                    | Inclui testes e specs JS/TS, JSX/TSX e módulos MJS/MTS em toda a área de fontes web, Worker e contratos. Scripts de portão e E2E continuam nos respectivos runners.                                                       |
| Gates        | `.only` podia reduzir a suíte local; no Playwright também afetava o gate com `CI=1`.                                                       | `allowOnly: false` e `forbidOnly: true`.                                                                                                                                                                                  |
| Configuração | Config Vitest fora do typecheck e opção legada de build.                                                                                   | `vitest.config.ts` incluído no TypeScript; `rolldownOptions` substitui alias depreciado. Vitest não carrega arquivos `.env` automaticamente (`envDir: false`); variáveis já presentes no processo permanecem disponíveis. |

Os contratos públicos de dados eleitorais, o motor de projeção e os bindings de
produção foram preservados. Portfolio e CenterSeguidores foram consultados como
referência de isolamento de ambiente e bloqueio de `.only`, sem alterações nesses
repositórios nem cópia de configuração de conta ou serviços.

## Revisão independente

Os revisores não identificaram regressões acionáveis nos diffs. Executaram, além
da validação principal, 32 testes Python e grupos focados de 40 e 44 testes
JavaScript/TypeScript. Conferiram descoberta de testes, cache, ETag, HEAD,
isolamento entre requisições e a preservação dos catálogos sem data de geração.

## Validação final local

`npm run check:all` aprovado, incluindo dependências/lock, licenças, integridade
das importações, malha municipal, limites, tipos, formato, testes e build:

| Suíte                         | Resultado                                           |
| ----------------------------- | --------------------------------------------------- |
| Gates e runtime (`node:test`) | 97 aprovados                                        |
| Vitest                        | 254 aprovados, 43 arquivos                          |
| Coletor Python                | 366 aprovados                                       |
| Chrome desktop/mobile         | 527 aprovados; 63 ignorados por condições de layout |

`npm audit --json`: nenhuma vulnerabilidade conhecida reportada no lock atual.
Isso não equivale a auditoria de segurança do código ou garantia de ausência de
vulnerabilidades. O build mantém o aviso de tamanho de chunks descrito abaixo.

Logs locais em `.artifacts/revisao-geral-gates-final.log` e
`.artifacts/revisao-geral-browser-final.log`; os artefatos não entram no Git.

## Limitações e melhorias restantes

- O timeout interrompe a resposta e as etapas posteriores; a API R2 usada não
  cancela fisicamente uma operação `get/text` já iniciada.
- O frontend contém 472 arquivos JavaScript e 57 TypeScript após os ajustes desta revisão.
  `strict` cobre TypeScript; JavaScript passa por parsing, limites e testes,
  mas não por verificação completa de tipos. Uma migração deve ser gradual,
  com prioridade nas fronteiras de dados e no estado da interface.
- O build ainda avisa sobre bundles grandes: aproximadamente 3,35 MB para o
  painel atual e 2,23 MB para o primeiro turno, antes de gzip. Dividir código e
  dados exige medição de carregamento e regressões dos mapas; o limite do aviso
  não foi aumentado para ocultá-lo.
- P3, chat: confirmação de envio compara apelido/texto. Outra conexão com os
  mesmos valores pode limpar antecipadamente o composer. Não há evidência de
  perda de mensagem já publicada. Correlação por identificador requer alteração
  coordenada do contrato, cliente e servidor; permanece como melhoria de protocolo.
- Testes locais e mocks não demonstram saúde de produção, restauração real nem
  precisão eleitoral. A revisão não foi uma auditoria de segurança exaustiva.

## Pesquisa e referências oficiais

- [Vite: opções de build](https://vite.dev/config/build-options) e
  [configuração do bundle](https://vite.dev/guide/build.html): `rolldownOptions`
  e divisão de chunks.
- [Vitest: descoberta de testes](https://main.vitest.dev/config/include) e
  [bloqueio de only](https://main.vitest.dev/config/allowonly).
- [Playwright: forbidOnly](https://playwright.dev/docs/api/class-testconfig#test-config-forbid-only).
- [Vite: envDir](https://vite.dev/config/shared-options#envdir): desativação da
  leitura automática de `.env`.
- [TypeScript: allowJs](https://www.typescriptlang.org/tsconfig/allowJs.html) e
  [checkJs](https://www.typescriptlang.org/tsconfig/checkJs.html): alcance da
  verificação em bases híbridas.
- [Cloudflare: cabeçalhos de assets](https://developers.cloudflare.com/workers/static-assets/headers/)
  e [Cache API](https://developers.cloudflare.com/workers/examples/cache-api/):
  distinção entre respostas de assets e respostas do Worker.
