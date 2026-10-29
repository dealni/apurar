# Operação, publicação e recuperação

Primeiro deploy realizado em 24/10/2026. A versão publicada inicialmente é `821dae94192665de0501d6b3cf581b13c49f51c8`; Worker versão `90cc2f7d-31cd-42ad-8be1-3af71edec5e7`. O coletor está em `/opt/apurar/releases/<sha>`, com link `/opt/apurar/current`, estado `/var/lib/apurar/state` e saída `/var/lib/apurar/public`. Site: `https://<worker>.<conta>.workers.dev`, projeção em `/apurar/`. Cada release posterior precisa de autorização e recibo próprios. Commit, push e deploy são autorizações separadas. Não ligar Workers Builds/deploy automático ao repositório sem pedido específico.

## Isolamento

VPS apps: alias `vps-apps`, host esperado `srv924325`. Antes de qualquer mudança autorizada, confirmar identidade com `ssh -o BatchMode=yes -o ConnectTimeout=10 vps-apps hostname`. Preservar verificação de known_hosts e nunca imprimir chaves. Criar usuário de serviço exclusivo `apurar`, diretório `/opt/apurar`, estado `/var/lib/apurar` e arquivo de ambiente `/etc/apurar/collector.env` com acesso restrito. Não reutilizar bancos, serviços ou credenciais dos outros aplicativos.

Python recebe somente a porta de saída necessária; não existe API pública na VPS. Publicação utiliza credencial S3/R2 limitada ao bucket do produto. O Worker recebe binding R2 e serve operações de leitura. Nenhuma credencial vai ao bundle web. Definir retenção antes de ativar coleta contínua; tamanho de acervo e logs deve ser medido.

## Antes de cada deploy

1. Executar gates e ensaio local completo; registrar SHA, lock e hashes dos dados.
2. Conferir ambiente oficial, eleição 6258 e candidatos correntes nas fontes TSE. Distinguir pleito 3221 de ID da eleição.
3. Conferir conta Cloudflare, nome do bucket e eventual domínio. Sem criar recursos cobrados por inferência.
4. Confirmar capacidade e limites de memória/CPU/disco da VPS em coexistência com os aplicativos atuais.
5. Configurar diretórios, credenciais e serviço dedicado. A unidade de serviço só deve ser atualizada depois de validar o comando da versão efetiva do coletor. Não iniciar outro escritor durante a troca de release.
6. Rodar coleta e comparar snapshots com os resultados oficiais antes de expor o feed público.
7. Publicar frontend/Worker com versão identificada e sem caminhos privados. Conferir headers, hash e frescor pelo domínio final.

## Publicação de dados

Uma rodada escreve arquivos brutos e estado local; calcula quando os insumos materiais mudam; publica snapshots/municípios/histórico imutáveis; confere leitura e hashes; finalmente substitui `latest.json`. O identificador do snapshot deve acompanhar detalhes. Os clientes começam por `/api/manifest`, que fixa `snapshot_id` e URLs SHA-256 imutáveis para snapshot, municípios e histórico; só aplicam o lote depois de validar todos os objetos. O cache curto do manifesto pode entregar um lote anterior completo, sem misturar versões. Os endpoints mutáveis legados permanecem compatíveis. Nunca compor a página com municípios de um lote e Brasil de outro. Publicação incompleta conserva o ponteiro anterior.

Não iniciar dois escritores para a mesma eleição. Em 403/429 respeitar pausa compartilhada configurada e `Retry-After`. A revisão local usa pausa mínima de 600s, autorizada pelo usuário após conferir o bloqueio de dez minutos documentado pelo TSE; o saldo é preservado após reinício para evitar tentativas antecipadas. Repetidos 404 podem causar bloqueio: validar caminhos e códigos municipais de cinco dígitos. Uma falha de projeção não deve inutilizar os votos oficiais.

## Observação e resposta

Medir separadamente horário da fonte, coleta, publicação e resposta HTTP. Uma resposta HTTP 200 não prova dado recente. A interface deve sinalizar atraso e conservar último snapshot válido; zero votos precisa ser explícito na fonte, não inferido de erro. Vigiar falhas de coleta, tentativas de upload, falta de espaço e crescimento do estado. Consulte `HISTORICO-E-RETENCAO.md`: deduplicação material evita novos objetos por polling idêntico, histórico integral permanece em SQLite e há comando somente leitura para revisar objetos locais antigos. Nenhuma exclusão automática ou política remota foi ativada. Não habilitar logs HTTP pagos ou armazenamento externo por inferência.

Não afirmar suporte a um número de usuários sem ensaio. Com polling de 15s, cada aba pode gerar 240 consultas/hora por endpoint. Cache reduz acesso ao R2, mas o Worker continua sujeito a invocações e limites do plano. Validar custo e granularidade antes de alta audiência.

## Recuperação

- Fonte indisponível: preservar último snapshot e idade original; respeitar backoff.
- Upload parcial: não mover ponteiro; repetir somente publicação idempotente após diagnosticar.
- Snapshot inválido: leitor recusa com 503 e navegador preserva o último aceito.
- Retotalização: conservar resposta bruta e registrar versão; redução de votos não é automaticamente corrupção.
- Falha do processo: parar escritor, inspecionar estado, reiniciar uma única instância e reconciliar antes de publicar.
- Rollback de dados: selecionar conjunto anterior íntegro e confirmar todos os objetos antes de reescrever o ponteiro. O horário continua antigo e visível.
- Rollback do código: usar a versão confirmada anterior do Worker e do coletor; preservar compatibilidade de contrato.
- Restore: reconstruir em diretório isolado e comparar hashes/contagens; existência de backup não comprova restauração.

