import { ArrowRight } from "lucide-react";
import type { PropsWithChildren } from "react";
import { cn } from "@/lib/utils";

type MagneticButtonProps = PropsWithChildren<{
  href: string;
  variant?: "primary" | "secondary";
  className?: string;
  analytics?: string;
}>;

export function MagneticButton({
  href,
  variant = "primary",
  className,
  analytics,
  children,
}: MagneticButtonProps) {
  return (
    <a
      href={href}
      data-analytics={analytics}
      className={cn(
        "group relative inline-flex min-h-12 shrink-0 items-center justify-center gap-2 overflow-hidden whitespace-nowrap rounded-lg px-5 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 motion-safe:hover:-translate-y-0.5 sm:px-6",
        variant === "primary"
          ? "bg-cyan-300 text-slate-950 shadow-[0_0_34px_rgba(34,211,238,0.38),inset_0_1px_0_rgba(255,255,255,0.55)] hover:bg-white"
          : "border border-white/15 bg-white/[0.06] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] hover:border-cyan-200/50 hover:bg-white/[0.1] md:backdrop-blur-md",
        className,
      )}
    >
      <span
        aria-hidden="true"
        className="absolute left-1/2 top-1/2 size-28 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/25 opacity-0 blur-lg transition-opacity duration-300 group-hover:opacity-60"
      />
      <span className="absolute inset-0 translate-x-[-120%] bg-gradient-to-r from-transparent via-white/45 to-transparent transition duration-700 group-hover:translate-x-[120%]" />
      <span className="relative z-10">{children}</span>
      <ArrowRight className="relative z-10 size-4 transition group-hover:translate-x-0.5" />
    </a>
  );
}
