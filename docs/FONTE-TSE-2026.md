# Fonte oficial para o segundo turno de 2026

Verificação em 24/10/2026. Escopo: documentação oficial e oito GETs pequenos de JSON público, incluindo três consultas adicionais do catálogo para resolver a correspondência geográfica e gerar o mapa oficial; nenhum coletor completo, serviço VPS, gravação remota ou publicação foi executado nesta pesquisa.

## Eleição e consumo

O segundo turno ocorre em 25/10/2026: pleito `3221`, eleição federal `6258` e estadual `6260`. O núcleo do Apurar usa Presidente (`c0001`, eleição `6258`); o suplemento usa governadores (`c0003`, eleição `6260`) e resultados presidenciais do exterior. A projeção permanece exclusiva de Presidente. O primeiro turno federal é `6257`.

A plataforma limita o consumo a 100 requisições/s/IP; excedê-lo pode bloquear o IP por dez minutos e novas tentativas podem renovar o bloqueio. Erros 404 repetidos também podem provocar bloqueio. Respostas 304 contam na quota. A revisão local de 25/10/2026 conferiu `TSE_REQUESTS_PER_SECOND = 70` em `services/collector/apurar_collector/core/config.py`, compartilhado pelo processo, sem rajadas, e pausa de pelo menos 600s em 403/429. Isso descreve o código local e não verifica a configuração efetiva em produção. [Página técnica do TSE](https://www.tse.jus.br/eleicoes/informacoes-tecnicas-sobre-a-divulgacao-de-resultados).

Não existe índice geral de atualizações. EA14/EA15 oferecem pistas de totalização, com possíveis diferenças temporárias entre arquivos por sincronização da CDN. Não há cadência fixa garantida. Cadastro/autorização prévia não é exigido para consumir os resultados públicos. [Página técnica e FAQ do TSE](https://www.tse.jus.br/eleicoes/informacoes-tecnicas-sobre-a-divulgacao-de-resultados).

## Endereços e configuração

As instruções orientam começar pelo EA11, consultar o catálogo municipal EA12 e construir URLs conforme os tipos de arquivo. Municípios exigem cinco dígitos TSE; eleição exige seis dígitos no nome do arquivo. [Instruções de download, versão 1.1 de 19/10/2026](https://www.tse.jus.br/eleicoes/eleicoes-2026-content/arquivos/divulgacao-de-resultados/tse-instrucoes-para-download-dos-arquivos-da-divulgacao-2026).

Endereços públicos conferidos:

- [EA11 — configuração de eleições](https://resultados.tse.jus.br/oficial/comum/config/ele-c.json).
- [EA12 — municípios do segundo turno federal](https://resultados.tse.jus.br/oficial/ele2026/6258/config/mun-e006258-cm.json).
- [EA20 — Presidente, Brasil, segundo turno](https://resultados.tse.jus.br/oficial/ele2026/6258/dados/br/br-c0001-e006258-u.json).

O EA11 informa ciclo, pleitos, eleições e diretórios parametrizados em `arq`. A implementação fixa intencionalmente os endereços presidenciais de 2026; não implementa descoberta genérica pelo EA11. Mudança futura de ciclo/layout exige nova revisão. [Especificação EA11](https://www.tse.jus.br/eleicoes/eleicoes-2026-content/arquivos/divulgacao-de-resultados/tse-ea11-arquivo-de-configuracao-de-eleicoes).

## Significado dos dados

No EA20, `dg/hg` indicam geração e `dt/ht` indicam totalização. `dv=n` impede divulgação da votação presidencial; zero nessa condição não representa votação observada. `and=f` e `tf=s` têm significados distintos: término do recebimento/totalização da abrangência versus finalização oficial da eleição. `vap` representa votos computados antes das regras de totalização; `dvt` informa destinação válida, anulada ou sub judice. Portanto, somar indiscriminadamente candidaturas pode divergir de `v.vv`. O parser preserva os votos computados por candidato e `vv` separadamente, inclusive destinações anuladas/sub judice; a conciliação suspende somente a projeção diante de incompatibilidade, preservando os totais oficiais. Os campos opcionais `vvc`, `van`, `vansj`, `tv` e `dvt` acompanham o snapshot, quando presentes. A especificação também distingue seções totalizadas, instaladas e apuradas; a interface deve chamar `s.st` de seções totalizadas. [Especificação EA20, revisão 13/10/2026](https://www.tse.jus.br/eleicoes/eleicoes-2026-content/arquivos/divulgacao-de-resultados/tse-ea20-arquivo-de-resultado-unificado).

A divulgação presidencial é liberada a partir das 17h de Brasília; esse horário não garante primeiro resultado ou volume mínimo de votos. O art. 267 determina consulta periódica conforme os padrões oficiais e preservação do conteúdo distribuído. A projeção do Apurar deve permanecer identificada separadamente dos votos oficiais. [Resolução TSE 23.751/2026, arts. 265 e 267](https://www.tse.jus.br/legislacao/compilada/res/2026/resolucao-no-23-751-de-26-de-fevereiro-de-2026).

## Assinatura e confiança

O TSE permite escolher JSON ou JWS. Consumir JSON é suportado; verificar JWS é uma camada opcional de autenticidade. O JWS usa EdDSA/Ed25519 e exige chave oficial previamente confiada, externa ao próprio arquivo. Chaves de desenvolvimento não validam o ambiente oficial. O Apurar atualmente usa HTTPS oficial e integridade SHA-256 dos próprios objetos publicados, sem verificar a assinatura TSE. Essa integridade interna não prova assinatura oficial nem mede acurácia da projeção. [Manual de verificação JWS, revisão 16/09/2026](https://www.tse.jus.br/eleicoes/eleicoes-2026-content/arquivos/divulgacao-de-resultados/manual-verificacao-jws).

## Evidência prática e limites

Os três endereços acima responderam HTTP 200. O resultado BR consultado indicou `f=o`, `ele=6258`, `t=2`, `and=n`, `tf=n`, `dt/ht` vazios e nenhuma seção totalizada. Seu horário de geração era 24/10/2026 19:19:13; não se substituiu esse valor pelo horário da consulta. Isso confirma preparação da fonte, sem comprovar fluxo real após o início da votação.

Os parsers atuais aceitaram o EA20 BR e o catálogo EA12 reais. A normalização nacional preservou `totalized_at=null`, zero seções totalizadas e finalização falsa; o catálogo produziu 5.572 unidades, incluindo o agregado Exterior e 28 abrangências. Não foram registrados nomes, identificadores pessoais ou payloads completos nesta documentação.

Não foram consultados municípios individualmente, acompanhamento UF, JWS ou resultados após 17h do dia eleitoral. Esses caminhos continuam cobertos por testes locais sintéticos, sem equivaler a validação integral da noite de apuração. Nenhum bug reproduzível de parsing foi encontrado nos dois arquivos efetivamente exercitados.

## Correspondência geográfica verificada

O catálogo EA12 atual contém `cdi` (sete dígitos IBGE), `cd` (cinco dígitos TSE), `nm`, `c` e `z` em seus registros municipais. O parser `parse_catalog` já preserva `cdi` em `ibge_code`. A ligação com o GeoJSON deve priorizar os códigos; nomes divergentes não exigem comparação aproximada. A tabela abaixo foi extraída por igualdade exata de `cdi` no [EA12 oficial de 6258](https://resultados.tse.jus.br/oficial/ele2026/6258/config/mun-e006258-cm.json), para treze casos sem correspondência estrita de nome no acervo geográfico local:

| Código IBGE | UF  | Código TSE | Nome informado pelo TSE   |
| ----------- | --- | ---------- | ------------------------- |
| 3105509     | MG  | 41092      | BARÃO DE MONTE ALTO       |
| 3122900     | MG  | 44571      | DONA EUSÉBIA              |
| 3165206     | MG  | 53031      | SÃO THOMÉ DAS LETRAS      |
| 1400605     | RR  | 03158      | SÃO LUIZ                  |
| 4116307     | PR  | 77119      | MUNHOZ DE MELLO           |
| 5107800     | MT  | 91553      | SANTO ANTÔNIO DO LEVERGER |
| 1502954     | PA  | 04120      | ELDORADO DOS CARAJÁS      |
| 1100098     | RO  | 00256      | ESPIGÃO DO OESTE          |
| 1100346     | RO  | 00337      | ALVORADA DO OESTE         |
| 3550001     | SP  | 71013      | SÃO LUÍS DO PARAITINGA    |
| 2800100     | SE  | 31011      | AMPARO DE SÃO FRANCISCO   |
| 5203500     | GO  | 92690      | BOM JESUS                 |
| 2405306     | RN  | 17035      | BOA SAÚDE                 |

Os treze códigos IBGE solicitados estavam presentes, sem ausências. Conserve zeros iniciais dos códigos TSE. A revisão do nome no mapa é independente da identidade geográfica estabelecida pelo código oficial; não altere o código para aproximar a grafia.

### Manifesto do mapa municipal gerado

O arquivo `apps/web/src/integration/municipality-ids.json` contém o mapa completo `{ "codigo_ibge": "UF:codigo_tse" }`, com 5.571 identidades municipais e sem o agregado Exterior. A derivação usa somente `cdi`, `cd` e a UF do catálogo oficial; valida sete dígitos IBGE, cinco dígitos TSE e unicidade dos dois lados. A serialização compacta, com chaves ordenadas e quebra de linha final, mantém o recurso gerado em uma linha física; ele é dado estático, sem funções ou lógica de correspondência por nomes.

| Campo                            | Valor                                                                           |
| -------------------------------- | ------------------------------------------------------------------------------- |
| Fonte                            | `https://resultados.tse.jus.br/oficial/ele2026/6258/config/mun-e006258-cm.json` |
| Data da consulta                 | 24/10/2026                                                                      |
| Geração informada pela fonte     | 15/10/2026 09:38:00                                                             |
| `idg` da fonte                   | `3531598`                                                                       |
| SHA-256 dos bytes JSON recebidos | `e4a2f2d45bac325f486e1866973fd65ae86744896d0f19e791b0bbb58d86e839`              |
| SHA-256 do mapa derivado         | `60cd4d90de46dc504eaf2a4417bb2c35f5d8db38cbd395fa8b0bf7d0d007248d`              |
| Tamanho do mapa derivado         | 116.993 bytes                                                                   |

O hash identifica exatamente a versão consultada e a transformação versionada; não representa verificação JWS. Uma atualização legítima do catálogo exige regenerar os dados e renovar este manifesto. As 5.571 identidades do mapa coincidem exatamente com as unidades municipais do cadastro local, sem ausências ou identidades adicionais.
