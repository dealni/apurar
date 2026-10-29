# Governadores com o design e o fluxo de Presidente

Ajuste local de 25/10/2026 solicitado pelo proprietário. Cinco novos agentes foram divididos entre estrutura, painéis, estilos, testes e revisão independente. As alterações locais das revisões anteriores foram preservadas. Não houve commit, push ou deploy.

## Componentes reaproveitados

- `Ul`: mesmo cabeçalho, marca, menu, busca, seletor de cargo e ações de tela cheia. Governadores fornece seu próprio status e exportação PNG.
- `SourceBarFrame`: invólucro da fonte com medição compartilhada de altura; a fonte de Governadores vem exclusivamente do suplemento e do mesmo modelo validado usado pelo painel.
- `FaixaDisputa`: faixa horizontal extraída do placar presidencial e usada pelos dois cargos. Na visão Brasil, Governadores mostra as UFs com disputa e os acessos correspondentes, sem somar votos de eleições diferentes.
- `CandidaturasDuelo`: retratos, nomes, partidos, votos e percentuais dos dois cargos. A quarta linha de destinação é opcional e não altera as três linhas do placar presidencial.
- `wr`, `Ci` e `Xs`: progresso, barra comparativa e indicadores já utilizados na apresentação presidencial. Seções restantes não são convertidas em eleitores restantes.
- `layoutDoPainel`, breadcrumb, seletor de cargo, mapa interativo e abas: mesmos critérios de viewport e navegação. A classe de rolagem tem um único responsável ao trocar de cargo.

## Fluxo e dados

Desktop exibe o placar horizontal acima do mapa e dos cartões. Celular em retrato segue a sequência vertical do Presidente, com resultado, mapa e consultas; a troca de recorte retorna ao início. Tablet utiliza o mapa em largura completa; paisagem e tela cheia preservam o espaço e o recorte. O modo `shell` continua disponível com as abas existentes.

Brasil → UF → município, busca, retorno ao estado, troca de cargo, tela cheia e exportação preservam o contexto. A neutralidade visual do mapa usa a paleta escura compartilhada com Presidente, mantendo intactas as cores e as observações de cada disputa.

Votos, seções, totais e horários permanecem próprios de cada local. Uma candidatura publicada isoladamente conserva suas contagens conhecidas, sem inventar comparação. Dados anteriores permanecem identificados e sem liderança ou percentuais atuais. Zeros oficiais e eleitorado conhecido antes da primeira totalização não são apagados pela ausência de `as_of`; o horário continua explicitamente indisponível. Ausência, divulgação retida, empate e zero são estados distintos. Não foram adicionados projeção, histórico ou resultado nacional de governadores.

## Evidências e validação

Capturas controladas de Presidente e Governadores em 390, 768 e 1440 px estão em `Developer/output/apurar-governadores-paridade-2026-10-25`, com prefixo `final-`. São fixtures locais, não uma apuração real. A aceitação também verifica 320 px e o modo de abas configurado.

A revisão independente conferiu reutilização real, apresentação, acessibilidade e preservação dos dados. Após seus apontamentos, foram corrigidos votos de candidatura incompleta, largura do mapa no tablet e sobreposição entre votos e destinação.

Validação integrada final: `npm run check:ci-local` aprovado, com dependências, licenças, procedência, geografia, limites, TypeScript, formatação e build. A suíte aprovou 92 testes de qualidade, 219 testes Vitest em 37 arquivos, 301 testes Python e 282 testes de navegador, totalizando **894 testes aprovados**. Quatro testes de navegador foram ignorados pelas condições já existentes de desktop/mobile. `git diff --check` também passou.

A nova spec de paridade contém 28 testes entre desktop e celular. A bateria independente cobriu 72 cenários e mais dois casos de pré-contagem; essas contagens se sobrepõem à suíte integrada e não são somadas novamente ao total. O revisor aprovou o estado final sem pendências.

As mudanças precisam de pedidos específicos de commit, push e publicação para chegar à produção. O build mantém o aviso anterior de chunks acima de 500 kB.
