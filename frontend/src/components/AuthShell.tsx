import type { PropsWithChildren } from "react";
import { Link } from "react-router-dom";

type AuthShellProps = PropsWithChildren<{
  title: string;
  description: string;
  alternateLabel: string;
  alternateTo: string;
}>;

export default function AuthShell({
  title,
  description,
  alternateLabel,
  alternateTo,
  children,
}: AuthShellProps) {
  return (
    <main className="auth-shell">
      <section className="auth-panel auth-panel-hero">
        <p className="eyebrow">RelayX Phase 1</p>
        <h1>{title}</h1>
        <p>{description}</p>
        <div className="hero-grid">
          <div>
            <strong>Auth</strong>
            <span>JWT access + refresh tokens</span>
          </div>
          <div>
            <strong>Chat</strong>
            <span>FastAPI WebSockets with DB persistence</span>
          </div>
          <div>
            <strong>Storage</strong>
            <span>PostgreSQL users and messages</span>
          </div>
          <div>
            <strong>Next</strong>
            <span>Redis and scaling in Phase 2</span>
          </div>
        </div>
      </section>

      <section className="auth-panel auth-panel-form">
        {children}
        <p className="alternate-link">
          <Link to={alternateTo}>{alternateLabel}</Link>
        </p>
      </section>
    </main>
  );
}
