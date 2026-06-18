import type { PropsWithChildren } from "react";
import { cn } from "@/lib/utils";

type SectionHeadingProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  className?: string;
  centered?: boolean;
  titleClassName?: string;
};

export function SectionHeading({
  title,
  description,
  className,
  centered = false,
  titleClassName,
}: SectionHeadingProps) {
  return (
    <div className={cn("max-w-3xl", centered && "mx-auto text-center", className)}>
      <h2 className={cn("text-3xl font-semibold leading-[1.02] text-[#f4ffff] sm:text-5xl", titleClassName)}>
        {title}
      </h2>
      {description ? <p className="mt-4 text-base leading-7 text-[#93a3a3]">{description}</p> : null}
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
        "relative overflow-hidden rounded-lg border border-signal/16 bg-[var(--surface-2)]/86 p-5 shadow-[0_18px_60px_rgba(0,0,0,0.22),inset_0_1px_0_rgb(var(--signal-rgb)/0.06)] backdrop-blur-xl",
        interactive && "transition duration-300 hover:border-signal/36 hover:bg-[var(--surface-1)] hover:shadow-[0_22px_70px_rgb(var(--signal-rgb)/0.08)]",
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
  if (!label && !value) return null;

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
