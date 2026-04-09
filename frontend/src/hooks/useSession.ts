import { useState } from "react";

import type { Session } from "../types/session";
import { loadStoredSession, saveStoredSession } from "../utils/session-storage";

export function useSession() {
  const [session, setSessionState] = useState<Session | null>(() => loadStoredSession());

  function setSession(nextSession: Session | null) {
    setSessionState(nextSession);
    saveStoredSession(nextSession);
  }

  return { session, setSession };
}
