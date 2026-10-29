# Revisão complementar do Apurar — 25/10/2026

Revisão geral local autorizada pelo proprietário, com quatro agentes nas áreas de interface, integração, API/contratos e coletor, além da integração final. O checkout estava limpo no início. Não houve commit, push, deploy, operação remota ou envio de mensagens.

## Correções

- **Navegação:** acessos diretos a `/index.html`, `/apurar/index.html` e `/1turno/index.html` agora identificam corretamente a página atual no menu. Regressão em Chrome desktop e celular.
- **Mapa presidencial do exterior:** códigos TSE duplicados, cargo/eleição/UF incompatíveis e candidaturas extras mantêm o local neutro, evitando cores baseadas em dados ambíguos. Três duplicatas consecutivas também permanecem neutras.
- **Diagnóstico da coleta:** uma última consulta bem-sucedida mais de 60 segundos no futuro não anuncia coleta ativa. A tolerância de relógio permanece preservada.
- **Proveniência:** falhas ao escrever ou renomear uma captura bruta deixam sua gravação pendente. A próxima consulta retoma a captura mesmo com resposta HTTP 304, inclusive se já existia uma versão anterior gravada.
- **Cronologia oficial:** o núcleo presidencial recusa totalização posterior à geração oficial, impedindo a entrada de resultados com horários contraditórios. Não houve alteração dos parâmetros matemáticos do modelo.

A revisão da interface também cobriu busca, foco e isolamento de diálogos, atalhos, navegação histórica, governadores, exterior, municípios, tela cheia e PNG. A exportação com mapa local conserva o resumo nacional identificado como Brasil. Não foi encontrada justificativa para alterar essa semântica. As capturas de desktop e celular da suíte foram inspecionadas visualmente.

## Validação integrada

`npm run check:ci-local` concluiu com sucesso sobre as correções finais:

| Verificação                                              | Resultado                                                   |
| -------------------------------------------------------- | ----------------------------------------------------------- |
| Dependências, licenças, procedência, geografia e limites | Aprovados                                                   |
| TypeScript e Prettier                                    | Aprovados                                                   |
| Testes dos gates de qualidade                            | 92 aprovados                                                |
| Vitest: contratos, Worker e integração                   | 205 aprovados em 34 arquivos                                |
| Coletor Python                                           | 277 aprovados                                               |
| Chrome desktop/celular                                   | 244 aprovados; 4 ignorados por condições previstas da suíte |
| Build                                                    | Aprovado                                                    |
| Total de testes aprovados                                | 818                                                         |
| `git diff --check`                                       | Aprovado                                                    |

As baterias focadas dos agentes complementam essa validação; suas contagens não são somadas novamente ao total integrado. Dois casos ignorados verificam controles exclusivos de desktop quando executados no projeto mobile; os outros dois verificam PNG e legenda compacta exclusivos de mobile quando executados no projeto desktop.

## Limites

Os testes usam fixtures e simulações locais. Não demonstram precisão eleitoral, disponibilidade real do TSE, publicação no R2 ou a versão efetiva em produção. O build continua com o aviso já existente de chunks acima de 500 kB. Não houve teste de carga remoto, coleta eleitoral externa, envio Telegram ou reinício de serviço. CI remoto não foi utilizado como evidência.
