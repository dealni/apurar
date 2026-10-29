import { afterEach, expect, it, vi } from "vitest";
import { ChatRoom } from "./chat-room";
import { fetchChat } from "./chat-route";
import type { ChatSocket, ChatState } from "./chat-types";
import { parseChatEvent } from "../../../packages/contracts/chat";

class Socket implements ChatSocket {
  events: Record<string, unknown>[] = [];
  attachment: unknown = null;
  closed = false;
  send(raw: string) {
    this.events.push(JSON.parse(raw));
  }
  close() {
    this.closed = true;
  }
  serializeAttachment(value: unknown) {
    this.attachment = structuredClone(value);
  }
  deserializeAttachment() {
    return structuredClone(this.attachment);
  }
}
function request(ip = "192.0.2.1", origin = "https://apurar.app") {
  return new Request("https://apurar.app/api/chat/socket", {
    headers: { Upgrade: "websocket", Origin: origin, "CF-Connecting-IP": ip },
  });
}
async function fixture(env: { CHAT_ENABLED?: string } = {}) {
  const stored = new Map<string, unknown>();
  const sockets: Socket[] = [];
  let ready: Promise<unknown> = Promise.resolve();
  const ctx: ChatState = {
    storage: {
      get: async <T>(key: string) =>
        structuredClone(stored.get(key)) as T | undefined,
      put: async (key, value) => {
        stored.set(key, structuredClone(value));
      },
      setAlarm: vi.fn(async () => {}),
    },
    blockConcurrencyWhile: (operation) => {
      const result = operation();
      ready = result;
      return result;
    },
    acceptWebSocket: (socket) => {
      sockets.push(socket as Socket);
    },
    getWebSockets: () => sockets.filter((socket) => !socket.closed),
  };
  const OriginalResponse = Response;
  vi.stubGlobal(
    "Response",
    class extends OriginalResponse {
      constructor(body: BodyInit | null, init?: ResponseInit) {
        super(body, init?.status === 101 ? { status: 200 } : init);
        if (init?.status === 101)
          Object.defineProperty(this, "status", { value: 101 });
      }
    },
  );
  vi.stubGlobal(
    "WebSocketPair",
    class {
      0 = new Socket();
      1 = new Socket();
    },
  );
  let room = new ChatRoom(ctx, env);
  await ready;
  return {
    ctx,
    stored,
    sockets,
    get room() {
      return room;
    },
    async restart() {
      room = new ChatRoom(ctx, env);
      await ready;
    },
    async connect(ip = "192.0.2.1") {
      expect((await room.fetch(request(ip))).status).toBe(101);
      return sockets.at(-1)!;
    },
    async send(socket: Socket, value: unknown) {
      await room.webSocketMessage(socket, JSON.stringify(value));
    },
  };
}
afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

it("valida tamanho Unicode, nomes e frames sem refletir conteúdo inválido", () => {
  expect(
    parseChatEvent(JSON.stringify({ type: "join", name: "  João  " })),
  ).toEqual({ type: "join", name: "João" });
  expect(
    parseChatEvent(JSON.stringify({ type: "message", text: "🙂".repeat(280) }))
      .type,
  ).toBe("message");
  for (const raw of [
    "{}",
    "null",
    "[]",
    "x",
    JSON.stringify({ type: "join", name: "a" }),
    JSON.stringify({ type: "message", text: "x".repeat(281) }),
    JSON.stringify({ type: "message", text: "a\nb" }),
    "x".repeat(4097),
  ])
    expect(() => parseChatEvent(raw)).toThrow();
});

it("valida origem/upgrade/método e permite suspender apenas chat", async () => {
  const fetch = vi.fn(async () => new Response("socket"));
  const env = {
    CHAT_ROOM: { idFromName: () => "public", get: () => ({ fetch }) },
  };
  expect((await fetchChat(request(), env)).status).toBe(200);
  expect(fetch).toHaveBeenCalledOnce();
  expect(
    (await fetchChat(request("192.0.2.1", "https://outro.test"), env)).status,
  ).toBe(403);
  expect(
    (await fetchChat(new Request("https://apurar.app/api/chat/socket"), env))
      .status,
  ).toBe(426);
  expect(
    (
      await fetchChat(
        new Request("https://apurar.app/api/chat/socket", { method: "POST" }),
        env,
      )
    ).status,
  ).toBe(405);
  expect(
    (await fetchChat(request(), { ...env, CHAT_ENABLED: "false" })).status,
  ).toBe(503);
  expect((await fetchChat(request(), {})).status).toBe(503);
  expect(fetch).toHaveBeenCalledOnce();
});

