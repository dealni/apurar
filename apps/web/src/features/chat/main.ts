import { installEmotePicker } from "./emote-picker";
import { parseChatEvent } from "../../../../../packages/contracts/chat";
import { appendMessage, createChatView, validMessage } from "./view";
import "./styles.css";

const view = createChatView();
const emotePicker = installEmotePicker(view);
let socket: WebSocket | null = null;
let reconnect: ReturnType<typeof setTimeout> | undefined;
let attempt = 0;
let connectionTimer: ReturnType<typeof setTimeout> | undefined;
let name = "";
let connected = false;
let pending: string | null = null;
let pendingTimer: ReturnType<typeof setTimeout> | undefined;

function clearPending() {
  clearTimeout(pendingTimer);
  pendingTimer = undefined;
  pending = null;
}

function showError(message: string) {
  view.error.textContent = message;
  view.error.hidden = !message;
}

function refresh() {
  view.send.disabled =
    !connected || !name || !view.text.value.trim() || pending !== null;
  view.text.readOnly = pending !== null;
  emotePicker.toggle.disabled = pending !== null;
  view.send.textContent = pending === null ? "Enviar" : "Enviando…";
  view.counter.textContent = `${view.text.value.length}/280`;
  if (connected) view.status.textContent = "Conectado";
}

function receiveHistory(messages: unknown) {
  if (!Array.isArray(messages)) return;
  view.messages.replaceChildren();
  view.empty.hidden = false;
  for (const message of messages.slice(-100)) {
    if (validMessage(message)) appendMessage(view, message);
  }
}

function receiveError(event: Record<string, unknown>) {
  if (event.type !== "error" || typeof event.message !== "string") return;
  if (pending !== null && event.requestId === pending) clearPending();
  showError(event.message.slice(0, 300));
}

function receive(data: unknown) {
  if (typeof data !== "string") return;
  try {
    const event = JSON.parse(data) as Record<string, unknown>;
    if (event.type === "history") receiveHistory(event.messages);
    if (event.type === "message" && validMessage(event.message)) {
      appendMessage(view, event.message);
    }
    if (
      event.type === "ack" &&
      pending !== null &&
      event.requestId === pending
    ) {
      clearPending();
      view.text.value = "";
      showError("");
    }
    receiveError(event);
    refresh();
  } catch {
    showError("Não foi possível ler uma mensagem do chat.");
  }
}

function disconnected() {
  connected = false;
  clearPending();
  refresh();
  if (!view.panel.open) return;
  const delay = Math.min(30_000, 1000 * 2 ** Math.min(attempt++, 5));
  view.status.textContent = "Conexão interrompida · tentando reconectar…";
  reconnect = setTimeout(connect, delay);
}

function connect() {
  if (!view.panel.open || socket) return;
  clearTimeout(reconnect);
  view.status.textContent = "Conectando…";
  const url = new URL("/api/chat/socket", location.href);
  url.protocol = location.protocol === "https:" ? "wss:" : "ws:";
  try {
    const active = new WebSocket(url);
    socket = active;
    connectionTimer = setTimeout(() => {
      if (socket !== active) return;
      socket = null;
      active.close();
      disconnected();
    }, 10_000);
    active.addEventListener("open", () => {
      if (socket !== active) return;
      clearTimeout(connectionTimer);
      connected = true;
      attempt = 0;
      showError("");
      if (name) active.send(JSON.stringify({ type: "join", name }));
      refresh();
    });
    active.addEventListener("message", (event) => {
      if (socket === active) receive(event.data);
    });
    active.addEventListener("close", () => {
      if (socket !== active) return;
      clearTimeout(connectionTimer);
      socket = null;
      disconnected();
    });
    active.addEventListener("error", () => {
      if (socket === active)
        showError("O chat está indisponível. A reconexão é automática.");
    });
  } catch {
    disconnected();
  }
}

function closeChat() {
  emotePicker.close();
  view.panel.close();
  view.launcher.setAttribute("aria-expanded", "false");
  clearTimeout(reconnect);
  clearTimeout(connectionTimer);
  const previous = socket;
  socket = null;
  connected = false;
  previous?.close();
  clearPending();
  refresh();
  view.messages.replaceChildren();
  view.empty.hidden = false;
  view.launcher.focus();
}

view.launcher.addEventListener("click", () => {
  if (view.panel.open) {
    closeChat();
    return;
  }
  attempt = 0;
  view.panel.show();
  view.launcher.setAttribute("aria-expanded", "true");
  (name ? view.text : view.name).focus();
  connect();
});
view.close.addEventListener("click", closeChat);
view.panel.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    event.preventDefault();
    closeChat();
  }
});
view.join.addEventListener("submit", (event) => {
  event.preventDefault();
  try {
    const join = parseChatEvent(
      JSON.stringify({ type: "join", name: view.name.value }),
    );
    if (join.type !== "join") return;
    name = join.name;
    if (connected) socket?.send(JSON.stringify(join));
  } catch (error) {
    showError(error instanceof Error ? error.message : "Confira seu apelido.");
    return;
  }
  view.join.hidden = true;
  view.compose.hidden = false;
  showError("");
  refresh();
  view.text.focus();
});
view.text.addEventListener("input", refresh);
view.compose.addEventListener("submit", (event) => {
  event.preventDefault();
  if (!connected || !socket || !name || pending !== null) return;
  try {
    const message = parseChatEvent(
      JSON.stringify({
        type: "message",
        requestId: crypto.randomUUID(),
        text: view.text.value.replace(/[\r\n\t]+/gu, " "),
      }),
    );
    if (message.type !== "message") return;
    socket.send(JSON.stringify(message));
    pending = message.requestId!;
    pendingTimer = setTimeout(() => {
      clearPending();
      showError(
        "O envio não foi confirmado. Confira o chat antes de tentar novamente.",
      );
      refresh();
    }, 10_000);
    showError("");
    refresh();
  } catch (error) {
    showError(error instanceof Error ? error.message : "Confira sua mensagem.");
  }
  view.text.focus();
});
window.addEventListener("pagehide", () => {
  clearTimeout(reconnect);
  clearTimeout(connectionTimer);
  const previous = socket;
  socket = null;
  connected = false;
  clearPending();
  previous?.close();
  refresh();
});
window.addEventListener("pageshow", (event) => {
  if (event.persisted && view.panel.open && !socket) connect();
});

// O modo de transmissão encerra o painel para liberar foco e atalhos do mapa.
const appRoot = document.querySelector("#app");
if (appRoot) {
  new MutationObserver(() => {
    if (view.panel.open && document.querySelector(".hud.tv")) closeChat();
  }).observe(appRoot, {
    subtree: true,
    childList: true,
    attributes: true,
    attributeFilter: ["class"],
  });
}
