import type { PropsWithChildren } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, LockKeyhole, MessageSquareText, Rocket, UserRoundPlus } from "lucide-react";

import AnimatedRelayIcon from "../ui/AnimatedRelayIcon";

type AuthShellProps = PropsWithChildren<{
  title: string;
  description: string;
  alternateLabel: string;
  alternateTo: string;
  mode: "login" | "signup";
}>;

export default function AuthShell({
  title,
  description,
  alternateLabel,
  alternateTo,
  mode,
  children,
}: AuthShellProps) {
  const modeIcon =
    mode === "login" ? <LockKeyhole className="h-4 w-4 text-teal-200" /> : <UserRoundPlus className="h-4 w-4 text-amber-200" />;

  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-950 text-slate-100">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(34,211,238,0.14),_transparent_28rem),radial-gradient(circle_at_bottom_right,_rgba(245,158,11,0.18),_transparent_20rem)]" />
      <div className="relative mx-auto grid min-h-screen w-full max-w-7xl gap-8 px-6 py-10 lg:grid-cols-[1.15fr_28rem] lg:px-10">
        <section className="glass-panel flex flex-col justify-between gap-8 rounded-[2rem] p-8 lg:p-12">
          <div className="space-y-8">
            <div className="flex items-center gap-4">
              <AnimatedRelayIcon />
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.35em] text-cyan-200/80">RelayX Architecture</p>
                <h1 className="font-display text-4xl leading-none text-white md:text-6xl">{title}</h1>
              </div>
            </div>

            <p className="max-w-2xl text-lg leading-8 text-slate-300">{description}</p>

            <div className="grid gap-4 md:grid-cols-2">
              <article className="rounded-3xl border border-white/10 bg-white/5 p-5">
                <div className="mb-4 flex items-center gap-3">
                  <MessageSquareText className="h-5 w-5 text-cyan-200" />
                  <h2 className="font-display text-2xl text-white">Foundation First</h2>
                </div>
                <p className="text-sm leading-7 text-slate-300">
                  Auth, PostgreSQL persistence, and direct WebSocket chat are stable before Redis or Kafka enters the stack.
                </p>
              </article>

              <article className="rounded-3xl border border-white/10 bg-white/5 p-5">
                <div className="mb-4 flex items-center gap-3">
                  <Rocket className="h-5 w-5 text-amber-200" />
                  <h2 className="font-display text-2xl text-white">Readable Layers</h2>
                </div>
                <p className="text-sm leading-7 text-slate-300">
                  Config, controllers, services, routes, validators, workers, and scripts are separated so the codebase is easier to learn.
                </p>
              </article>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-300">
            {modeIcon}
            <span>Tailwind CSS v4 frontend with animated icons and container-first local development.</span>
          </div>
        </section>

        <section className="glass-panel rounded-[2rem] p-6 sm:p-8">
          <div className="mb-8 flex items-center gap-3">
            <AnimatedRelayIcon size="sm" />
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.32em] text-cyan-200/80">Phase 1 Access</p>
              <p className="text-sm text-slate-400">Use your credentials to enter the chat workspace.</p>
            </div>
          </div>

          {children}

          <Link
            className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-cyan-200 transition hover:text-white"
            to={alternateTo}
          >
            {alternateLabel}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </section>
      </div>
    </main>
  );
}
