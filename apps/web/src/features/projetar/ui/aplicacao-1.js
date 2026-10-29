import {
  useErrorBoundary,
  html,
  render,
} from "./formatacao-e-acessibilidade-1.js";
import { _d } from "./tela-principal-1.js";
import { Feed } from "../feed.js";
import { SupplementalFeed } from "../../../integration/supplemental-client.ts";
export let ApuracaoApp, mountApuracao, Nd;
export function initialize() {
  ApuracaoApp = () => {
    const [failure] = useErrorBoundary((error) =>
      console.error("[apurar]", error),
    );
    return failure
      ? html`<div class="guard" role="alert">
          <p class="gt">Apurar</p>
          <p>Não foi possível exibir o painel.</p>
          <button class="btn" onClick=${() => location.reload()}>
            Recarregar
          </button>
        </div>`
      : html`<${_d} />`;
  };
  mountApuracao = () => {
    if (window.APURACAO_SEM_SUPORTE) return;
    const target = document.getElementById("app");
    render(html`<${ApuracaoApp} />`, target);
    window.APURACAO_OK?.();
  };
  Nd = Feed.start();
  SupplementalFeed.start();
  Promise.race([
    Promise.resolve(Nd),
    new Promise((resolve) => setTimeout(resolve, 1200)),
  ]).then(mountApuracao, mountApuracao);
}
