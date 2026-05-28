import type { PropsWithChildren } from "react";
import { cn } from "@/lib/utils";

type SectionHeadingProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  className?: string;
  centered?: boolean;
  tone?: "cyan" | "violet";
  titleClassName?: string;
};

export function SectionHeading({
  eyebrow,
  title,
  description,
  className,
  centered = false,
  tone = "cyan",
  titleClassName,
}: SectionHeadingProps) {
  return (
    <div className={cn("max-w-3xl", centered && "mx-auto text-center", className)}>
      {eyebrow ? (
        <p
          className={cn(
            "text-sm font-medium uppercase tracking-[0.22em]",
            tone === "cyan" ? "text-signal/80" : "text-signal/80",
          )}
        >
          {eyebrow}
        </p>
      ) : null}
      <h2 className={cn("mt-3 text-3xl font-semibold leading-[1.02] text-white sm:text-5xl", titleClassName)}>
        {title}
      </h2>
      {description ? <p className="mt-4 text-base leading-7 text-slate-300">{description}</p> : null}
    </div>
  );
}

type GlassCardProps = PropsWithChildren<{
  className?: string;
  interactive?: boolean;
}>;

export function GlassCard({ children, className, interactive = false }: GlassCardProps) {
  return (
    <article
      className={cn(
        "relative overflow-hidden rounded-lg border border-white/10 bg-[var(--surface-2)]/78 p-5 shadow-[0_18px_60px_rgba(0,0,0,0.14)] backdrop-blur-xl",
        interactive && "transition duration-300 hover:border-signal/25 hover:bg-white/[0.06]",
        className,
      )}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-signal/40 to-transparent opacity-70"
      />
      {children}
    </article>
  );
}

export function TechPanel({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-signal/14 bg-black/20 p-4 font-mono text-xs text-slate-300 backdrop-blur-xl">
      <div className="mb-3 flex justify-between text-signal-bright">
        <span>{label}</span>
        <span>{value}</span>
      </div>
      <div className="grid grid-cols-8 gap-1" aria-hidden="true">
        {Array.from({ length: 32 }, (_, index) => (
          <span
            key={index}
            className={cn(
              "h-2 rounded-sm",
              index % 5 === 0 ? "bg-signal-strong" : index % 3 === 0 ? "bg-signal-strong/55" : "bg-white/10",
            )}
          />
        ))}
      </div>
    </div>
  );
}
