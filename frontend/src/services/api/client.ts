import { ENV } from "../../config/env";
import type { AccessTokenResponse, AuthResponse, ChatMessage, RelayUser, Session } from "../../types/session";

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

async function requestJson<T>(url: string, init?: RequestInit, accessToken?: string): Promise<T> {
  const headers = new Headers(init?.headers);
  headers.set("Content-Type", "application/json");

  if (accessToken) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  }

  const response = await fetch(url, {
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
  return requestJson<AuthResponse>(`${ENV.authApiUrl}/signup`, {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export async function login(email: string, password: string): Promise<AuthResponse> {
  return requestJson<AuthResponse>(`${ENV.authApiUrl}/login`, {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export async function refreshAccessToken(refreshToken: string): Promise<AccessTokenResponse> {
  return requestJson<AccessTokenResponse>(`${ENV.authApiUrl}/refresh`, {
    method: "POST",
    body: JSON.stringify({ refresh_token: refreshToken }),
  });
}

export async function getCurrentUser(accessToken: string): Promise<RelayUser> {
  return requestJson<RelayUser>(`${ENV.authApiUrl}/me`, undefined, accessToken);
}

export async function listUsers(accessToken: string): Promise<RelayUser[]> {
  return requestJson<RelayUser[]>(`${ENV.authApiUrl}/users`, undefined, accessToken);
}

export async function getMessages(peerId: string, accessToken: string): Promise<ChatMessage[]> {
  return requestJson<ChatMessage[]>(`${ENV.chatApiUrl}/messages/${peerId}`, undefined, accessToken);
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
