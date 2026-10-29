# Telemetria no navegador

As entradas HTML do Apurar preservam `script-src 'self'` e `connect-src 'self'`. A aplicação não inclui o beacon de Web Analytics da Cloudflare. O header `Cache-Control: public, max-age=0, must-revalidate, no-transform`, limitado às três entradas HTML e seus aliases, impede a injeção automática pela borda sem ampliar a duração de cache do documento. O cache imutável dos assets continua independente.

A Cloudflare documenta que [`public, no-transform` impede a alteração do payload e a injeção do beacon](https://developers.cloudflare.com/web-analytics/get-started/). A [documentação do RUM](https://developers.cloudflare.com/speed/observatory/rum-beacon/) informa que o serviço pode vir habilitado automaticamente para clientes Free, mesmo sem snippet na fonte da aplicação.

Essa política trata da medição feita por JavaScript no navegador. O Analytics de servidor e as consultas do monitor de consumo são caminhos separados; a ausência do beacon não demonstra indisponibilidade deles. Não foi criado site RUM, regra Cloudflare ou recurso adicional para esta correção.

O teste de qualidade cobre o escopo dos headers e a CSP. A verificação HTTP deve usar Wrangler local ou a release efetivamente publicada, pois o preview do Vite não aplica o arquivo `_headers`. Após publicar, conferir os headers das entradas, ausência do beacon no HTML e ausência da violação de CSP no navegador. A reversão consiste em remover os headers específicos e republicar, mantendo a CSP.
