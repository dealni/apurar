# Revisão da lógica eleitoral e do coletor

Revisão realizada em 24/10/2026, somente leitura na origem `Aplicativos/apuracao`. A origem não possui repositório Git. Este documento não significa validação em produção nem confirmação dos endpoints atuais do TSE.

## Validação executada

- Comando: `python3 -B -m unittest discover -q`, na origem.
- Resultado: **114 testes aprovados em 25,854 segundos**.
- Não foram executados o gate completo `tools/check.py`, a verificação integral do acervo, ensaio de carga público ou novas consultas ao TSE.
- Nenhum código, cache ou arquivo de dados da origem foi alterado nesta revisão.

## Núcleo reaproveitável

| Origem                           | Responsabilidade e avaliação                                                                                                                                                                    |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `app/tse.py`                     | Cliente oficial, validação de eleição/ambiente/abrangência, redirects restritos, cache condicional, quota compartilhada, espera após 403/429, limite de resposta e rejeição de versões antigas. |
| `app/collector.py`               | Coleta incremental nacional/municipal, oito workers, lotes limitados, pistas EA15, correções oficiais com redução de votos, cancelamento e progresso.                                           |
| `app/runoff.py`, `app/engine.py` | Projeção municipal com atualização nacional e estadual; preserva os votos já observados.                                                                                                        |
| `app/runoff_integrity.py`        | Contrato e hashes do prior do segundo turno, com proveniência exclusiva no primeiro turno de 2026.                                                                                              |
| `app/service.py`                 | Conciliação municipal/nacional, suspensão diante de inconsistência e substituição da projeção pelo resultado final oficial.                                                                     |
| `app/presentation.py`            | JSON com campos separados para oficial e projetado, timestamps e cobertura.                                                                                                                     |
| `tests/`                         | Conservação, causalidade, integridade, isolamento, cache, correções e falhas de rede.                                                                                                           |

## Metodologia vigente

O prior do segundo turno usa exclusivamente o resultado municipal completo do primeiro turno de 2026. A votação é renormalizada entre os dois finalistas e aplicada à massa de votos válidos municipal. A taxa inicial por seção também vem desse primeiro turno. Os resultados recebidos atualizam perfis nacional, estadual e municipal; somente as seções restantes são estimadas.

Os parâmetros atuais são 20 seções de referência local, regularização nacional de 1.000 seções e estadual de 500. Não houve seleção ou alteração desses parâmetros nesta revisão.

A renormalização não identifica transferências individuais. Comparecimento, votos inválidos e perfis das seções ainda ausentes podem diferir da base inicial. O sistema não possui probabilidade de vitória nem intervalo de confiança calibrado. Deve manter indicação experimental, separar oficial/projetado e identificar estimativa anterior aos primeiros votos.

O bloqueio por divergência municipal/nacional superior a 3% é critério operacional de consistência, não margem estatística. Há proteção adicional que suspende a projeção se ficar abaixo da votação nacional já contada de algum candidato.

## Achados e prioridades

| Prioridade | Achado                                                                                                            | Ação necessária no Apurar                                                                                                                                               |
| ---------- | ----------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| P0         | Cargo presidencial, eleição 6258 e candidatos 13/22 estão fixos em contratos, prior e testes.                     | Declarar o MVP presidencial e confirmar os identificadores em fonte oficial. Governadores exigem configuração, prior e testes por disputa; filtro de UF é insuficiente. |
| P0         | `app/server.py` aceita localhost/Host local, usa `ThreadingHTTPServer` e envia `Cache-Control: no-store`.         | Preservar como ferramenta local; não promover diretamente a servidor público.                                                                                           |
| P0         | Snapshot recalcula o motor por solicitação; detalhes municipais podem fazer consultas ao TSE.                     | Calcular por versão recebida e publicar JSON pronto. A navegação pública deve consumir apenas snapshots.                                                                |
| P0         | Municípios e Brasil podem representar instantes diferentes.                                                       | Publicar lote identificado por `snapshot_id`, versão do modelo, horários mínimo/máximo e gaps. Atualizar `latest` somente após concluir todos os objetos do lote.       |
| P1         | `app/multi.py` inicia os dois turnos simultaneamente.                                                             | Processo produtivo deve coletar só o segundo; primeiro fica como base congelada.                                                                                        |
| P1         | Serviço do segundo turno também depende do replay e do prior de 2022 na inicialização.                            | Separar execução headless, dados mínimos do segundo turno e ferramentas de replay/acervo.                                                                               |
| P1         | `data/` ocupa aproximadamente 1,5 GB; `estudos/`, 416 MB. Há SQLite e WAL/SHM vivos.                              | Git contém código, testes, documentação e manifestos. Excluir caches, dados operacionais e grandes acervos. Distribuir dados verificados separadamente.                 |
| P1         | Testes de estresse usam chegadas simuladas; avaliação geográfica de 2022 corresponde a versão anterior do modelo. | Não chamar esses resultados de backtest temporal/acurácia do modelo atual. Construir avaliação por prefixos reais, com erro em pontos percentuais e cobertura.          |
| P2         | Relatórios antigos descrevem ajuste de 2022 que foi retirado; constantes de experimentos continuam presentes.     | Distinguir metodologia vigente e evidência histórica; não usar relatórios antigos como especificação do runtime novo.                                                   |

## Arquitetura recomendada

```text
TSE
  → coletor Python único na VPS Apps
  → conciliação + projeção + SQLite
  → publicador autenticado
  → Cloudflare R2
  → Worker/CDN
  → frontend
```

Hospedar o frontend como assets estáticos no Cloudflare. O Worker entrega resultados, municípios e exportações por leitura dos snapshots, sem acessar diretamente o TSE nem disparar trabalho no coletor.

Publicar JSON compacto, com particionamento por UF quando necessário, e polling condicional com ETag. SSE/Durable Objects ficam condicionados a necessidade demonstrada. O tráfego público não deve aumentar a quota de consulta à fonte oficial.

Em falha da VPS, publicação ou fonte, conservar o último lote válido e indicar atraso com base no timestamp original. Cache antigo não pode receber rótulo de coleta recente. SQLite fica na VPS; o público recebe somente dados explicitamente publicados.

## Plano de integração e pendências

1. Confirmar em fonte oficial eleição, cargo, candidatos, estrutura territorial e endpoints; registrar evidência e data.
2. Congelar contrato do MVP presidencial e os estados de espera, coleta, inconsistência, atraso e encerramento.
3. Migrar núcleo Python e testes sem copiar cache/acervo inteiro; extrair runner headless do serviço local.
4. Gerar snapshots determinísticos com esquema versionado, proveniência, integridade e publicação em lote.
5. Integrar frontend inspirado em `acervo público de terceiros` ao contrato, preservando distinção entre oficial e projetado.
6. Implementar publicador autenticado e leitura pública por R2/Worker/CDN.
7. Validar replay completo e cenário de correções; ensaiar falha de rede, lote incompleto, restart, dados atrasados e carga de leitura.
8. Preparar observabilidade, runbook e serviço systemd. Instalação/alterações na VPS e publicação Cloudflare dependem da autorização específica de deploy.

Pendências estatísticas: realizar backtest temporal do modelo vigente, caracterizar erro por cobertura e viés territorial, documentar os limites da renormalização e avaliar qualquer intervalo antes de apresentá-lo. Os 114 testes aprovados demonstram propriedades e contratos, não acurácia eleitoral futura.
