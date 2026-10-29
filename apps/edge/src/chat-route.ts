import type { ChatEnvironment } from "./chat-types";

export function chatError(message: string, status: number): Response {
  return Response.json(
    { error: message },
    { status, headers: { "Cache-Control": "no-store" } },
  );
}
export function validChatRequest(request: Request): Response | null {
  if (request.method !== "GET") return chatError("Use GET.", 405);
  if (request.headers.get("Upgrade")?.toLowerCase() !== "websocket")
    return chatError("Conexão WebSocket necessária.", 426);
  const url = new URL(request.url);
  if (request.headers.get("Origin") !== url.origin)
    return chatError("Origem não permitida.", 403);
  return null;
}
export async function fetchChat(request: Request, env: ChatEnvironment) {
  if (env.CHAT_ENABLED === "false")
    return chatError("Chat temporariamente suspenso.", 503);
  const invalid = validChatRequest(request);
  if (invalid) return invalid;
  if (!env.CHAT_ROOM) return chatError("Chat indisponível.", 503);
  try {
    return await env.CHAT_ROOM.get(env.CHAT_ROOM.idFromName("public-v1")).fetch(
      request,
    );
  } catch {
    return chatError("Chat indisponível. Tente novamente.", 503);
  }
}
