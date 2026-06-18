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
  const isExternal = href.startsWith("http");

  return (
    <a
      href={href}
      target={isExternal ? "_blank" : undefined}
      rel={isExternal ? "noreferrer" : undefined}
      data-analytics={analytics}
      className={cn(
        "group relative inline-flex min-h-12 shrink-0 items-center justify-center gap-2 overflow-hidden whitespace-nowrap rounded-lg px-5 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal-strong motion-safe:hover:-translate-y-0.5 sm:px-6",
        variant === "primary"
          ? "bg-signal-strong text-[var(--surface-base)] shadow-[0_0_34px_rgb(var(--signal-rgb)/0.22),inset_0_1px_0_rgba(255,255,255,0.55)] hover:bg-[var(--signal-hover)]"
          : "border border-signal/35 bg-transparent text-[#dffffc] shadow-[inset_0_1px_0_rgb(var(--signal-rgb)/0.12)] hover:border-signal/55 hover:bg-signal/[0.08] md:backdrop-blur-md",
        className,
      )}
    >
      <span
        aria-hidden="true"
        className="absolute left-1/2 top-1/2 size-28 -translate-x-1/2 -translate-y-1/2 rounded-full bg-signal-bright/25 opacity-0 blur-lg transition-opacity duration-300 group-hover:opacity-60"
      />
      <span className="absolute inset-0 translate-x-[-120%] bg-gradient-to-r from-transparent via-white/45 to-transparent transition duration-700 group-hover:translate-x-[120%]" />
      <span className="relative z-10">{children}</span>
      <ArrowRight className="relative z-10 size-4 transition group-hover:translate-x-0.5" />
    </a>
  );
}
