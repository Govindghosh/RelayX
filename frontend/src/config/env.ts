export const ENV = {
  authApiUrl: import.meta.env.VITE_AUTH_API_URL,
  chatApiUrl: import.meta.env.VITE_CHAT_API_URL,
  chatWsUrl: import.meta.env.VITE_CHAT_WS_URL,
} as const;
