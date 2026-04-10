const AUTH_BASE = import.meta.env.VITE_AUTH_API_URL;
const CHAT_BASE = import.meta.env.VITE_CHAT_API_URL;

const SummaryApi = {
  // Auth Service
  auth: {
    signup: {
      url: `${AUTH_BASE}/api/v1/auth/signup`,
      method: "post",
    },
    login: {
      url: `${AUTH_BASE}/api/v1/auth/login`,
      method: "post",
    },
    refresh: {
      url: `${AUTH_BASE}/api/v1/auth/refresh`,
      method: "post",
    },
    logout: {
      url: `${AUTH_BASE}/api/v1/auth/logout`,
      method: "post",
    },
    me: {
      url: `${AUTH_BASE}/api/v1/auth/me`,
      method: "get",
    },
    listUsers: {
      url: `${AUTH_BASE}/api/v1/auth/users`,
      method: "get",
    },
  },
  
  // Chat Service
  chat: {
    getMessages: {
      url: `${CHAT_BASE}/api/v1/chat/messages`,
      method: "get",
    },
    sendMessage: {
      url: `${CHAT_BASE}/api/v1/chat/messages`,
      method: "post",
    },
    getRooms: {
      url: `${CHAT_BASE}/api/v1/chat/rooms`,
      method: "get",
    },
  },
  
  // Websockets
  ws: {
    chat: import.meta.env.VITE_CHAT_WS_URL,
  }
};

export default SummaryApi;
