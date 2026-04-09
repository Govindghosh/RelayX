import { MessageCircleMore, ShieldCheck, Sparkles } from "lucide-react";

type AnimatedRelayIconProps = {
  size?: "sm" | "md";
};

export default function AnimatedRelayIcon({ size = "md" }: AnimatedRelayIconProps) {
  const frameClass = size === "sm" ? "relative h-14 w-14 rounded-2xl" : "relative h-24 w-24 rounded-[2rem]";
  const iconClass = size === "sm" ? "h-6 w-6" : "h-10 w-10";

  return (
    <div className={`${frameClass} bg-gradient-to-br from-teal-500 via-cyan-500 to-amber-300 p-[1px] shadow-2xl shadow-teal-900/20`}>
      <div className="relative flex h-full w-full items-center justify-center overflow-hidden rounded-[inherit] bg-slate-950 text-white">
        <div className="absolute inset-2 rounded-[inherit] border border-white/15 animate-spin-slow" />
        <div className="absolute inset-3 rounded-[inherit] border border-dashed border-cyan-200/20 animate-spin-reverse" />
        <MessageCircleMore className={`${iconClass} animate-float text-cyan-100`} strokeWidth={1.8} />
        <ShieldCheck className="absolute bottom-2 right-2 h-4 w-4 animate-pulse text-emerald-200" strokeWidth={2.2} />
        <Sparkles className="absolute left-2 top-2 h-4 w-4 animate-twinkle text-amber-200" strokeWidth={2.2} />
      </div>
    </div>
  );
}
