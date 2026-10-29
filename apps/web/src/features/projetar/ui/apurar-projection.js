import { html, yt, _t, kt } from "./formatacao-e-acessibilidade-1.js";
import { Feed } from "../feed.js";
export function renderApurarProjection(projection, leaders, reason) {
  const source = Feed.sourceSnapshot?.();
  const value = projection;
  const official =
    source?.mode === "live" && !!value && value.model === "official_final";
  const preCount = !official && value?.pre_count === true;
  if (preCount)
    return html`<section class="apurar-projection" aria-label="Projeção Apurar">
      <h3>Projeção Apurar</h3>
      <p class="note">Aguardando o início da apuração.</p>
    </section>`;
  const title = official
    ? "Resultado final oficial"
    : "Projeção Apurar · experimental";
  const demo = source?.mode === "demo";
  return html`<section
    class="apurar-projection"
    aria-label=${official ? title : "Projeção Apurar"}
  >
    <h3>${demo ? "Demonstração · dados fictícios" : title}</h3>
    ${value ? leaders.map((candidate) => html`<div class="pj-row" key=${candidate.id}><span style=${"color:" + kt(candidate)}>${yt(candidate)}</span><strong class="tn">${_t(value.by[+candidate.n])}%</strong></div>`) : html`<p class="note">Projeção indisponível</p>`}
    <p class="pj-note">
      ${value?.reason || reason || (official ? "Totalização concluída." : "Aguardando dados compatíveis para publicar a projeção.")}
    </p>
    <p class="pj-note">
      ${official ? "Totalização oficial recebida da Justiça Eleitoral." : "Estimativa experimental, separada da apuração oficial. Não representa probabilidade de vitória ou anúncio de vencedor."}
    </p>
  </section>`;
}
