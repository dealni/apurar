import { chatLimits } from "../../../../../packages/contracts/chat";
import { emotes } from "./emotes";
import type { ChatView } from "./view";
import "./emotes.css";

export function installEmotePicker(view: ChatView) {
  const toggle = document.createElement("button");
  toggle.type = "button";
  toggle.className = "live-chat-emote-toggle";
  toggle.innerHTML =
    '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M8 14a4.5 4.5 0 0 0 8 0"/><path d="M8.5 9h.01M15.5 9h.01" stroke-width="3"/></svg><span>Emotes</span>';
  toggle.setAttribute("aria-label", "Emotes");
  toggle.setAttribute("aria-controls", "live-chat-emotes");
  toggle.setAttribute("aria-expanded", "false");
  const picker = document.createElement("div");
  picker.id = "live-chat-emotes";
  picker.className = "live-chat-emotes";
  picker.setAttribute("role", "group");
  picker.setAttribute("aria-label", "Escolher emote");
  picker.hidden = true;
  const close = () => {
    picker.hidden = true;
    toggle.setAttribute("aria-expanded", "false");
  };
  toggle.addEventListener("click", () => {
    if (!picker.hidden) return close();
    picker.hidden = false;
    toggle.setAttribute("aria-expanded", "true");
    picker.querySelector("button")?.focus();
  });
  for (const emote of emotes) {
    const button = document.createElement("button");
    button.type = "button";
    button.title = `${emote.name} · ${emote.label}`;
    button.setAttribute("aria-label", button.title);
    const image = document.createElement("img");
    image.src = emote.src;
    image.alt = "";
    image.width = 32;
    image.height = 32;
    image.loading = "lazy";
    button.append(image);
    button.addEventListener("click", () => {
      if (view.text.readOnly) return;
      const start = view.text.selectionStart;
      const end = view.text.selectionEnd;
      const length =
        view.text.value.length - (end - start) + emote.token.length;
      if (length > chatLimits.textMax) {
        view.error.textContent =
          "Não há espaço para este emote. A mensagem pode ter até 280 caracteres.";
        view.error.hidden = false;
        return;
      }
      view.text.setRangeText(emote.token, start, end, "end");
      view.text.dispatchEvent(new Event("input", { bubbles: true }));
      close();
      view.text.focus();
    });
    picker.append(button);
  }
  view.compose.insertBefore(picker, view.text);
  view.counter.before(toggle);
  view.compose.addEventListener("submit", close);
  view.panel.addEventListener("keydown", (event) => {
    if (event.key !== "Escape" || picker.hidden) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    close();
    toggle.focus();
  });
  return { close, toggle };
}
