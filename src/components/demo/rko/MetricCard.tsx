import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function MetricCard({ label, value, hint, icon: Icon, tone = "cyan" }: { label: string; value: string | number; hint?: string; icon?: LucideIcon; tone?: "cyan" | "violet" | "green" | "yellow" | "red" }) {
  const toneClass = {
    cyan: "from-signal-strong/20 text-signal-bright shadow-signal-strong/10",
    violet: "from-signal-strong/20 text-signal-bright shadow-signal-strong/10",
    green: "from-emerald-300/20 text-emerald-100 shadow-emerald-500/10",
    yellow: "from-yellow-300/20 text-yellow-100 shadow-yellow-500/10",
    red: "from-rose-300/20 text-rose-100 shadow-rose-500/10",
  }[tone];

  return (
    <div className={cn("min-w-0 rounded-lg border border-white/10 bg-gradient-to-br to-white/[0.045] p-4 shadow-2xl backdrop-blur-xl", toneClass)}>
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-slate-300">{label}</p>
        {Icon ? <Icon className="size-4 shrink-0" /> : null}
      </div>
      <div className="mt-3 text-3xl font-semibold tracking-normal text-white">{value}</div>
      {hint ? <p className="mt-2 text-xs leading-5 text-slate-400">{hint}</p> : null}
    </div>
  );
}