## Limites de evidência

O primeiro deploy verificou permissões reais, serviço e publicação VPS → R2 → Worker → navegador, em pré-apuração. Os testes locais das correções não substituem nova verificação da release publicada e não demonstram comportamento do TSE durante o evento. A conferência de assinatura JWS precisa seguir o manual específico antes de afirmar autenticidade criptográfica. O modelo experimental não dispõe de probabilidade de vitória ou intervalo calibrado.

## Release reproduzível

A configuração versionada do Wrangler está alinhada ao destino inicial: `workers_dev: true`, `preview_urls: false`, observabilidade desativada e bucket `apurar-snapshots`. Não depende mais do override ignorado usado no primeiro deploy. A conta e o token são fornecidos pelo ambiente externo; nunca versionar valores. `npm run build` compila, e `npm exec --offline -- wrangler deploy --dry-run --outdir .artifacts/worker-dry-run` prepara o pacote sem publicar. O comando sem `--dry-run`, transferência para VPS e reinício de serviço são deploy e exigem pedido específico. Não configurar publicação automática em hooks.

A release deve registrar SHA do Git, hash do lock e das bases e versão do Worker. O primeiro recibo e verificações estão fora do Git em `Developer/output/deploy-apurar-2026-10-24/`. Não reutilizar o marcador antigo para um build corrigido. Instalar o novo código/venv em diretório de release, validar sob usuário `apurar`, parar o escritor, trocar o link `current` e reiniciar a instância única; preservar estado e compatibilidade. Rollback de código não reescreve automaticamente dados.

O token do publicador é restrito a objetos do bucket e expira em 22/01/2027. O arquivo `/etc/apurar/collector.env` deve continuar root:root 0600. Não registrar valores de credenciais em relatórios. Limites de recurso do modelo systemd estão alinhados ao primeiro deploy: MemoryHigh 512M, MemoryMax 768M, CPUQuota 100%, TasksMax 64. Não modificar serviços dos outros aplicativos.

## Política local de atualização e saúde

O arquivo `services/collector/resources/timing.json` é necessário na release do coletor e centraliza os tempos de Python e web. A revisão local define 600s para 403/429 e preserva espera de dez minutos para 404 e headers `Retry-After` maiores. O perfil operacional usa 70 requisições/s compartilhadas, sem rajadas, e até oito consultas em voo; o teto oficial é 100/s por IP. A varredura das UFs agora tem prazo próprio de 45s após a anterior, em vez de uma UF por ciclo.

O manifesto inclui saúde operacional validada de um objeto mutável separado; se ausente ou inválida, mantém os votos e informa indisponibilidade da saúde. Cada ciclo atualiza a saúde, inclusive em falha da coleta. Upload de saúde pode falhar: a interface detecta envelhecimento pelo horário original. Campo `checked_at` mede o ciclo e `last_success_at` a consulta nacional; não representam novidade eleitoral, sucesso de todos os municípios ou garantia de publicação do último lote.

Navegador usa 15s visível/60s oculto, consulta ao retornar e não baixa novamente os três objetos de um lote já aceito. O cache de dez segundos permanece. Não há provisionamento, alteração da unidade systemd, deploy nem instalação automática por estas mudanças.

## Ampliação do segundo turno

Além do núcleo presidencial, o CLI coleta governadores de 6260 e dados oficiais do exterior, compartilhando o cliente e o limitador de 70 requisições/s. O placar é publicado antes desse trabalho adicional; falha suplementar tem saúde própria e não retém o nacional. `--without-supplemental` permite operar o núcleo isolado; `--supplemental-budget` limita o trabalho adicional; `--zone-budget` foi removido. A política local admite até 128 detalhes por ciclo, sem consultas zonais, com oito consultas em voo e janela suplementar de admissão de 15s. O núcleo começa com 256 municípios e adapta o lote até 512, sob janela de admissão de 8s. Filas adicionais usam pausa de 2s, sem abreviar bloqueios. Consulte `COLETA-RAPIDA.md` para o que foi medido offline.

Os alvos ativos são seis UFs governadoras, 469 municípios estaduais e 186 cidades exteriores. Os registros zonais do catálogo são ignorados. Bootstrap e revalidação não concluem tudo num único ciclo. A cobertura e o horário próprio de cada resultado devem ser observados. O estado antigo é migrado sem retomar filas zonais; dados imutáveis de publicações anteriores permanecem preservados.

O arquivo integral é independente, com SQLite e objetos imutáveis. Uma falha do índice não bloqueia voto, é retentada em consultas idênticas e aparece no diagnóstico. A recuperação valida todas as referências conservadas, incluindo fora da amostra pública.

Para alertas autorizados pelo DealniBot, instalar os modelos `infra/systemd/apurar-alerts.service`/`.timer` e preencher ambiente externo com token do bot e destinatário escolhido. O exemplo contém somente caminhos e limites; credenciais não entram no Git. A implementação deduplica falhas, envia recuperação após melhora e confirma estado somente após Telegram `ok:true`. A ativação é explícita no deploy: conferir timer habilitado, execução do diagnóstico e confirmação de entrega pelo Telegram. O timer verifica a operação a cada 60s, deduplica a mesma falha e envia recuperação; silêncio sem mudança é esperado.
