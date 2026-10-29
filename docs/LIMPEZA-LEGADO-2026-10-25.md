# Limpeza do legado comercial — 25/10/2026

Trabalho local autorizado pelo proprietário após inventário dos arquivos herdados do acervo público de terceiros. O proprietário confirmou explicitamente a preservação da página histórica `/1turno/`, dos dados eleitorais e das comparações com 2022 e com o primeiro turno. A autorização desta etapa não inclui commit, push ou deploy.

## Escopo

- Remoção da página `/anunciar/`, seus componentes, fragmentos HTML, estilos, formulários, métricas comerciais, publicações, miniaturas e catálogos de lives e repercussão.
- Substituição da home capturada por uma entrada própria que abre `/apurar/`.
- Remoção de `ads.txt` da conta da referência e dos inventários `captura-index.json` e `captura-resources.json` sem consumidor em execução.
- Limpeza de marcas, publicidade, chat e auditoria herdados sem uso na interface atual, com atualização dos imports e referências correspondentes.
- Remoção dos módulos de ruas sem configuração ativa e dos motores legados de zonas/bairros/locais apenas no painel novo; a consulta histórica continua na página do primeiro turno.
- Remoção dos componentes de Senado, Câmara, assembleias e hemiciclo inativos no painel novo, preservando helpers visuais compartilhados e os cargos da aplicação histórica.
- Remoção das duas imagens comerciais sem referências ativas em `public/1turno/assets/`: `anuncio.0c5c22b7d8.webp` (G4) e `og.933bb11ba1.jpg` (Pandora), preservando fontes e dados eleitorais dessa árvore.
- Atualização de entradas de build, testes e inventários de integridade para refletir a árvore mantida, preservando os gates de qualidade.

## Preservação

Permanecem a página histórica `/1turno/`, os feeds e locais de votação arquivados, os mapas, cadastros e retratos eleitorais necessários, além dos dados e recursos de comparação com 2022 e com o primeiro turno. O código compartilhado com o painel atual é mantido quando necessário ao funcionamento desses recursos.

A malha oficial do segundo turno, o painel `/apurar/`, o diagnóstico `/simples/`, o coletor, o motor Python, a API, os dados de governadores e exterior e o arquivo oficial do Apurar continuam no projeto. Os repositórios de origem não foram alterados.

A limpeza não transfere autoria de código ou assets incorporados. A procedência e os limites de licença continuam em [PROVENIENCIA.md](PROVENIENCIA.md). Os documentos de entrega e revisão anteriores são registros datados e descrevem a árvore existente quando foram produzidos.

## Integridade e validação

Os inventários `scripts/quality/imported-assets.json` e [ASSETS.sha256](ASSETS.sha256) devem refletir os arquivos mantidos após a limpeza. Hashes dos arquivos derivados identificam a versão local adaptada; não afirmam igualdade byte a byte com a captura original.

Doze agentes participaram da implementação e da revisão independente. A revisão de imports conferiu 446 módulos e 1.988 referências, sem arquivos ou exportações ausentes ao final. Foram removidos 559 arquivos versionados, incluindo 6.659.483 bytes de material comercial, fontes de páginas removidas e código sem uso; esse é o tamanho bruto dos arquivos excluídos, não a redução líquida do repositório.

A conferência final por hash contra o HEAD anterior confirmou 7.094 arquivos preservados em `public/1turno`, `src/data/generated`, coletor Python, Worker e contratos. As únicas exclusões no acervo público do primeiro turno foram as duas imagens comerciais identificadas acima. Fontes, retratos, resultados, locais, zonas e recursos de comparação com 2022 e com o primeiro turno foram mantidos. Isso preserva as comparações existentes; não habilita no feed ao vivo comparações que antes não dispunham de insumos.

Validação integrada local aprovada:

| Verificação                                                              | Resultado                             |
| ------------------------------------------------------------------------ | ------------------------------------- |
| Testes de qualidade                                                      | 92 aprovados                          |
| Contratos, Worker e integração JavaScript                                | 183 aprovados                         |
| Coletor Python                                                           | 275 aprovados                         |
| Navegador Chrome desktop/celular                                         | 118 aprovados                         |
| Total da suíte completa                                                  | 668 aprovados                         |
| Dependências, licenças, geografia, limites, tipos, formato e inventários | Aprovados                             |
| Build                                                                    | Aprovado, com aviso de chunks grandes |

Após retirar as duas imagens comerciais finais, a conferência dos hashes de preservação e dos inventários foi repetida. Os testes das rotas verificam o redirecionamento da raiz com query/hash, alternativa sem JavaScript, disponibilidade do primeiro turno e HTTP 404 para a página comercial, inventários e imagens removidas. Os logs locais ficam em `.artifacts/limpeza-check-all.log`, `.artifacts/limpeza-browser.log` e `.artifacts/limpeza-rotas-final.log`.

Não houve commit, push, deploy ou alteração em produção. A fonte externa em `acervo público de terceiros` não foi modificada. A aplicação conserva a procedência dos recursos visuais ainda incorporados e o aviso de arquivo histórico.
