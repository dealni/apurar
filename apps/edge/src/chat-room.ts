import {
  chatLimits,
  ChatValidationError,
  parseChatEvent,
  type ChatMessage,
  type ChatServerEvent,
} from "../../../packages/contracts/chat";
import { chatError, validChatRequest } from "./chat-route";
import { digest } from "./storage";
import type {
  ChatAttachment,
  ChatSocket,
  ChatState,
  ChatEnvironment,
} from "./chat-types";

interface IdentityRate {
  expires: number;
  connections: number[];
  messages: number[];
}
interface StoredChat {
  salt: string;
  messages: ChatMessage[];
  identities: [string, IdentityRate][];
}
const identityAgeMs = 10 * 60_000;
const maxIdentities = 2000;

function errorRequestId(raw: string | ArrayBuffer): { requestId?: string } {
  if (typeof raw !== "string") return {};
  try {
    const event = parseChatEvent(raw);
    return event.type === "message" && event.requestId
      ? { requestId: event.requestId }
      : {};
  } catch {
    return {};
  }
}

// Attachments preservam os limites da conexão durante a hibernação.
export class ChatRoom {
  private messages: ChatMessage[] = [];
  private identities = new Map<string, IdentityRate>();
  private salt = "";
  private queue: Promise<unknown> = Promise.resolve();

  constructor(
    private ctx: ChatState,
    private env: ChatEnvironment = {},
  ) {
    void ctx.blockConcurrencyWhile(async () => {
      const stored = await ctx.storage.get<StoredChat>("chat");
      this.salt = stored?.salt ?? crypto.randomUUID();
      this.messages = stored?.messages ?? [];
      this.identities = new Map(stored?.identities ?? []);
      await this.persist();
      if (this.env.CHAT_ENABLED === "false") {
        for (const socket of this.ctx.getWebSockets())
          socket.close(1008, "Chat suspenso.");
      }
    });
  }

  private serial<T>(operation: () => Promise<T>): Promise<T> {
    const result = this.queue.then(operation);
    this.queue = result.catch(() => undefined);
    return result;
  }

  private prune(now = Date.now()) {
    this.messages = this.messages
      .filter(
        (message) =>
          Date.parse(message.createdAt) > now - chatLimits.historyAgeMs,
      )
      .slice(-chatLimits.historyMax);
    for (const [key, rate] of this.identities)
      if (rate.expires <= now) this.identities.delete(key);
  }

  private async persist() {
    this.prune();
    const expiry = Math.min(
      ...[...this.identities.values()].map((value) => value.expires),
      ...this.messages.map(
        (message) => Date.parse(message.createdAt) + chatLimits.historyAgeMs,
      ),
    );
    if (Number.isFinite(expiry)) await this.ctx.storage.setAlarm(expiry);
    // O agendamento deve confirmar antes do commit; falha posterior não pode
    // fazer o cliente receber erro por uma mensagem já persistida.
    await this.ctx.storage.put<StoredChat>("chat", {
      salt: this.salt,
      messages: this.messages,
      identities: [...this.identities],
    });
  }

  private send(socket: ChatSocket, event: ChatServerEvent) {
    try {
      socket.send(JSON.stringify(event));
    } catch {
      try {
        socket.close(1011, "Conexão encerrada.");
      } catch {
        /* Socket já encerrado. */
      }
    }
  }

  private broadcast(event: ChatServerEvent, excluding?: ChatSocket) {
    for (const socket of this.ctx.getWebSockets())
      if (socket !== excluding) this.send(socket, event);
  }

  private presence(excluding?: ChatSocket) {
    const count = this.ctx
      .getWebSockets()
      .filter(
        (socket) =>
          socket !== excluding &&
          (socket.deserializeAttachment() as ChatAttachment)?.name,
      ).length;
    this.broadcast({ type: "presence", count }, excluding);
  }

  fetch(request: Request): Promise<Response> {
    return this.serial(() => this.connect(request));
  }

