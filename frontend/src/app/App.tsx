import { useEffect, useState } from "react";
import { Navigate, Route, Routes, useNavigate } from "react-router-dom";
import { LoaderCircle } from "lucide-react";

import { APP_ROUTES } from "../constants/storage";
import { useSession } from "../hooks/useSession";
import ChatPage from "../pages/ChatPage";
import LoginPage from "../pages/LoginPage";
import SignupPage from "../pages/SignupPage";
import { ApiError, getCurrentUser, refreshAccessToken } from "../services/api/client";

export default function App() {
  const navigate = useNavigate();
  const { session, setSession } = useSession();
  const [isBootstrapping, setIsBootstrapping] = useState(true);

  function handleLogout() {
    setSession(null);
    navigate(APP_ROUTES.login);
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

        setSession({
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

          setSession({
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
      <main className="flex min-h-screen items-center justify-center bg-slate-950 px-6 text-slate-100">
        <div className="glass-panel flex w-full max-w-lg items-center gap-4 rounded-[2rem] p-6">
          <LoaderCircle className="h-8 w-8 animate-spin text-cyan-200" />
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.32em] text-cyan-200/80">RelayX Startup</p>
            <h1 className="mt-2 font-display text-3xl text-white">Preparing your workspace</h1>
            <p className="mt-2 text-sm text-slate-400">Checking the stored JWT session and reconnecting the chat client.</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <Routes>
      <Route
        element={session ? <Navigate replace to={APP_ROUTES.chat} /> : <LoginPage onAuthenticated={setSession} />}
        path={APP_ROUTES.login}
      />
      <Route
        element={session ? <Navigate replace to={APP_ROUTES.chat} /> : <SignupPage onAuthenticated={setSession} />}
        path={APP_ROUTES.signup}
      />
      <Route
        element={
          session ? (
            <ChatPage onLogout={handleLogout} onSessionChange={setSession} session={session} />
          ) : (
            <Navigate replace to={APP_ROUTES.login} />
          )
        }
        path={APP_ROUTES.chat}
      />
      <Route element={<Navigate replace to={session ? APP_ROUTES.chat : APP_ROUTES.login} />} path="*" />
    </Routes>
  );
}
