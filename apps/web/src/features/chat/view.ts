import { renderMessageText } from "./emotes";
import {
  chatLimits,
  type ChatMessage,
} from "../../../../../packages/contracts/chat";
export function createChatView() {
  const root = document.createElement("div");
  root.className = "live-chat";
  root.innerHTML = `
    <button type="button" class="live-chat-launcher" aria-haspopup="dialog" aria-expanded="false" aria-controls="live-chat-panel">Chat ao vivo</button>
    <dialog id="live-chat-panel" class="live-chat-panel" aria-labelledby="live-chat-title">
      <header class="live-chat-header"><div><h2 id="live-chat-title">Chat ao vivo</h2><p class="live-chat-status" role="status">Conectando…</p></div><button type="button" class="live-chat-close" aria-label="Fechar chat">Fechar</button></header>
      <p class="live-chat-notice">Conversa pública entre visitantes. Apelidos não são verificados. Não compartilhe dados pessoais.</p>
      <div class="live-chat-messages" role="log" aria-label="Mensagens do chat" aria-live="polite" aria-relevant="additions" tabindex="0"></div>
      <p class="live-chat-empty">Nenhuma mensagem por aqui. Comece a conversa.</p>
      <p class="live-chat-error" role="alert" hidden></p>
      <form class="live-chat-join"><label for="live-chat-name">Seu apelido</label><div class="live-chat-row"><input id="live-chat-name" name="name" maxlength="24" autocomplete="off" required placeholder="Até 24 caracteres"><button type="submit">Entrar</button></div></form>
      <form class="live-chat-compose" hidden><label for="live-chat-text">Mensagem</label><textarea id="live-chat-text" name="message" maxlength="280" rows="2" required placeholder="Escreva sua mensagem"></textarea><div class="live-chat-row"><span class="live-chat-counter">0/280</span><button type="submit" disabled>Enviar</button></div></form>
    </dialog>`;
  document.body.append(root);
  const query = <T extends Element>(selector: string) =>
    root.querySelector<T>(selector)!;
  return {
    root,
    launcher: query<HTMLButtonElement>(".live-chat-launcher"),
    panel: query<HTMLDialogElement>("dialog"),
    close: query<HTMLButtonElement>(".live-chat-close"),
    status: query<HTMLParagraphElement>(".live-chat-status"),
    messages: query<HTMLDivElement>(".live-chat-messages"),
    empty: query<HTMLParagraphElement>(".live-chat-empty"),
    error: query<HTMLParagraphElement>(".live-chat-error"),
    join: query<HTMLFormElement>(".live-chat-join"),
    name: query<HTMLInputElement>("input"),
    compose: query<HTMLFormElement>(".live-chat-compose"),
    text: query<HTMLTextAreaElement>("textarea"),
    counter: query<HTMLSpanElement>(".live-chat-counter"),
    send: query<HTMLButtonElement>(".live-chat-compose button[type=submit]"),
  };
}

export type ChatView = ReturnType<typeof createChatView>;
export function validMessage(value: unknown): value is ChatMessage {
  if (typeof value !== "object" || value === null) return false;
  const item = value as Record<string, unknown>;
  return (
    typeof item.id === "string" &&
    typeof item.name === "string" &&
    Array.from(item.name).length <= chatLimits.nameMax &&
    typeof item.text === "string" &&
    Array.from(item.text).length <= chatLimits.textMax &&
    typeof item.createdAt === "string" &&
    Number.isFinite(Date.parse(item.createdAt))
  );
}

export function appendMessage(view: ChatView, message: ChatMessage) {
  if (
    Array.from(view.messages.children).some(
      (item) => (item as HTMLElement).dataset.messageId === message.id,
    )
  )
    return;
  const nearBottom =
    view.messages.scrollHeight -
      view.messages.scrollTop -
      view.messages.clientHeight <
    80;
  const item = document.createElement("article");
  item.dataset.messageId = message.id;
  const author = document.createElement("strong");
  author.textContent = message.name;
  const time = document.createElement("time");
  time.dateTime = message.createdAt;
  time.textContent = new Date(message.createdAt).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const text = document.createElement("p");
  renderMessageText(text, message.text);
  item.append(author, time, text);
  view.messages.append(item);
  if (view.messages.children.length > chatLimits.historyMax)
    view.messages.firstElementChild?.remove();
  view.empty.hidden = true;
  if (nearBottom) view.messages.scrollTop = view.messages.scrollHeight;
}
