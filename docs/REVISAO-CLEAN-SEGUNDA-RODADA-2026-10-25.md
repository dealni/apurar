# Segunda revisão geral — 25/10/2026

Nova rodada com seis agentes Sol 6.1 em esforço médio: design responsivo,
fluxos, backend/dados, chat e revisores independentes visual e técnico.
As alterações locais da primeira revisão foram preservadas. A revisão segue
os guias de design, copywriting e arquitetura/dados da raiz de `Developer`.
Não houve commit, push, deploy, acesso às VPS ou operação em produção.

## Correções adicionais

- **Cache TSE:** respostas EA20 sem geração válida, inclusive campos vazios,
  não substituem o cache nem seu ETag. Catálogos que legitimamente não incluem
  geração continuam aceitos. Regressões verificam recusa e recuperação.
- **Chat:** prazo de 10s para abertura do WebSocket, seguido de reconexão.
  Fechar o painel ou sair da página cancela os timers; sockets anteriores não
  podem reativar a conexão atual. A confirmação por identificador e o rascunho
  da rodada anterior foram preservados.
- **Regiões e exterior:** ausência de dados deixa de ser apresentada como
  “Nenhuma seção totalizada”. O zero conhecido continua identificado. Cobertura
  parcial conserva seu aviso. Percentuais regionais usam a base de votos das
  candidaturas já fornecida pelo adapter, mesmo sem totais oficiais de votos
  válidos; nenhum voto ou total oficial é recalculado/substituído.
- **Texto ampliado e adaptação:** faixa vazia de governadores deixa de reservar
  colunas de candidaturas inexistentes; cabeçalho e faixa reservam espaço para
  o texto, os seletores podem quebrar linha e os totais adaptam suas colunas.
  O mapa continua prioritário e os avisos de fonte permanecem visíveis.

## Revisão e evidências

Os revisores examinaram as mudanças e os estados de indisponibilidade,
rascunho, cache, dados parciais e apresentação. A revisão de fluxos executou
56 testes focados de navegação, histórico, exportação e recuperação, com dois
cenários pulados por perfil, sem encontrar outra falha concreta.

A cobertura específica de regiões verifica API indisponível, votos conhecidos
sem totais oficiais e zero explicitamente recebido: seis cenários desktop/mobile
aprovados. Os testes focados do chat verificam também abertura travada e
restauração da página. Capturas locais ficam em `.artifacts/rodada2-visual/`
e `.artifacts/rodada2-revisor-visual/`.

## Validação final integrada

- Gates de dependências, licenças, inventários, geografia, limites, lint,
  tipos, formato e build aprovados.
- 105 testes de qualidade, 256 testes JavaScript/TypeScript e 371 testes Python
  aprovados.
- Navegador final: **549 aprovados e 69 pulados pelas condições de perfil/layout**,
  sem falhas, em 618 cenários descobertos.
- A primeira execução ampla encontrou uma corrida no teste do atalho de replay:
  o botão aparecia antes do efeito que instala o listener de teclado. O teste
  agora aguarda o comportamento, preservando as asserções originais. Foram
  aprovadas 72 execuções repetidas e, depois, a nova suíte completa.
- A medição do canvas no teste de governadores também aguarda seu ajuste ao
  stage pelo ResizeObserver antes de comparar a geometria; limites de aceite
  e verificações de sobreposição foram preservados.

Logs: `.artifacts/rodada2-final.log` (gates completos e primeira execução de
navegador), `.artifacts/rodada2-browser-final.log` (suíte de navegador final),
`.artifacts/rodada2-fluxos-atalho-depois.log` (repetições do atalho) e
`.artifacts/rodada2-regioes-zero.log` (ausência, parcial e zero conhecido).

## Limitações

Chrome e emulação de viewport/texto não substituem testes em aparelhos físicos,
Safari, leitores de tela ou auditoria integral de acessibilidade. A ampliação
apenas de texto foi emulada a 200% preservando a viewport CSS. Os dados das
regressões são controlados localmente, sem consultas ou envios em produção.
O peso inicial das malhas e o aviso de chunks grandes continuam como descrito
na [primeira revisão](REVISAO-CLEAN-SISTEMA-2026-10-25.md).
