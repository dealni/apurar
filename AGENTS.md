# Apurar

Responda e escreva documentação em pt-BR. Commits em pt-BR com Conventional Commits.
Commit, push e deploy exigem pedidos próprios do usuário; nunca `--no-verify`.
O pre-push local é o portão efetivo, não presuma CI remoto disponível.

- Leia README e status Git antes de alterar. Preserve arquivos do usuário.
- `apps/web`: interface React; `apps/edge`: leitura Cloudflare; `services/collector`: Python e publicação; `packages/contracts`: contratos públicos.
- Preserve um único motor de projeção no Python. Frontend não recalcula previsões.
- Não misture demonstração, replay e dados ao vivo. Ausência de dados não é zero.
- Nunca troque o horário da fonte pelo horário da consulta para aparentar atualização.
- Correções oficiais podem reduzir votos. Preserve contagens observadas e a proveniência.
- Dados grandes, SQLite, segredos e capturas de terceiros não entram automaticamente no Git.
- Não copie configuração de conta, domínio, banco, credenciais ou serviços dos projetos irmãos.
- Mudanças em contratos exigem verificar produtor Python, leitor Worker e consumidor web juntos.
- Execute `npm run check:ci-local` antes de push. Registre limitações concretas de verificação.

O projeto herda código de `Aplicativos/apuracao` e referências de `acervo público de terceiros`.
Consulte `docs/PROVENIENCIA.md` antes de incorporar outros arquivos.
