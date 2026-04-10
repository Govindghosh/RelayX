import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import AuthShell from "../components/auth/AuthShell";
import { APP_ROUTES } from "../constants/storage";
import { LoginSchema, type LoginFormData } from "../types/schemas";
import axiosInstance from "../api/axiosInstance";
import SummaryApi from "../api/SummaryApi";
import type { Session } from "../types/session";
import { useAppDispatch } from "../store";
import { setCredentials } from "../store/slices/authSlice";

type LoginPageProps = {
  onAuthenticated: (session: Session) => void;
};

export default function LoginPage({ onAuthenticated }: LoginPageProps) {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(LoginSchema),
  });

  async function onSubmit(data: LoginFormData) {
    setError("");
    setIsSubmitting(true);

    try {
      const response = await axiosInstance({
        ...SummaryApi.auth.login,
        data,
      });
      
      const sessionData = {
        accessToken: response.data.access_token,
        refreshToken: response.data.refresh_token,
        user: response.data.user,
      };

      dispatch(setCredentials({ 
        user: response.data.user, 
        token: response.data.access_token 
      }));
      
      onAuthenticated(sessionData);
      navigate(APP_ROUTES.chat);
    } catch (submitError: any) {
      setError(submitError.response?.data?.message || "Unable to login");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthShell
      alternateLabel="Need an account? Create one"
      alternateTo={APP_ROUTES.signup}
      description="Sign in to the RelayX Phase 1 workspace. Your JWT session will be stored locally and refreshed when needed."
      mode="login"
      title="Welcome back"
    >
      <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-200" htmlFor="login-email">
            Email
          </label>
          <input
            {...register("email")}
            className={`w-full rounded-2xl border bg-slate-950/50 px-4 py-3 text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-cyan-300/40 focus:bg-slate-950/70 ${
              errors.email ? "border-rose-400" : "border-white/10"
            }`}
            id="login-email"
            placeholder="name@example.com"
          />
          {errors.email && <p className="text-xs text-rose-400">{errors.email.message}</p>}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-200" htmlFor="login-password">
            Password
          </label>
          <input
            {...register("password")}
            className={`w-full rounded-2xl border bg-slate-950/50 px-4 py-3 text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-cyan-300/40 focus:bg-slate-950/70 ${
              errors.password ? "border-rose-400" : "border-white/10"
            }`}
            id="login-password"
            placeholder="At least 8 characters"
            type="password"
          />
          {errors.password && <p className="text-xs text-rose-400">{errors.password.message}</p>}
        </div>

        {error ? <p className="rounded-2xl border border-rose-400/25 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">{error}</p> : null}

        <button
          className="w-full rounded-full bg-gradient-to-r from-cyan-400 via-teal-400 to-amber-300 px-5 py-3 text-sm font-bold text-slate-950 transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-50"
          disabled={isSubmitting}
          type="submit"
        >
          {isSubmitting ? "Signing in..." : "Login"}
        </button>
      </form>
    </AuthShell>
  );
}