  private async connect(request: Request): Promise<Response> {
    if (this.env.CHAT_ENABLED === "false")
      return chatError("Chat temporariamente suspenso.", 503);
    const invalid = validChatRequest(request);
    if (invalid) return invalid;
    const local = ["localhost", "127.0.0.1", "[::1]"].includes(
      new URL(request.url).hostname,
    );
    const ip =
      request.headers.get("CF-Connecting-IP") ?? (local ? "local" : null);
    if (!ip) return chatError("Identidade de conexão indisponível.", 503);
    this.prune();
    const identity = await digest(`${this.salt}:${ip}`);
    const sockets = this.ctx.getWebSockets();
    if (sockets.length >= 300)
      return chatError("Chat lotado. Tente mais tarde.", 503);
    if (
      sockets.filter(
        (socket) =>
          (socket.deserializeAttachment() as ChatAttachment)?.identity ===
          identity,
      ).length >= 3
    )
      return chatError("Limite de conexões atingido.", 429);
    let rate = this.identities.get(identity);
    if (!rate && this.identities.size >= maxIdentities)
      return chatError("Chat ocupado. Tente mais tarde.", 503);
    const now = Date.now();
    rate ??= { expires: now + identityAgeMs, connections: [], messages: [] };
    rate.connections = rate.connections.filter((time) => time > now - 60_000);
    if (rate.connections.length >= 10)
      return chatError("Aguarde antes de reconectar.", 429);
    rate.connections.push(now);
    rate.expires = now + identityAgeMs;
    this.identities.set(identity, rate);
    await this.persist();
    const Pair = (
      globalThis as unknown as {
        WebSocketPair: new () => { 0: ChatSocket; 1: ChatSocket };
      }
    ).WebSocketPair;
    const pair = new Pair();
    this.ctx.acceptWebSocket(pair[1]);
    pair[1].serializeAttachment({
      identity,
      name: null,
      window: now,
      count: 0,
    } satisfies ChatAttachment);
    this.send(pair[1], { type: "history", messages: this.messages });
    this.presence();
    return new Response(null, {
      status: 101,
      webSocket: pair[0],
    } as ResponseInit);
  }

  webSocketMessage(
    socket: ChatSocket,
    raw: string | ArrayBuffer,
  ): Promise<void> {
    return this.serial(async () => {
      try {
        await this.receive(socket, raw);
      } catch (cause) {
        this.send(socket, {
          type: "error",
          ...errorRequestId(raw),
          message:
            cause instanceof ChatValidationError
              ? cause.message
              : "Não foi possível enviar. Tente novamente.",
        });
      }
    });
  }

  private async receive(socket: ChatSocket, raw: string | ArrayBuffer) {
    if (this.env.CHAT_ENABLED === "false") {
      this.send(socket, {
        type: "error",
        message: "Chat temporariamente suspenso.",
      });
      socket.close(1008, "Chat suspenso.");
      return;
    }
    const attachment = socket.deserializeAttachment() as ChatAttachment | null;
    if (!attachment) return socket.close(1008, "Conexão inválida.");
    const now = Date.now();
    if (now - attachment.window >= 10_000) {
      attachment.window = now;
      attachment.count = 0;
    }
    attachment.count++;
    socket.serializeAttachment(attachment);
    if (attachment.count > 6) {
      socket.close(1008, "Muitas mensagens. Aguarde antes de reconectar.");
      return;
    }
    if (typeof raw !== "string")
      throw new ChatValidationError("Envie apenas texto.");
    const event = parseChatEvent(raw);
    if (event.type === "join") {
      if (attachment.name)
        throw new ChatValidationError("Apelido já definido nesta conexão.");
      attachment.name = event.name;
      socket.serializeAttachment(attachment);
      this.presence();
      return;
    }
    if (!attachment.name)
      throw new ChatValidationError("Escolha um apelido antes de enviar.");
    this.prune(now);
    let rate = this.identities.get(attachment.identity);
    if (!rate && this.identities.size >= maxIdentities)
      throw new ChatValidationError("Chat ocupado. Tente mais tarde.");
    rate ??= { expires: now + identityAgeMs, connections: [], messages: [] };
    rate.messages = rate.messages.filter((time) => time > now - 60_000);
    if (rate.messages.length >= 15)
      throw new ChatValidationError(
        "Limite de mensagens atingido. Aguarde um minuto.",
      );
    rate.messages.push(now);
    rate.expires = now + identityAgeMs;
    this.identities.set(attachment.identity, rate);
    const message: ChatMessage = {
      id: crypto.randomUUID(),
      name: attachment.name,
      text: event.text,
      createdAt: new Date(now).toISOString(),
    };
    this.messages.push(message);
    try {
      await this.persist();
    } catch {
      this.messages = this.messages.filter((item) => item.id !== message.id);
      throw new Error("Persistência indisponível.");
    }
    this.broadcast({ type: "message", message });
    if (event.requestId)
      this.send(socket, { type: "ack", requestId: event.requestId });
  }

  webSocketClose(socket: ChatSocket) {
    this.presence(socket);
  }

  webSocketError(socket: ChatSocket) {
    socket.close(1011, "Conexão encerrada.");
    this.presence(socket);
  }

  alarm(): Promise<void> {
    return this.serial(() => this.persist());
  }
}
