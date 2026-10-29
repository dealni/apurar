# Arquivo oficial de publicações confirmadas

O arquivo registra referências imutáveis dos lotes presidencial e suplementar depois de sua publicação confirmada. Ele começa na ativação desta funcionalidade; não reconstitui cortes antigos que não foram preservados.

- `publication-archive.sqlite3`: todas as referências confirmadas, sem truncamento automático.
- `live/6258/archive/<sha>.json`: índice público por conteúdo, com até 500 observações distribuídas ao longo do acervo e início/fim preservados.
- `live/6258/archive-latest.json`: ponteiro substituído somente após conferir o objeto.
- `/api/archive`: índice validado pelo Worker; `/api/archive/<sha>` identifica uma versão imutável.
- `archive-status.json`: diagnóstico independente; falhas são retentadas mesmo sem mudança eleitoral e não retêm os votos oficiais.

A interface **Arquivo oficial** permite selecionar uma observação, consultar resultados municipais, governadores e exterior e exportar CSV/JSON. O recorte permanece fixo enquanto chegam novas publicações. Horário da fonte não é substituído pelo horário de coleta; suplemento sem observação tem fonte indisponível explícita. País parcial informa sua cobertura.

A amostra pública não é o acervo integral. O total de observações e a indicação de amostragem acompanham o índice. O ensaio de recuperação valida tanto as referências públicas quanto todas as conservadas no SQLite, sem rede ou publicação. Nenhuma exclusão automática foi ativada.

Os dados são resultados oficiais preservados, com projeção presidencial separada quando existente. Não há projeção para governador ou cidades do exterior. A consulta não demonstra precisão eleitoral do modelo experimental.

A remoção local das zonas filtra esses registros também de observações antigas nas listas e exportações da interface. Os objetos imutáveis e seus hashes são preservados para integridade e recuperação; não são reescritos ou apagados.
