import { useEffect, useState } from "react";
import { Navigate, Route, Routes, useNavigate } from "react-router-dom";

import { ApiError, getCurrentUser, refreshAccessToken } from "./api/client";
import { loadSession, saveSession, type Session } from "./auth";
import ChatPage from "./pages/ChatPage";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";

export default function App() {
  const navigate = useNavigate();
  const [session, setSession] = useState<Session | null>(() => loadSession());
  const [isBootstrapping, setIsBootstrapping] = useState(true);

  function updateSession(nextSession: Session | null) {
    setSession(nextSession);
    saveSession(nextSession);
  }

  function handleLogout() {
    updateSession(null);
    navigate("/login");
  }

  useEffect(() => {
    let isActive = true;

    async function bootstrapSession() {
      if (!session) {
        setIsBootstrapping(false);
        return;
      }

      try {
        const currentUser = await getCurrentUser(session.accessToken);
        if (!isActive) {
          return;
        }

        updateSession({
          ...session,
          user: currentUser,
        });
      } catch (error) {
        const canRefresh = error instanceof ApiError && error.status === 401;
        if (!canRefresh) {
          handleLogout();
          return;
        }

        try {
          const refreshed = await refreshAccessToken(session.refreshToken);
          const currentUser = await getCurrentUser(refreshed.access_token);
          if (!isActive) {
            return;
          }

          updateSession({
            ...session,
            accessToken: refreshed.access_token,
            user: currentUser,
          });
        } catch {
          if (isActive) {
            handleLogout();
          }
        }
      } finally {
        if (isActive) {
          setIsBootstrapping(false);
        }
      }
    }

    void bootstrapSession();

    return () => {
      isActive = false;
    };
  }, []);

  if (isBootstrapping) {
    return (
      <main className="loading-shell">
        <div className="loading-card">
          <p className="eyebrow">RelayX</p>
          <h1>Preparing workspace</h1>
          <p>Checking your session and warming up the chat client.</p>
        </div>
      </main>
    );
  }

  return (
    <Routes>
      <Route
        element={session ? <Navigate replace to="/chat" /> : <LoginPage onAuthenticated={updateSession} />}
        path="/login"
      />
      <Route
        element={session ? <Navigate replace to="/chat" /> : <SignupPage onAuthenticated={updateSession} />}
        path="/signup"
      />
      <Route
        element={
          session ? (
            <ChatPage onLogout={handleLogout} onSessionChange={updateSession} session={session} />
          ) : (
            <Navigate replace to="/login" />
          )
        }
        path="/chat"
      />
      <Route element={<Navigate replace to={session ? "/chat" : "/login"} />} path="*" />
    </Routes>
  );
}
