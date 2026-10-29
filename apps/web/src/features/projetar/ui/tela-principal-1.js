import { useEstadoInicial } from "./shell-principal-estado.js";
import { useReproducaoDoHistorico } from "./shell-principal-historico.js";
import { useNavegacaoECamera } from "./shell-principal-navegacao.js";
import { useModoTV } from "./shell-principal-tv.js";
import { usePerfilEAtalhos } from "./shell-principal-perfil.js";
import { renderizarPrincipal } from "./shell-principal-conteudo.js";
import { ad, Dc } from "./navegacao-e-patrocinio-1.js";
import { layoutDoPainel } from "./shell-layout.js";
import { html, useEffect } from "./formatacao-e-acessibilidade-1.js";
import { GovernadoresPrincipal } from "./governadores-principal.js";
import { ExteriorPrincipal } from "./exterior-principal.js";

export let _d;
export function initialize() {
  _d = renderizarTelaPrincipal;
}

function renderizarTelaPrincipal() {
  const estado = useEstadoInicial();
  const { W, H } = ad();
  const { flow } = layoutDoPainel({
    width: W,
    height: H,
    tv: estado.g,
    shell: Dc,
  });
  const scroll = flow;
  useEffect(() => {
    document.documentElement.classList.toggle("flow", scroll);
    return () => document.documentElement.classList.remove("flow");
  }, [scroll]);
  Object.assign(estado, useReproducaoDoHistorico(estado));
  Object.assign(estado, useNavegacaoECamera(estado));
  Object.assign(estado, useModoTV(estado));
  Object.assign(estado, usePerfilEAtalhos(estado));
  const principal = renderizarPrincipal(estado);
  return html`<div class="frame">
    ${estado.yn === "gov" ? html`<${GovernadoresPrincipal} estado=${estado} />` : estado.Rn === "ZZ" ? html`<${ExteriorPrincipal} estado=${estado} />` : principal}
  </div>`;
}
