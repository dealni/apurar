import { shareLinks } from "./share-links";
import "./share-dialog.css";
import whatsapp from "./assets/social/whatsapp.svg";
import telegram from "./assets/social/telegram.svg";
import x from "./assets/social/x.svg";
import facebook from "./assets/social/facebook.webp";
const brands: Record<string, string> = { whatsapp, telegram, x, facebook };

let current: HTMLDialogElement | null = null;
const icons: Record<string, string> = {
  copy: '<rect x="8" y="8" width="12" height="13" rx="2"/><path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h3"/>',
  image:
    '<rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8" cy="8" r="1"/><path d="m3 17 6-6 4 4 3-3 5 5"/>',
  more: '<path d="M12 16V3m-4 4 4-4 4 4M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7"/>',
};
function icon(name: string) {
  const span = document.createElement("span");
  span.className = "share-icon";
  span.setAttribute("aria-hidden", "true");
  if (brands[name]) {
    const image = document.createElement("img");
    image.src = brands[name];
    image.alt = "";
    image.width = 28;
    image.height = 28;
    span.classList.add("share-brand");
    span.append(image);
    return span;
  }
  span.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${icons[name]}</svg>`;
  return span;
}
function button(label: string, glyph?: string) {
  const control = document.createElement("button");
  control.type = "button";
  if (glyph) control.append(icon(glyph));
  const text = document.createElement("span");
  text.textContent = label;
  control.append(text);
  return control;
}

export function openShareDialog(onImage: () => unknown, opener: HTMLElement) {
  if (current?.open) return;
  const url = location.href;
  const title = document.title;
  const panel = document.createElement("dialog");
  current = panel;
  panel.className = "share-dialog";
  panel.setAttribute("aria-labelledby", "share-title");
  panel.innerHTML =
    '<header><div><h2 id="share-title">Compartilhar</h2><p>Envie esta vista do Apurar.</p></div></header>';
  const close = button("Fechar");
  close.className = "share-close";
  close.setAttribute("aria-label", "Fechar compartilhamento");
  close.addEventListener("click", () => panel.close());
  panel.querySelector("header")!.append(close);
  const networks = document.createElement("nav");
  networks.className = "share-networks";
  networks.setAttribute("aria-label", "Redes sociais");
  for (const item of shareLinks(url, title)) {
    const link = document.createElement("a");
    link.href = item.href;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.append(icon(item.icon), document.createTextNode(item.name));
    networks.append(link);
  }
  const label = document.createElement("label");
  label.className = "share-link-label";
  label.textContent = "Link desta vista";
  const input = document.createElement("input");
  input.readOnly = true;
  input.value = url;
  input.addEventListener("click", () => input.select());
  label.append(input);
  const status = document.createElement("p");
  status.className = "share-status";
  status.setAttribute("role", "status");
  const copy = button("Copiar link", "copy");
  copy.className = "share-copy";
  copy.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(url);
      if (panel.open) status.textContent = "Link copiado.";
    } catch {
      if (!panel.open) return;
      input.focus();
      input.select();
      status.textContent =
        "Não foi possível copiar. Selecione e copie o link acima.";
    }
  });
  const actions = document.createElement("div");
  actions.className = "share-actions";
  const image = button("Compartilhar imagem", "image");
  image.addEventListener("click", () => {
    panel.close();
    // Mantém a captura imediata do mapa, o compartilhamento nativo e o PNG existentes.
    void onImage();
  });
  actions.append(image);
  if (typeof navigator.share === "function") {
    const more = button("Mais opções", "more");
    more.addEventListener("click", async () => {
      more.disabled = true;
      try {
        await navigator.share({ title, url });
      } catch (error) {
        if (
          panel.open &&
          !(error instanceof DOMException && error.name === "AbortError")
        )
          status.textContent =
            "Não foi possível compartilhar. Você pode copiar o link.";
      } finally {
        more.disabled = false;
      }
    });
    actions.append(more);
  }
  panel.append(networks, label, copy, actions, status);
  const overflow = document.body.style.overflow;
  const rootOverflow = document.documentElement.style.overflow;
  const changed = () => panel.close();
  panel.addEventListener(
    "close",
    () => {
      document.body.style.overflow = overflow;
      document.documentElement.style.overflow = rootOverflow;
      removeEventListener("hashchange", changed);
      panel.remove();
      if (current === panel) current = null;
      if (opener.isConnected) opener.focus();
    },
    { once: true },
  );
  panel.addEventListener("click", (event) => {
    if (event.target !== panel) return;
    const r = panel.getBoundingClientRect();
    if (
      event.clientX < r.left ||
      event.clientX > r.right ||
      event.clientY < r.top ||
      event.clientY > r.bottom
    )
      panel.close();
  });
  addEventListener("hashchange", changed);
  document.body.append(panel);
  document.body.style.overflow = "hidden";
  document.documentElement.style.overflow = "hidden";
  panel.showModal();
}

export function shareFromMap(event: Event, onImage: () => unknown) {
  const trigger = event.currentTarget as HTMLElement;
  const opener =
    trigger.closest(".map-actions")?.querySelector<HTMLElement>("summary") ??
    trigger;
  // O menu compacto termina de fechar antes de o diálogo assumir o foco.
  queueMicrotask(() => openShareDialog(onImage, opener));
}
