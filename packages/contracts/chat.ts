export interface ChatMessage {
  id: string;
  name: string;
  text: string;
  createdAt: string;
}

export type ChatClientEvent =
  | { type: "join"; name: string }
  | { type: "message"; text: string; requestId?: string };

export type ChatServerEvent =
  | { type: "history"; messages: ChatMessage[] }
  | { type: "message"; message: ChatMessage }
  | { type: "ack"; requestId: string }
  | { type: "presence"; count: number }
  | { type: "error"; message: string; requestId?: string };

export const chatLimits = {
  nameMin: 2,
  nameMax: 24,
  textMax: 280,
  historyMax: 100,
  historyAgeMs: 24 * 60 * 60 * 1000,
} as const;

export class ChatValidationError extends Error {}

function chatRecord(raw: string): Record<string, unknown> {
  if (new TextEncoder().encode(raw).length > 4096)
    throw new ChatValidationError("Mensagem muito grande.");
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    throw new ChatValidationError("Mensagem inválida.");
  }
  if (!data || typeof data !== "object" || Array.isArray(data))
    throw new ChatValidationError("Mensagem inválida.");
  return data as Record<string, unknown>;
}

function parseRequestId(value: unknown): { requestId?: string } {
  if (value === undefined) return {};
  if (typeof value !== "string" || !/^[A-Za-z0-9_-]{1,64}$/u.test(value))
    throw new ChatValidationError("Identificador de envio inválido.");
  return { requestId: value };
}

export function parseChatEvent(raw: string): ChatClientEvent {
  const item = chatRecord(raw);
  const field = item.type === "join" ? "name" : "text";
  if (item.type !== "join" && item.type !== "message")
    throw new ChatValidationError("Tipo de mensagem inválido.");
  if (typeof item[field] !== "string")
    throw new ChatValidationError("Texto inválido.");
  const value = item[field].normalize("NFC").trim();
  if (/[\p{Cc}\p{Cf}]/u.test(value))
    throw new ChatValidationError(
      "Não use quebras de linha ou caracteres de controle.",
    );
  const length = Array.from(value).length;
  const minimum = item.type === "join" ? chatLimits.nameMin : 1;
  const maximum =
    item.type === "join" ? chatLimits.nameMax : chatLimits.textMax;
  if (length < minimum || length > maximum)
    throw new ChatValidationError(
      item.type === "join"
        ? "Use um apelido de 2 a 24 caracteres."
        : "Escreva de 1 a 280 caracteres.",
    );
  return item.type === "join"
    ? { type: "join", name: value }
    : {
        type: "message",
        text: value,
        ...parseRequestId(item.requestId),
      };
}
