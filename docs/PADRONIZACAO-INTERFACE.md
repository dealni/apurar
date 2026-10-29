# Padronização da interface

A interface do primeiro turno originou a base do painel atual. Governadores agora reutiliza o design e os componentes do painel de Presidente: cabeçalho e fonte comuns, faixa de resultado no desktop, duelo de candidaturas e cartões. No celular em retrato, segue a leitura contínua do Presidente; quando o modo `shell` está configurado, mantém as abas Mapa, Explorar e Resultados. Tablet, paisagem e tela cheia respeitam a mesma classificação de layout. Veja a [paridade com Presidente](GOVERNADORES-PARIDADE-PRESIDENTE-2026-10-25.md).

## Comportamento

- Governadores mantém estado e município no mapa principal, com fonte, candidaturas, cores e totais da própria disputa. A lista não anuncia liderança em empate ou ausência de votos.
- Exterior mantém países e cidades no mesmo painel. Os resultados funcionam independentemente da disponibilidade do feed presidencial nacional e explicitam cobertura parcial.
- Tela cheia preserva o recorte de governadores/exterior. Ao sair, libera o bloqueio de suspensão da tela, inclusive quando a solicitação resolve tardiamente.
- Histórico e projeção continuam exclusivos dos recortes que possuem esses dados. O atalho de replay não inicia consultas presidenciais em governadores/exterior.
- Exportações não apresentam resumo presidencial nacional sobre mapas de outros cargos ou do exterior.
- Os painéis históricos e atual mostram conteúdo inicial estático com opção de recarregar quando o JavaScript não carrega.

A padronização modifica a apresentação e o comportamento da interface; os contratos de coleta e o cálculo das projeções permanecem preservados. Ausência de dados continua distinta de zero e o horário exibido é o da fonte.

## Revisão geral complementar

A revisão seguinte de 25/10/2026 estendeu ao Exterior o cabeçalho, a barra da fonte, o duelo de candidaturas, o progresso e os indicadores compartilhados, além da classificação comum de fluxo, abas, tablet, paisagem e tela cheia. Os filtros de Governadores e Exterior usam os mesmos tokens e estados de foco. O arquivo do primeiro turno ganhou uma barra superior de contexto, sem sobrepor os controles inferiores.

PNG de Governadores e Exterior usam o mesmo exportador, congelando o mapa e os metadados do recorte antes de aguardar fontes. Contagens preservadas, cobertura parcial e ausência de percentual são mantidas na imagem. A busca por Ctrl/⌘K funciona sobre ações simples e continua respeitando editores e diálogos. Candidatura isolada conserva votos conhecidos sem inferir 100%.

Detalhes e evidências da rodada estão em [revisão geral da padronização](PADRONIZACAO-REVISAO-GERAL-2026-10-25.md).

## Verificação

Foram usados 12 agentes Sol 6.1 com esforço médio, divididos entre implementação, revisão visual, acessibilidade, arquitetura e testes. As capturas locais usam dados controlados para verificar estados e fontes independentes; não representam uma apuração real.

Evidências da rodada em `Developer/output/apurar-padronizacao-2026-10-25`. As mudanças aguardam autorização específica para commit, push e publicação.
