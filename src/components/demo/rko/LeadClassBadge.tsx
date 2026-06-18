import { classLabels } from "@/lib/rko/constants";
import type { LeadClass } from "@/lib/rko/types";
import { cn } from "@/lib/utils";

export function LeadClassBadge({ value, pulse = false }: { value: LeadClass; pulse?: boolean }) {
  const className = {
    A: "border-emerald-300/40 bg-emerald-300/12 text-emerald-100 shadow-[0_0_22px_rgba(16,185,129,0.18)]",
    B: "border-signal-strong/40 bg-signal-strong/12 text-signal-bright",
    C: "border-yellow-300/40 bg-yellow-300/12 text-yellow-100",
    D: "border-slate-300/20 bg-slate-300/8 text-slate-300",
    F: "border-rose-300/40 bg-rose-300/12 text-rose-100",
  }[value];

  return <span className={cn("inline-flex h-6 items-center rounded-md border px-2 text-xs font-semibold", className, pulse && "score-pulse")}>{value} · {classLabels[value]}</span>;
}
