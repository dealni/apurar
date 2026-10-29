# Ferramentas de qualidade

Revisão de 25/10/2026. Ferramentas executam localmente, sem depender do GitHub
Actions. As configurações e a política de instalação dos projetos Portfolio,
CenterSeguidores e Apuração foram consultadas como referência; esses repositórios
não foram modificados.

## Preparação e comandos

```sh
npm ci
npm run setup:python-quality
npm run lint
npm run check:all
```

O setup Python cria/reutiliza `.venv` e instala
`services/collector/requirements-dev.txt`. O gate usa exclusivamente esse Python,
não instala dependências automaticamente e falha com instrução de preparação se
o ambiente estiver ausente. Ruff não é dependência de execução do coletor.

| Comando          | Responsabilidade                                                                                                                      |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `lint:js`        | ESLint com erro para avisos; fontes JS/TS, scripts, testes e configs.                                                                 |
| `lint:python`    | Ruff em `services` e `scripts`; parser e regras E4, E7, E9 e F.                                                                       |
| `typecheck`      | TypeScript estrito, índices e propriedades opcionais; agora também variáveis/parâmetros não usados, retornos e fallthrough de switch. |
| `format:check`   | Prettier no escopo já definido pelo projeto. Não formata Python.                                                                      |
| `check:limits`   | Até 500 linhas por arquivo; complexidade 15 e 150 linhas efetivas por função JS/TS em apps/packages.                                  |
| `test:quality`   | Regressões dos próprios gates, incluindo exemplos inválidos dos linters e suíte Python vazia.                                         |
| `check`          | Dependências, licenças, procedência, geografia, limites, lint, tipos, formato e testes.                                               |
| `check:all`      | Acrescenta build.                                                                                                                     |
| `check:ci-local` | Acrescenta Chrome desktop/mobile e é exigido pelo pre-push.                                                                           |

O hook continua exigindo checkout limpo e o commit HEAD correto. Esta revisão
não executou commit, push ou deploy.

## Versões e decisões

ESLint `10.13.0`, `@eslint/js` `10.0.1`, typescript-eslint `8.72.0` e globals
`17.13.0` estão fixados no manifesto e lock. O peer range do typescript-eslint
inclui TypeScript 6.0 e ESLint 10; `npm ls` confirmou a instalação sem conflitos.
Ruff `0.17.2` está fixado no requirements e em `required-version` no `ruff.toml`.
O alvo sintático Python permanece 3.11.

Foram adotadas regras recomendadas de correção, com estas adaptações explícitas:

- Globais do navegador ficam nas fontes web/E2E; scripts Node não herdam `document`.
- Espaços inseparáveis em templates HTML são permitidos, preservando a tipografia.
- Variáveis removidas por object rest e parâmetros com prefixo `_` são intencionais.
- `prefer-const` respeita leituras anteriores à atribuição, presentes nos testes
  de concorrência.
- Somente `no-unused-vars` fica desativado nos módulos JS reconstruídos de
  `features/apuracao` e `features/projetar`. A análise inicial encontrou 73
  ocorrências nesses módulos, incluindo imports e assinaturas retidos da
  referência. `no-undef` e as demais regras continuam ativas; testes comprovam
  isso. O histórico é protegido também pelo inventário SHA-256.
- Assets públicos, dados gerados e artefatos de ferramentas ficam fora do lint.
  Dados importados continuam nos gates de integridade/geografia existentes.

As correções necessárias incluíram substituir dois `any` por tipos explícitos,
remover um import Python sem uso, escrever dois callbacks Python como funções e
limpar instruções agrupadas em sete arquivos de teste. A AST desses sete arquivos
permaneceu equivalente. O runner Python agora falha se descobrir zero testes.

## Validação desta revisão

`npm run check:all` aprovado: 105 testes dos gates/runtime, 254 testes Vitest e
366 testes Python, além de lint, typecheck, formato, dependências, licenças,
integridade, limites e build. Os oito testes novos exercitam casos válidos e
inválidos. A revisão independente repetiu esses oito testes e confirmou peers,
lock, alcance dos linters e exclusões.

`npm audit --json` não reportou vulnerabilidades conhecidas nas 335 dependências
do lock. O aviso existente de chunks grandes permanece no build. Logs locais:
`.artifacts/ferramentas-qualidade-gates.log`. Não foi repetida a suíte de navegador
nesta etapa de tooling; a revisão anterior registrou 527 aprovados e 63 ignorados.

## Limites observados

Lint sintático não substitui typecheck do legado JavaScript ou typecheck Python.
Não foi habilitada uma reformatação global do Python nem uma migração integral
dos módulos herdados.

Uma medição diagnóstica com Ruff C901 e teto 15 encontrou sete funções Python:
`__main__.main` (22), `core.collector._cycle` (20), `core.engine.project` (18),
`core.tse._fetch` (19), `core.tse.parse_result` (16), `diagnostics.inspect` (19) e
`supplemental_publication.publish` (19). C901 ainda não integra o gate obrigatório;
esses fluxos precisam de refatoração com regressões próprias. O gate atual não
deve ser descrito como limite de complexidade para Python.

## Referências oficiais consultadas

- [ESLint: configuração plana e regras recomendadas](https://eslint.org/docs/latest/use/configure/configuration-files).
- [ESLint: no-undef](https://eslint.org/docs/latest/rules/no-undef) e
  [prefer-const](https://eslint.org/docs/latest/rules/prefer-const).
- [typescript-eslint: integração recomendada](https://typescript-eslint.io/getting-started/).
- [Ruff: configuração](https://docs.astral.sh/ruff/configuration/) e
  [versão exigida](https://docs.astral.sh/ruff/settings/#required-version).
- [TypeScript: verificação de retornos](https://www.typescriptlang.org/tsconfig/noImplicitReturns.html).
