import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";

import { signup } from "../api/client";
import type { Session } from "../auth";
import AuthShell from "../components/AuthShell";

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
    setIsSubmitting(true);
    setError("");

    try {
      const response = await signup(email, password);
      onAuthenticated({
        accessToken: response.access_token,
        refreshToken: response.refresh_token,
        user: response.user,
      });
      navigate("/chat");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to sign up");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthShell
      title="Create your workspace"
      description="Start with a simple, direct RelayX setup before Redis and Kafka enter the picture."
      alternateLabel="Already have an account? Login"
      alternateTo="/login"
    >
      <form className="auth-form" onSubmit={handleSubmit}>
        <label>
          <span>Email</span>
          <input
            autoComplete="email"
            onChange={(event) => setEmail(event.target.value)}
            placeholder="name@example.com"
            type="email"
            value={email}
          />
        </label>

        <label>
          <span>Password</span>
          <input
            autoComplete="new-password"
            minLength={8}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="At least 8 characters"
            type="password"
            value={password}
          />
        </label>

        {error ? <p className="form-error">{error}</p> : null}

        <button className="primary-button" disabled={isSubmitting} type="submit">
          {isSubmitting ? "Creating account..." : "Signup"}
        </button>
      </form>
    </AuthShell>
  );
}
