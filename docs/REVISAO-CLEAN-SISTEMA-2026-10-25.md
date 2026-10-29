# Revisão geral: clareza, funcionamento e design — 25/10/2026

Revisão local baseada nos três guias da raiz de `Developer`: design web e apps,
copywriting e arquitetura/infraestrutura/dados. Oito agentes Sol 6.1 com esforço
médio atuaram em design, fluxos, copy, backend, desempenho, chat e duas revisões
independentes. A árvore estava limpa no início. Não houve commit, push, deploy,
acesso às VPS ou envio de mensagens em produção.

## Decisões e ajustes

- **Design:** menu global usa os tokens comuns de superfície, texto e foco.
  Metadados do menu têm 12px; os alvos compactos do painel compensam sua escala
  desktop, preservando alvos móveis de 44px. Mapa, cores eleitorais e hierarquia
  dos resultados permanecem como base da interface.
- **Conteúdo:** mensagens distinguem indisponibilidade no painel de ausência
  de publicação na fonte. Dados ausentes não são apresentados como zero votos.
  A captura histórica é identificada como arquivo do primeiro turno. Foi
  removida a expressão incorreta “projeção oficial” de uma mensagem interna.
- **Coleta:** falhas de protocolo HTTP, incluindo respostas truncadas, passam
  pelo tratamento recuperável. O cache válido é preservado, e falha municipal
  não impede a continuidade do nacional confirmado.

- **Indisponibilidade:** o aviso sem dados usa a faixa do desktop e deixa os
  controles do mapa acessíveis. O painel de projeção vazio tem altura natural e
  não mostra uma seção de participação sem conteúdo; mantém o aviso experimental.
- **Chat:** confirmação privada por identificador de envio após persistência,
  sem expor essa correlação ao histórico ou a outros participantes. Envios sem
  confirmação liberam a edição após 10s e preservam o rascunho. Confirmações e
  erros atrasados não encerram outro envio; não há retransmissão automática.

## Desempenho

A medição local identificou aproximadamente 3.347 kB minificados no painel
(1.205 kB gzip) e 2.229 kB no histórico (729 kB gzip). A maior parcela vem dos
mapas e dados importados estaticamente. O mapa inicializa geometrias de forma
síncrona; dividir os mesmos imports em chunks não reduziria a transferência
inicial. O aviso do build foi preservado.

Reduzir essa carga exige uma mudança própria no carregamento: índice nacional
leve, geometrias por UF e estados assíncronos com tratamento de falha. Esta
rodada não mudou dados geográficos nem o bootstrap do mapa.

## Referências pesquisadas

- [W3C: foco visível](https://www.w3.org/WAI/WCAG22/Understanding/focus-visible.html)
  e [alvos de interação](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html):
  indicadores de teclado e dimensões verificáveis, sem declarar conformidade
  integral com WCAG.
- [Geist](https://vercel.com/geist/introduction): consistência de tokens e
  aparência contida para os controles.
- [Python: exceções HTTP](https://docs.python.org/3.11/library/http.client.html#http.client.HTTPException):
  respostas truncadas e linhas de status inválidas têm hierarquia própria de
  exceções e precisam entrar no tratamento de falhas do transporte.
- [Vite: carregamento assíncrono](https://vite.dev/guide/features#async-chunk-loading-optimization):
  divisão de código é útil quando permite adiar dependências; renomear chunks
  sem mudar a necessidade dos dados não elimina seu custo inicial.

## Validação final

- Gates de dependências, licenças, inventários, geografia, limites, ESLint,
  Ruff, tipos e formato aprovados; build aprovado com o aviso de chunks já
  descrito.
- 105 testes de qualidade, 256 testes JavaScript/TypeScript e 369 testes Python
  aprovados na execução integrada.
- Navegador final: **531 aprovados e 65 pulados pelas condições de perfil/layout
  da suíte**, sem falhas, em 596 cenários descobertos.
- A primeira execução ampla encontrou expectativas de textos antigos em dois
  specs. As asserções foram alinhadas às mensagens novas, preservando os casos
  404, 503 e falha de rede; 20 testes focados e a nova suíte ampla passaram.
- Revisores independentes confirmaram as correções de coleta, protocolo do
  chat, rascunhos, faixa de indisponibilidade e apresentação desktop/mobile.
  O revisor técnico encontrou um erro tardio que poderia liberar outro envio
  pendente; a correlação foi estendida aos erros e o cenário entrou no teste.

Logs locais: `.artifacts/revisao-clean-sistema-final.log` (gates completos e
primeira rodada do navegador) e `.artifacts/revisao-clean-sistema-browser-final.log`
(navegador final). Capturas e geometria em
`.artifacts/revisao-geral-visual/final-v2-api503-1024.png`,
`final-v2-api503-1440.png` e `final-v2-geometria.json` na mesma pasta.

## Limites

Os testes de interface usam Chrome desktop e emulação mobile, com fontes e
WebSocket controlados localmente. Não comprovam comportamento em aparelhos
físicos, Safari, disponibilidade de produção ou precisão do modelo eleitoral.
A revisão geral não equivale a auditoria exaustiva de segurança/acessibilidade.
A entrada foi conferida no código atual: `/` abre o segundo turno e `/1turno/`
abre o arquivo histórico, em acordo com o README atual.
