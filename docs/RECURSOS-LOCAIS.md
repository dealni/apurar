# Recursos locais da interface

Auditoria local em 25/10/2026, limitada ao Apurar e às entradas `/`, `/apurar/` e `/1turno/`. A disponibilidade de resultados ao vivo continua dependendo da coleta oficial; o acervo histórico não substitui a API atual.

## Recursos incorporados

| Recurso                                           | Disponibilidade                                                                                                                           |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| JavaScript, CSS e dependências de interface       | Imports locais, empacotados pelo Vite; nenhum CDN de execução.                                                                            |
| Tipografia                                        | Inter Variable local com licença SIL OFL 1.1; as duas fontes do acervo histórico também estão locais.                                     |
| Marca e ícones                                    | Arquivos próprios em `public/brand/`, favicon e ícone Apple locais; ver `MARCA-APURAR.md`.                                                |
| Finalistas do segundo turno                       | 14 retratos WebP locais, 76.424 bytes; fontes, identidades e hashes em `src/data/candidate-portraits.json`; ver `RETRATOS-CANDIDATOS.md`. |
| Retratos históricos                               | As 508 referências do catálogo `src/data/generated/candidates/retratos.json` possuem arquivo correspondente em `public/1turno/retratos/`. |
| Bandeiras                                         | Imagens incorporadas como data URI no catálogo local, sem serviço externo de bandeiras.                                                   |
| Mapas do Brasil, municípios e mundo               | Geometrias locais importadas no bundle; procedência da malha municipal atual em `MALHA-OFICIAL-2025.md`.                                  |
| Locais de votação, zonas e comparações históricas | Acervo local preservado em `public/1turno/` e `src/data/generated/`.                                                                      |

A inspeção estática conferiu 2.398 referências literais locais de importação e `url()` sem arquivo ausente, no estado integrado observado. URLs registradas nos manifestos de procedência não são usadas para carregar imagens na navegação. O inventário geral de hashes e tamanhos permanece em `ASSETS.md` e `ASSETS.sha256`, consolidado junto dos demais ajustes.

## Dependências externas necessárias

O navegador consulta o backend na própria origem (`/api/`); o coletor consulta o TSE para obter resultados atualizados, e o Worker lê os objetos publicados. Esses serviços não podem ser substituídos por cópias estáticas sem perder a atualização e a proveniência dos resultados. Links para a fonte oficial abrem por iniciativa do visitante. Metadados canônicos e de compartilhamento usam o domínio do próprio Apurar.

Não foram encontrados carregamentos ativos de fontes, scripts, CSS, ícones, bandeiras ou mapas em CDN de terceiros. A CSP publicada no código restringe scripts, fontes e conexões à própria origem, e imagens à própria origem ou data URI. A auditoria local não altera a configuração da Cloudflare nem certifica ausência de recursos que o provedor possa injetar em produção.

## Limites do acervo histórico

O código de ruas existe como capacidade opcional, mas não recebe `APURACAO.ruas` na configuração ativa; portanto não solicita tiles remotos. Não foi criado um espelho de mapas ou contratado serviço de tiles.

O resultado histórico do exterior em `/1turno/feed/uf/zz.json` está ausente da captura e possui tratamento explícito de indisponibilidade. Fotografias de deputados que faltavam na origem também preservam o fallback identificado. Não foram fabricados dados nem inseridos resultados atuais em arquivos históricos para encobrir essas lacunas. Os retratos dos 14 finalistas atuais têm cadastro e procedência próprios.

Fora os retratos e a marca tratados nas frentes específicas, esta auditoria não identificou outro recurso estático externo ativo que justificasse download adicional. Não foram copiados acervos de terceiros sem consumidor na aplicação.
