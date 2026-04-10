import { useEffect, useState } from "react";
import { Navigate, Route, Routes, useNavigate } from "react-router-dom";
import { LoaderCircle } from "lucide-react";

import { APP_ROUTES } from "../constants/storage";
import ChatPage from "../pages/ChatPage";
import LoginPage from "../pages/LoginPage";
import SignupPage from "../pages/SignupPage";
import { useAppDispatch, useAppSelector } from "../store";
import { setCredentials, logout as logoutAction } from "../store/slices/authSlice";
import axiosInstance, { getAccessToken } from "../api/axiosInstance";
import SummaryApi from "../api/SummaryApi";
import type { Session } from "../types/session";

export default function App() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { isAuthenticated, user, token } = useAppSelector((state) => state.auth);
  const [isBootstrapping, setIsBootstrapping] = useState(true);

  const session: Session | null = isAuthenticated && user && token ? {
    accessToken: token,
    refreshToken: "", // Refresh token not persistence in this slice yet
    user: user,
  } : null;

  async function handleLogout() {
    try {
      if (isAuthenticated) {
        await axiosInstance.post(SummaryApi.auth.logout.url);
      }
    } catch {
      // Ignore failures - local logout is priority
    } finally {
      dispatch(logoutAction());
      navigate(APP_ROUTES.login);
    }
  }

  function handleAuthenticated(newSession: Session | null) {
    if (!newSession) {
      dispatch(logoutAction());
      return;
    }
    dispatch(setCredentials({
      user: newSession.user,
      token: newSession.accessToken,
    }));
  }

  useEffect(() => {
    let isActive = true;

    async function bootstrapSession() {
      try {
        // Attempt to get current user. 
        // If access token is missing/expired, axios interceptor will try to refresh using cookie.
        const response = await axiosInstance(SummaryApi.auth.me);
        if (!isActive) return;

        // If we get here, we either had a valid access token or successfully refreshed.
        // We need to capture the access token if it was refreshed.
        const currentToken = getAccessToken();
        
        dispatch(setCredentials({
          user: response.data,
          token: currentToken,
        }));
      } catch (error) {
        if (isActive) {
          // Both access and refresh tokens failed/missing
          handleLogout();
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
            <p className="mt-2 text-sm text-slate-400">Verifying session and connecting to services.</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <Routes>
      <Route
        element={isAuthenticated ? <Navigate replace to={APP_ROUTES.chat} /> : <LoginPage onAuthenticated={handleAuthenticated} />}
        path={APP_ROUTES.login}
      />
      <Route
        element={isAuthenticated ? <Navigate replace to={APP_ROUTES.chat} /> : <SignupPage onAuthenticated={handleAuthenticated} />}
        path={APP_ROUTES.signup}
      />
      <Route
        element={
          isAuthenticated && session ? (
            <ChatPage onLogout={handleLogout} onSessionChange={handleAuthenticated} session={session} />
          ) : (
            <Navigate replace to={APP_ROUTES.login} />
          )
        }
        path={APP_ROUTES.chat}
      />
      <Route element={<Navigate replace to={isAuthenticated ? APP_ROUTES.chat : APP_ROUTES.login} />} path="*" />
    </Routes>
  );
}
