# Chat ao vivo

Implementado em 25/10/2026. O binding e a migração de implantação estão em `wrangler.jsonc`; a versão efetivamente publicada deve ser conferida em `/_release.json`. Commit, push e deploy seguem as autorizações próprias do projeto.

## Uso

O botão “Chat ao vivo” abre uma sala pública compartilhada entre os painéis. A leitura não exige apelido; para enviar, o visitante escolhe um apelido de 2 a 24 caracteres. Mensagens têm até 280 caracteres. Apelidos são autodeclarados, não comprovam identidade e podem se repetir. Comentários dos visitantes não são resultados oficiais nem informações verificadas pelo Apurar.

O painel abre a conexão apenas quando utilizado e fecha ao ser dispensado. A reconexão utiliza espera progressiva. Uma tentativa de abertura sem resposta é encerrada após 10 segundos e entra nessa reconexão; fechar o painel ou sair da página cancela os temporizadores. O servidor mantém até 100 mensagens, com retenção máxima de 24 horas. O histórico não é um arquivo permanente. Texto é exibido sem interpretação de HTML e sem links automáticos. Os 20 códigos de memes reconhecidos, como `:KEKW:`, são apresentados como imagens locais. Códigos desconhecidos continuam como texto.

## Arquitetura

`/api/chat/socket` encaminha WebSockets para uma única sala `public-v1` no Durable Object `ChatRoom`. O binding `CHAT_ROOM` e a migração SQLite estão em `wrangler.jsonc`. A API eleitoral e o R2 continuam independentes do chat; o coletor Python não participa do fluxo.

A implementação usa `acceptWebSocket` e attachments para restaurar estado de conexões após hibernação. O armazenamento persistente conserva o histórico limitado e os controles temporários de envio. Alarmes expiram os dados mesmo sem novos visitantes.

Há validação de origem, formato, tamanho e caracteres de controle, limites por conexão e por identidade derivada do IP informado pela Cloudflare. O IP não é publicado para os participantes. A identidade de controle usa hash com sal da sala e expira após inatividade; não representa anonimato perante a infraestrutura. Redes compartilhadas também compartilham limites. Clientes externos podem falsificar Origin: essa checagem protege navegação entre sites, não substitui autenticação ou proteção contra bots.

## Confirmação e compatibilidade do envio

A revisão local de 25/10/2026 acrescenta `requestId` opcional ao envio e uma
confirmação `ack` privada para a conexão remetente, emitida após persistência.
Esse identificador não entra na mensagem pública nem no histórico. Erros de
um envio válido também podem incluir a correlação; respostas atrasadas não
liberam o campo de outra mensagem pendente.

O cliente aguarda até 10 segundos pela confirmação. Sem ela, mantém o texto,
libera a edição e pede que a pessoa confira o chat antes de tentar novamente.
Não retransmite automaticamente: confirmação ausente não prova que a mensagem
não foi salva. Apelidos e textos iguais de outra conexão não apagam o rascunho.

Clientes antigos continuam aceitos pelo servidor novo, pois a correlação é
opcional e o broadcast público permanece compatível. Um cliente novo conectado
a servidor antigo preserva o rascunho e informa confirmação incerta após o
prazo. Para a confirmação completa, frontend e Worker precisam da versão nova.

## Desenvolvimento e operação

Para executar frontend e WebSocket juntos:

```sh
npm run build
npm exec --offline -- wrangler dev --local --port 4327
```

Abra `http://127.0.0.1:4327` em duas abas e teste apelidos diferentes. Use somente dados fictícios. O Vite e o preview estático isolados não executam o Durable Object; os testes de interface nesses servidores simulam o WebSocket. O Wrangler local usa armazenamento local, sem publicar mensagens em produção.

Para suspender novas conexões, a variável `CHAT_ENABLED` pode ser definida como `false` no Worker em uma publicação autorizada. O Durable Object também recusa novos envios de conexões existentes e as encerra ao receber uma mensagem enquanto suspenso; a suspensão não remove automaticamente o histórico. Alterações no binding, migração ou infraestrutura exigem validar a configuração e o plano da conta antes da publicação. A funcionalidade consome recursos de Workers/Durable Objects; esta tarefa não verificou a fatura nem contratou serviços.

Não há contas autenticadas, painel de moderação, exclusão individual por administrador ou denúncia integrada nesta versão. Os limites reduzem abuso, mas não garantem que mensagens públicas sejam adequadas. Definir quem acompanha a sala e como responder a abuso é uma decisão operacional antes da ativação pública.

## Validação local

- Dois agentes implementaram backend e interface; outros dois revisaram separadamente. Foram corrigidos os problemas encontrados de persistência, rascunho, apelido, ciclo de conexão, telas baixas e sobreposição da navegação opcional.
- `npm run check:all`: tipos, formato, integridade dos assets, dependências, licenças, limites, 97 testes de qualidade, 250 testes JavaScript/TypeScript e 363 testes do coletor passaram, além do build.
- Teste real no Chrome com Wrangler local: duas abas fizeram upgrade, escolheram apelidos e trocaram uma mensagem pelo Durable Object; fechar uma conexão atualizou a presença e uma nova conexão recuperou o histórico. Esse ensaio usou somente texto fictício e armazenamento local.
- A suíte ampla de navegador terminou com 523 testes aprovados e 63 ignorados pelas condições dos próprios testes. As regressões de navegação inicialmente identificadas passaram após os ajustes; a última correção de altura foi retestada na rodada específica abaixo.
- Os 14 testes de interface do chat passaram na versão final e usam WebSocket simulado para verificar indisponibilidade, reconexão, texto puro, validação, foco, preservação de rascunho e layout desktop/celular. Não confundem esse mecanismo com o ensaio real do servidor descrito acima.
- Revisão independente no Chrome confirmou envio em telas 844×390, 844×320 e 844×260, saída/reentrada e restauração da página pelo navegador. Safari e Firefox não foram exercitados.

## Referências pesquisadas

- [Cloudflare: WebSockets e hibernação](https://developers.cloudflare.com/durable-objects/best-practices/websockets/).
- [Cloudflare: exemplo de servidor com hibernação](https://developers.cloudflare.com/durable-objects/examples/websocket-hibernation-server/).
- [Cloudflare: armazenamento de Durable Objects](https://developers.cloudflare.com/durable-objects/best-practices/access-durable-objects-storage/).
- [W3C: role=log para atualizações sequenciais](https://www.w3.org/WAI/WCAG22/Techniques/aria/ARIA23.html).

## Memes no chat

O botão “Emotes”, após escolher o apelido, abre 20 opções com nome e descrição.
A escolha insere o código no cursor ou substitui a seleção do rascunho; o envio
continua explícito pelo botão “Enviar”. O código conta no limite de 280 caracteres.
Escape fecha primeiro o seletor e devolve o foco ao botão, preservando o chat.
Durante um envio pendente, o seletor fica desabilitado junto com a edição.

As versões 4× foram baixadas e convertidas em WebP sem perda de pixels a partir da biblioteca pública FrankerFaceZ e são servidas
localmente, sem SDK ou consulta a terceiros durante o uso. O manifesto
`apps/web/src/features/chat/emotes-manifest.json` registra origem, uploader,
tamanho e SHA-256 de cada arquivo. O protocolo e o armazenamento continuam
transportando texto; clientes antigos mostram os códigos sem perder a mensagem.