it("exige identidade da borda em produção e não confia em X-Forwarded-For", async () => {
  const { room } = await fixture();
  const incoming = request();
  incoming.headers.delete("CF-Connecting-IP");
  incoming.headers.set("X-Forwarded-For", "192.0.2.7");
  expect((await room.fetch(incoming)).status).toBe(503);
});

it("envia histórico sem join, exige apelido e transmite mensagens sem IP", async () => {
  const f = await fixture();
  const one = await f.connect();
  const two = await f.connect("192.0.2.2");
  expect(one.events[0]).toEqual({ type: "history", messages: [] });
  await f.send(one, { type: "message", text: "Olá" });
  expect(one.events.at(-1)?.type).toBe("error");
  await f.send(one, { type: "join", name: "Maria" });
  expect(two.events.at(-1)).toEqual({ type: "presence", count: 1 });
  await f.send(one, { type: "message", text: "Olá" });
  expect(two.events.at(-1)).toMatchObject({
    type: "message",
    message: { name: "Maria", text: "Olá" },
  });
  expect(JSON.stringify(two.events)).not.toContain("192.0.2");
  expect(JSON.stringify([...f.stored])).not.toContain("192.0.2");
  await f.send(one, { type: "join", name: "Outro" });
  expect(one.events.at(-1)?.type).toBe("error");
});

it("restaura histórico e apelido/limite após hibernação", async () => {
  const f = await fixture();
  const one = await f.connect();
  await f.send(one, { type: "join", name: "Maria" });
  await f.send(one, { type: "message", text: "Antes" });
  await f.restart();
  await f.send(one, { type: "message", text: "Depois" });
  const two = await f.connect("192.0.2.2");
  expect(two.events[0]?.messages as unknown[]).toHaveLength(2);
  expect(two.events.at(-1)).toEqual({ type: "presence", count: 1 });
});

it("limita frames da conexão e conexões simultâneas por identidade", async () => {
  const f = await fixture();
  const one = await f.connect();
  await f.connect();
  await f.connect();
  expect((await f.room.fetch(request())).status).toBe(429);
  for (let index = 0; index < 7; index++) await f.send(one, {});
  expect(one.closed).toBe(true);
});

it("limita reconexões por IP mesmo após recriar objeto", async () => {
  const f = await fixture();
  for (let index = 0; index < 10; index++) (await f.connect()).close();
  await f.restart();
  expect((await f.room.fetch(request())).status).toBe(429);
});

it("limita mensagens por identidade compartilhada entre sockets", async () => {
  vi.useFakeTimers();
  const f = await fixture();
  const sockets = [await f.connect(), await f.connect(), await f.connect()];
  for (const socket of sockets) {
    await f.send(socket, { type: "join", name: "Maria" });
    for (let i = 0; i < 5; i++)
      await f.send(socket, { type: "message", text: "Olá" });
  }
  vi.advanceTimersByTime(10_001);
  await f.send(sockets[0]!, { type: "message", text: "Excesso" });
  expect(sockets[0]!.events.at(-1)).toMatchObject({
    type: "error",
    message: expect.stringContaining("Aguarde um minuto"),
  });
});

it("mantém só 100 mensagens e alarmes removem histórico e identidades expirados", async () => {
  vi.useFakeTimers();
  const f = await fixture();
  const one = await f.connect();
  await f.send(one, { type: "join", name: "Maria" });
  for (let i = 0; i < 101; i++) {
    vi.advanceTimersByTime(61_000);
    await f.send(one, { type: "message", text: `Mensagem ${i}` });
  }
  const two = await f.connect("192.0.2.2");
  expect(two.events[0]?.messages).toHaveLength(100);
  vi.advanceTimersByTime(24 * 60 * 60 * 1000 + 1);
  await f.room.alarm();
  expect(f.stored.get("chat")).toMatchObject({ messages: [], identities: [] });
  expect(f.ctx.storage.setAlarm).toHaveBeenCalled();
});

