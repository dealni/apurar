# Infraestrutura do Apurar

> Produção encerrada em 29/10/2026. Unidades VPS estão paradas e mascaradas;
> Worker sem domínios ou acesso por `workers.dev`. Os modelos abaixo documentam
> a instalação anterior e não devem ser reativados sem novo pedido explícito.
> A configuração atual usa `routes: []` e `workers_dev: false`.
> Consulte [o encerramento](../docs/ENCERRAMENTO-2026-10-29.md).

A primeira publicação ocorreu em 24/10/2026: Worker `apurar` na Cloudflare e coletor `apurar-collector` na VPS Apps (`srv924325`). Nenhum arquivo desta pasta aplica mudanças automaticamente. Correções posteriores do código e destes modelos exigem novo deploy explicitamente autorizado.

Pré-requisitos: usuário/grupo `apurar`, release em `/opt/apurar/releases/<sha>`, link `/opt/apurar/current`, Python virtualenv em `/opt/apurar/current/.venv`, dependências de `services/collector/requirements-r2.txt`, bases verificadas em `/var/lib/apurar/data`, diretórios de estado e saída graváveis somente pelo serviço e credenciais em `/etc/apurar/collector.env`.

`systemd/apurar-collector.service` executa somente coleta/publicação, sem servidor HTTP. O diretório de trabalho permite resolver `apurar_collector`; código e venv são somente leitura para o processo. A função `exclusive` impede duas instâncias sobre o mesmo diretório de estado. Confirmar necessidade de CPU/memória e políticas de retenção antes da instalação, sem impor limites arbitrários sobre os outros aplicativos da VPS.

`collector.env.example` contém apenas nomes das variáveis. Não salvar valores reais neste repositório nem em saída de comandos. O token R2 deve permitir somente o bucket necessário. Instalar/ativar esta unidade é deploy e precisa de autorização própria.

Na Cloudflare, `wrangler.jsonc` define assets estáticos e rotas `/api`/`/api/*`. O bucket `apurar-snapshots` precisa existir na conta correta. A configuração define os domínios personalizados `apurar.app` e `www.apurar.app`, mantendo o subdomínio `workers.dev` da conta, previews e observabilidade desativados. O destino principal é `https://apurar.app`. Consulte `docs/DOMINIO.md` para os redirecionamentos externos ao Wrangler. O bucket já foi provisionado no primeiro deploy; não recriá-lo. O DNS fica na Cloudflare; não há API pública na VPS.

Veja [operação e recuperação](../docs/OPERACAO.md).

O monitor opcional de consumo tem modelos separados em `systemd/apurar-consumption.{service,timer}` e `consumption.env.example`. Reutiliza o DealniBot externo de `alerts.env`, com token Analytics dedicado somente leitura e configuração externa própria. Preparar esses arquivos não ativa o serviço. Consulte [tráfego e consumo](../docs/ALERTAS-CONSUMO.md) antes de uma instalação autorizada.
