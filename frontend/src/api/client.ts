import type { RelayUser, Session } from "../auth";

const AUTH_API_URL = import.meta.env.VITE_AUTH_API_URL ?? "http://localhost:8000";
const CHAT_API_URL = import.meta.env.VITE_CHAT_API_URL ?? "http://localhost:8001";
export const CHAT_WS_URL = import.meta.env.VITE_CHAT_WS_URL ?? "ws://localhost:8001/ws";

export type AuthResponse = {
  access_token: string;
  refresh_token: string;
  token_type: string;
  user: RelayUser;
};

export type AccessTokenResponse = {
  access_token: string;
  token_type: string;
};

export type ChatMessage = {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  created_at: string;
};

export type ChatSocketEvent = {
  type: "message" | "error";
  message?: ChatMessage;
  error?: string;
};

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

async function requestJson<T>(
  baseUrl: string,
  path: string,
  init?: RequestInit,
  accessToken?: string,
): Promise<T> {
  const headers = new Headers(init?.headers);
  headers.set("Content-Type", "application/json");

  if (accessToken) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  }

  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers,
  });

  const rawText = await response.text();
  const body = rawText ? JSON.parse(rawText) : null;

  if (!response.ok) {
    throw new ApiError(body?.detail ?? "Request failed", response.status);
  }

  return body as T;
}

export async function signup(email: string, password: string): Promise<AuthResponse> {
  return requestJson<AuthResponse>(AUTH_API_URL, "/signup", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export async function login(email: string, password: string): Promise<AuthResponse> {
  return requestJson<AuthResponse>(AUTH_API_URL, "/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export async function refreshAccessToken(refreshToken: string): Promise<AccessTokenResponse> {
  return requestJson<AccessTokenResponse>(AUTH_API_URL, "/refresh", {
    method: "POST",
    body: JSON.stringify({ refresh_token: refreshToken }),
  });
}

export async function getCurrentUser(accessToken: string): Promise<RelayUser> {
  return requestJson<RelayUser>(AUTH_API_URL, "/me", undefined, accessToken);
}

export async function listUsers(accessToken: string): Promise<RelayUser[]> {
  return requestJson<RelayUser[]>(AUTH_API_URL, "/users", undefined, accessToken);
}

export async function getMessages(peerId: string, accessToken: string): Promise<ChatMessage[]> {
  return requestJson<ChatMessage[]>(CHAT_API_URL, `/messages/${peerId}`, undefined, accessToken);
}

type WithAuthorizedAccessArgs<T> = {
  session: Session;
  onSessionChange: (session: Session | null) => void;
  onLogout: () => void;
  request: (accessToken: string) => Promise<T>;
};

export async function withAuthorizedAccess<T>({
  session,
  onSessionChange,
  onLogout,
  request,
}: WithAuthorizedAccessArgs<T>): Promise<T> {
  try {
    return await request(session.accessToken);
  } catch (error) {
    if (!(error instanceof ApiError) || error.status !== 401) {
      throw error;
    }

    try {
      const refreshed = await refreshAccessToken(session.refreshToken);
      const nextSession: Session = {
        ...session,
        accessToken: refreshed.access_token,
      };
      onSessionChange(nextSession);
      return await request(nextSession.accessToken);
    } catch (refreshError) {
      onLogout();
      throw refreshError;
    }
  }
}