it("retira presença no fechamento e kill switch bloqueia sockets existentes", async () => {
  const env = { CHAT_ENABLED: "true" };
  const f = await fixture(env);
  const one = await f.connect();
  const two = await f.connect("192.0.2.2");
  await f.send(one, { type: "join", name: "Maria" });
  f.room.webSocketClose(one);
  expect(two.events.at(-1)).toEqual({ type: "presence", count: 0 });
  env.CHAT_ENABLED = "false";
  await f.send(one, { type: "message", text: "Bloqueada" });
  expect(one.closed).toBe(true);
  expect(one.events.at(-1)).toMatchObject({
    type: "error",
    message: "Chat temporariamente suspenso.",
  });
  expect((await f.room.fetch(request())).status).toBe(503);
});

it("não transmite nem mantém mensagem cuja persistência falhou e omite erros internos", async () => {
  const f = await fixture();
  const one = await f.connect();
  await f.send(one, { type: "join", name: "Maria" });
  const write = f.ctx.storage.put;
  f.ctx.storage.put = vi.fn(async () => {
    throw new Error("detalhe interno sensível");
  });
  await f.send(one, {
    type: "message",
    text: "Não persistida",
    requestId: "falha-1",
  });
  expect(one.events.at(-1)).toMatchObject({
    type: "error",
    message: "Não foi possível enviar. Tente novamente.",
    requestId: "falha-1",
  });
  expect(
    one.events.some((event) => ["message", "ack"].includes(String(event.type))),
  ).toBe(false);
  f.ctx.storage.put = write;
  const two = await f.connect("192.0.2.2");
  expect(two.events[0]).toEqual({ type: "history", messages: [] });
});

it("não confirma mensagem antes de conseguir agendar sua retenção", async () => {
  const f = await fixture();
  const one = await f.connect();
  await f.send(one, { type: "join", name: "Maria" });
  const schedule = f.ctx.storage.setAlarm;
  f.ctx.storage.setAlarm = vi.fn(async () => {
    throw new Error("Alarme indisponível");
  });
  await f.send(one, { type: "message", text: "Sem alarme" });
  expect(one.events.at(-1)?.type).toBe("error");
  expect(f.stored.get("chat")).toMatchObject({ messages: [] });
  f.ctx.storage.setAlarm = schedule;
  await f.restart();
  const two = await f.connect("192.0.2.2");
  expect(two.events[0]).toEqual({ type: "history", messages: [] });
});

it("aceita correlação opcional e rejeita identificadores inválidos", () => {
  expect(
    parseChatEvent(
      JSON.stringify({ type: "message", text: "Olá", requestId: "envio-1" }),
    ),
  ).toEqual({ type: "message", text: "Olá", requestId: "envio-1" });
  expect(
    parseChatEvent(JSON.stringify({ type: "message", text: "Olá" })),
  ).toEqual({ type: "message", text: "Olá" });
  for (const requestId of [null, 12, "", "x".repeat(65), "a b", "a\nb"])
    expect(() =>
      parseChatEvent(
        JSON.stringify({ type: "message", text: "Olá", requestId }),
      ),
    ).toThrow();
});

it("confirma somente ao remetente após persistir, sem gravar ou transmitir correlação", async () => {
  const f = await fixture();
  const one = await f.connect();
  const two = await f.connect("192.0.2.2");
  await f.send(one, { type: "join", name: "Maria" });
  const write = f.ctx.storage.put;
  let finish: (() => void) | undefined;
  f.ctx.storage.put = async (key, value) => {
    await new Promise<void>((resolve) => {
      finish = resolve;
    });
    await write(key, value);
  };
  const sending = f.send(one, {
    type: "message",
    text: "Olá",
    requestId: "privado-1",
  });
  await vi.waitFor(() => expect(finish).toBeTypeOf("function"));
  expect(one.events.some((event) => event.type === "ack")).toBe(false);
  expect(two.events.some((event) => event.type === "message")).toBe(false);
  finish!();
  await sending;
  expect(one.events.at(-1)).toEqual({ type: "ack", requestId: "privado-1" });
  expect(two.events.at(-1)).toMatchObject({
    type: "message",
    message: { text: "Olá" },
  });
  expect(JSON.stringify(two.events)).not.toContain("privado-1");
  expect(JSON.stringify([...f.stored])).not.toContain("privado-1");
  f.ctx.storage.put = write;
  const three = await f.connect("192.0.2.3");
  expect(JSON.stringify(three.events)).not.toContain("privado-1");
  // Cliente antigo continua recebendo o eco, sem confirmação nova inesperada.
  await f.send(one, { type: "message", text: "Legado" });
  expect(one.events.at(-1)).toMatchObject({
    type: "message",
    message: { text: "Legado" },
  });
});
