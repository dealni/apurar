import { captura } from "../config/captura";
import "./offline.css";

/** Isola a captura histórica e permite o backend próprio do Apurar. */
const fetchOriginal = window.fetch.bind(window);
const paginaArquivada = /^\/1turno(?:\/|$)/.test(location.pathname);
const fontesOficiais = new Set([
  "resultados.tse.jus.br",
  "dadosabertos.tse.jus.br",
]);
let avisoExterior = "";
const falhaExterior =
  "Não foi possível carregar os votos por país desta captura.";

function atualizarExterior() {
  if (!avisoExterior) return;
  for (const aviso of document.querySelectorAll(
    ".stc.ext > section > p.note",
  )) {
    if (
      !aviso.parentElement
        ?.querySelector(".lab")
        ?.textContent?.includes("Presidente")
    )
      continue;
    for (const texto of aviso.childNodes) {
      if (
        texto.nodeType === Node.TEXT_NODE &&
        texto.nodeValue?.trim() === "Carregando…"
      ) {
        texto.nodeValue = avisoExterior;
        aviso.setAttribute("role", "status");
      }
    }
  }
}

function atualizarRespostaExterior(response: Response) {
  avisoExterior = response.ok
    ? ""
    : response.status === 404
      ? captura.exterior
      : falhaExterior;
  atualizarExterior();
}

window.fetch = async (input, options = {}) => {
  const request = input instanceof Request ? input : undefined;
  const url = new URL(
    input instanceof Request ? input.url : input,
    location.href,
  );
  const metodo = (options.method ?? request?.method ?? "GET").toUpperCase();
  const leitura = ["GET", "HEAD"].includes(metodo);
  const propria = url.origin === location.origin;
  const oficial = url.protocol === "https:" && fontesOficiais.has(url.hostname);
  if (!(leitura && (propria || oficial))) {
    return new Response(JSON.stringify({ error: captura.formulario }), {
      status: 503,
      headers: { "Content-Type": "application/json" },
    });
  }
  const detalheExterior =
    paginaArquivada && propria && url.pathname === "/1turno/feed/uf/zz.json";
  try {
    const response = await fetchOriginal(input, options);
    if (detalheExterior) atualizarRespostaExterior(response);
    return response;
  } catch (error) {
    if (detalheExterior) {
      avisoExterior = falhaExterior;
      atualizarExterior();
    }
    throw error;
  }
};

navigator.sendBeacon = () => false;

document.addEventListener(
  "submit",
  (event) => {
    event.preventDefault();
    const form = event.target;
    if (!(form instanceof HTMLFormElement)) return;
    if (!paginaArquivada || form.matches("#aviso, form.ask, #dlg")) return;
    let aviso = form.querySelector<HTMLElement>("[data-envio-local]");
    if (!aviso) {
      aviso = document.createElement("p");
      aviso.dataset.envioLocal = "true";
      aviso.setAttribute("role", "status");
      form.append(aviso);
    }
    aviso.textContent = captura.formulario;
  },
  true,
);

/** Retratos que a origem retornou como 404 ganham um placeholder explícito. */
document.addEventListener(
  "error",
  (event) => {
    const image = event.target;
    if (!(image instanceof HTMLImageElement) || image.dataset.indisponivel)
      return;
    const url = new URL(image.currentSrc || image.src, location.href);
    if (!url.pathname.startsWith("/1turno/feed/fotos/")) return;
    image.dataset.indisponivel = "true";
    image.title = "Foto indisponível na captura pública";
    image.removeAttribute("srcset");
    image.src = `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80"><rect width="80" height="80" fill="#e8e5df"/><circle cx="40" cy="28" r="13" fill="#aaa69e"/><path d="M14 76c0-32 52-32 52 0" fill="#aaa69e"/></svg>')}`;
  },
  true,
);

function iniciarAvisos() {
  new MutationObserver(atualizarExterior).observe(document.body, {
    childList: true,
    subtree: true,
    characterData: true,
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", iniciarAvisos, { once: true });
} else {
  iniciarAvisos();
}
