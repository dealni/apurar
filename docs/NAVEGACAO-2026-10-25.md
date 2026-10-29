# Navegação — 25/10/2026

## Entrada e mapa principal

A raiz abre diretamente o painel de apuração, sem página de escolha. O menu “Explore o Apurar” oferece Apuração e Primeiro turno nos dois painéis. Sem JavaScript, o conteúdo inicial informa como habilitá-lo e mantém um link para o primeiro turno.

| Opção          | Endereço   |
| -------------- | ---------- |
| Apuração       | `/`        |
| Primeiro turno | `/1turno/` |

Presidente, governadores e exterior compartilham o mapa principal. A seleção geográfica é representada no hash, incluindo `#governadores-ac`, municípios e `#presidente-zz`. Não há entradas separadas nem diálogos de consulta para governadores e exterior.

Arquivo oficial, demonstração e versão simples foram removidos da interface. A rota `/simples/` não é uma entrada do build. Os serviços, contratos e publicações do arquivo no backend permanecem preservados para rastreabilidade.

## Endereços antigos

O frontend remove `demo` e `painel` da URL antes de iniciar a aplicação. `?painel=governadores` seleciona governadores no mapa principal e preserva UF/município quando compatíveis. `?painel=exterior` seleciona o exterior. `?painel=arquivo` apenas limpa o parâmetro, sem abrir interface. Nenhum parâmetro ativa dados sintéticos. A raiz e o endereço compatível `/apurar/` aplicam a mesma normalização diretamente, preservando a seleção geográfica.

## Interação e acessibilidade

O menu usa diálogo nativo, identifica a área atual e devolve o foco ao botão ao fechar. Escape fecha o diálogo sem alterar a seleção. Busca, zoom e histórico respeitam campos e diálogos abertos nas duas interfaces de mapa.

O primeiro turno mantém os quatro cargos e a identificação explícita de dados arquivados. Os dados históricos e as comparações com 2022 são preservados. Governadores usam os resultados oficiais do suplemento, sem projeção; a projeção experimental permanece presidencial.

## Validação e publicação

A verificação desta alteração deve ser registrada no relatório integrado da tarefa. Resultados de revisões anteriores não comprovam o comportamento deste novo escopo. Vite sozinho não executa a API do Worker. Commit, push e deploy continuam exigindo autorização própria.
