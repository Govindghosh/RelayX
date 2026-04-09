export const ENV = {
  authApiUrl: import.meta.env.VITE_AUTH_API_URL ?? "http://localhost:8000",
  chatApiUrl: import.meta.env.VITE_CHAT_API_URL ?? "http://localhost:8001",
  chatWsUrl: import.meta.env.VITE_CHAT_WS_URL ?? "ws://localhost:8001/ws",
} as const;
