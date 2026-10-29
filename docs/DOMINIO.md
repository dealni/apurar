# Domínio Apurar

Configurado em 25/10/2026. Registro na Hostinger, zona Free e DNS na Cloudflare, vinculados ao Worker existente `apurar`. Nenhuma mudança no coletor, bucket, cadência de 15s ou quota TSE de 70 consultas/s.

- Nameservers: `dahlia.ns.cloudflare.com` e `harvey.ns.cloudflare.com`. Alteração feita no Chrome/hPanel; não havia credencial API Hostinger disponível.
- Domínios personalizados: `apurar.app` e `www.apurar.app`. O DNS correspondente é criado e controlado pela integração Workers Custom Domains.
- HTTPS obrigatório, TLS mínimo 1.2, TLS 1.3 e HTTP/3 ativos, SSL Full (strict). Certificado gerenciado pela Cloudflare.
- Regra de redirecionamento da zona: raiz de ambos os domínios → `https://apurar.app/apurar/`, HTTP 302, preservando query. Evita apresentar o arquivo antigo como apuração ao vivo.
- Demais caminhos em `www` → mesmo caminho no domínio principal, HTTP 301, preservando query. API permanece no mesmo domínio do frontend.
- As regras de redirecionamento e configurações da zona são externas ao Wrangler; `routes` conserva os vínculos em futuras publicações. `workers.dev` permanece disponível.
- DNSSEC: assinatura ECDSAP256SHA256 (algoritmo 13) na Cloudflare e DS com digest SHA-256 (tipo 2), key tag 2371, cadastrado na Hostinger. Só considerar a cadeia concluída após DS autoritativo no `.app` e resposta autenticada (`ad`) nos resolvedores. Nunca restaurar nameservers com DS da Cloudflare ainda publicado: remover o DS e aguardar caches antes de migrar para DNS sem essa chave.
- Sem e-mail configurado neste domínio; registros anteriores eram apenas estacionamento A e CNAME www. Não migrar o IP de estacionamento.

Verificação: conferir zona `active`, delegação autoritativa e resolvedores públicos, certificado válido sem ignorar TLS, `/`, `/apurar/`, `www`, APIs, ETag/HEAD, marcador de release e navegador. A propagação pode variar por resolvedor. Não declarar propagação global apenas por uma consulta local.

Reversão: antes de migrar para servidores sem a chave atual, remover o DS na Hostinger e aguardar sua expiração nos caches. Depois, restaurar nameservers originais `atlas.dns-parking.com` e `hyperion.dns-parking.com` somente se for desejado retornar ao estacionamento, considerando caches DNS; para indisponibilidade do domínio personalizado, o endereço `workers.dev` oferece acesso alternativo ao mesmo Worker.

## Página de acesso preparada em 25/10/2026

A raiz local agora serve uma página de acesso com sete opções, sem e-mail. Para exibi-la em produção numa publicação autorizada, é necessário remover ou adaptar a regra externa que redireciona `/` para `/apurar/`. Preservar a canonicalização de `www` para o domínio principal e os parâmetros de consulta. Publicar os assets pelo Wrangler, isoladamente, não remove a regra da zona. Esta revisão de navegação não alterou produção.
