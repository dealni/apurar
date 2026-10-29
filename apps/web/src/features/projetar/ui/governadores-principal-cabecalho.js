import { html } from "./formatacao-e-acessibilidade-1.js";
import { Ul } from "./navegacao-e-patrocinio-1.js";
import { exportarGovernadores } from "./governadores-principal-exportacao.js";
export function CabecalhoGovernadores({
  estado,
  model,
  selected,
  focus,
  town,
  governor,
  setNotice,
  loading,
  payload,
  error,
  mobile,
}) {
  const status = statusGovernadores({ selected, loading, payload, error });
  return html`<${Ul}
    m=${model}
    t=${estado.s}
    live=${true}
    office="gov"
    setOffice=${estado.go}
    onTV=${estado.Vs}
    onExit=${estado.On}
    onSearch=${() => estado.w(true)}
    onAbroad=${() => estado.De("pres", "ZZ")}
    onShare=${async () => {
      try {
        await exportarGovernadores({ selected, focus, town, governor });
        setNotice("Download da imagem iniciado.");
      } catch {
        setNotice("Não foi possível exportar a imagem. Tente novamente.");
      }
    }}
    shareLabel="Compartilhar"
    tv=${estado.g}
    phone=${mobile}
    apurTop=${false}
    connectionStatus=${false}
    headerClass="gov-header"
    statusClass="gov-actions"
    sourceStatus=${html`<span
      class=${"live gov-source" + (error ? " warn" : loading && !payload ? " wait" : "")}
      role="status"
      title=${status}
      ><i aria-hidden="true"></i><span class="lt tn">${status}</span></span
    >`}
  />`;
}

export function statusGovernadores({ selected, loading, payload, error }) {
  const source = selected?.asOf;
  const status = error
    ? payload
      ? "Falha de conexão · último resultado preservado"
      : "Falha de conexão · resultados oficiais indisponíveis"
    : loading && !payload
      ? "Conectando aos resultados…"
      : source
        ? "Fonte TSE · " +
          new Date(source).toLocaleString("pt-BR", {
            timeZone: "America/Sao_Paulo",
          }) +
          " · Brasília"
        : "Fonte TSE · horários por local";
  return status;
}
