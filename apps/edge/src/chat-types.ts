export interface ChatSocket {
  send(message: string): void;
  close(code?: number, reason?: string): void;
  serializeAttachment(value: unknown): void;
  deserializeAttachment(): unknown;
}
export interface ChatState {
  storage: {
    get<T>(key: string): Promise<T | undefined>;
    put<T>(key: string, value: T): Promise<void>;
    setAlarm(time: number): Promise<void>;
  };
  blockConcurrencyWhile<T>(callback: () => Promise<T>): Promise<T>;
  acceptWebSocket(socket: ChatSocket): void;
  getWebSockets(): ChatSocket[];
}
export interface ChatEnvironment {
  CHAT_ENABLED?: string;
  CHAT_ROOM?: {
    idFromName(name: string): unknown;
    get(id: unknown): { fetch(request: Request): Promise<Response> };
  };
}
export interface ChatAttachment {
  identity: string;
  name: string | null;
  window: number;
  count: number;
}
