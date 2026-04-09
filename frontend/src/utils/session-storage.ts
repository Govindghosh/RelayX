import { STORAGE_KEYS } from "../constants/storage";
import type { Session } from "../types/session";

export function loadStoredSession(): Session | null {
  const rawValue = window.localStorage.getItem(STORAGE_KEYS.session);
  if (!rawValue) {
    return null;
  }

  try {
    return JSON.parse(rawValue) as Session;
  } catch {
    window.localStorage.removeItem(STORAGE_KEYS.session);
    return null;
  }
}

export function saveStoredSession(session: Session | null): void {
  if (!session) {
    window.localStorage.removeItem(STORAGE_KEYS.session);
    return;
  }

  window.localStorage.setItem(STORAGE_KEYS.session, JSON.stringify(session));
}
