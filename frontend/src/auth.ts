export type RelayUser = {
  id: string;
  email: string;
  created_at: string;
};

export type Session = {
  accessToken: string;
  refreshToken: string;
  user: RelayUser;
};

const STORAGE_KEY = "relayx.session";

export function loadSession(): Session | null {
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as Session;
  } catch {
    window.localStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

export function saveSession(session: Session | null): void {
  if (!session) {
    window.localStorage.removeItem(STORAGE_KEY);
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}
