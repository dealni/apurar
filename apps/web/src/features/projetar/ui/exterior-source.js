export function statusExterior({ error, loading, payload }) {
  if (error)
    return payload
      ? "Falha de conexão · últimos resultados preservados"
      : "Falha de conexão · resultados oficiais indisponíveis";
  if (loading && !payload) return "Carregando fonte oficial";
  return "Fonte TSE · cada local informa seu horário";
}
