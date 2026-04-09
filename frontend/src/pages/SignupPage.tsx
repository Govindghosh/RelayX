import { type FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";

import AuthShell from "../components/auth/AuthShell";
import { APP_ROUTES } from "../constants/storage";
import { signup } from "../services/api/client";
import type { Session } from "../types/session";

type SignupPageProps = {
  onAuthenticated: (session: Session) => void;
};

export default function SignupPage({ onAuthenticated }: SignupPageProps) {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const response = await signup(email, password);
      onAuthenticated({
        accessToken: response.access_token,
        refreshToken: response.refresh_token,
        user: response.user,
      });
      navigate(APP_ROUTES.chat);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to create account");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthShell
      alternateLabel="Already have an account? Login"
      alternateTo={APP_ROUTES.login}
      description="Create a user and enter the chat workspace. This keeps the Phase 1 flow simple and prepares the project for Redis and Kafka later."
      mode="signup"
      title="Create workspace access"
    >
      <form className="space-y-5" onSubmit={handleSubmit}>
        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-200" htmlFor="signup-email">
            Email
          </label>
          <input
            className="w-full rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-cyan-300/40 focus:bg-slate-950/70"
            id="signup-email"
            onChange={(event) => setEmail(event.target.value)}
            placeholder="name@example.com"
            type="email"
            value={email}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-200" htmlFor="signup-password">
            Password
          </label>
          <input
            className="w-full rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-cyan-300/40 focus:bg-slate-950/70"
            id="signup-password"
            minLength={8}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="At least 8 characters"
            type="password"
            value={password}
          />
        </div>

        {error ? <p className="rounded-2xl border border-rose-400/25 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">{error}</p> : null}

        <button
          className="w-full rounded-full bg-gradient-to-r from-cyan-400 via-teal-400 to-amber-300 px-5 py-3 text-sm font-bold text-slate-950 transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-50"
          disabled={isSubmitting}
          type="submit"
        >
          {isSubmitting ? "Creating account..." : "Signup"}
        </button>
      </form>
    </AuthShell>
  );
}
