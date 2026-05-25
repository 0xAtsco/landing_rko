import type { PropsWithChildren } from "react";

type AssetKind = "case" | "og" | "hero";

const sizes = {
  case: { width: 1600, height: 1000 },
  og: { width: 1200, height: 630 },
  hero: { width: 1800, height: 1200 },
} as const;

type AssetFrameProps = PropsWithChildren<{
  kind: AssetKind;
  label?: string;
}>;

export function AssetFrame({ kind, label, children }: AssetFrameProps) {
  const size = sizes[kind];

  return (
    <main
      className="asset-frame relative isolate overflow-hidden bg-[#020817] text-white"
      style={{ width: size.width, height: size.height }}
    >
      <div aria-hidden="true" className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_24%_18%,rgba(34,211,238,0.28),transparent_34rem),radial-gradient(circle_at_78%_22%,rgba(124,58,237,0.28),transparent_30rem),radial-gradient(circle_at_50%_82%,rgba(14,165,233,0.18),transparent_34rem),linear-gradient(180deg,#020817_0%,#06172d_48%,#020817_100%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(125,211,252,0.055)_1px,transparent_1px),linear-gradient(90deg,rgba(125,211,252,0.045)_1px,transparent_1px)] bg-[size:48px_48px] opacity-70 [mask-image:radial-gradient(circle_at_center,black,transparent_82%)]" />
        <div className="absolute left-1/2 top-1/2 size-[820px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[conic-gradient(from_180deg,rgba(34,211,238,0.22),rgba(124,58,237,0.26),rgba(59,130,246,0.12),rgba(34,211,238,0.22))] blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_48%,rgba(0,0,0,0.42)_100%)]" />
      </div>
      {label ? (
        <div className="absolute left-10 top-8 z-20 rounded-full border border-cyan-200/20 bg-white/[0.06] px-4 py-2 font-mono text-sm uppercase tracking-[0.18em] text-cyan-100 backdrop-blur-xl">
          {label}
        </div>
      ) : null}
      {children}
    </main>
  );
}

export function GlassPanel({ children, className = "" }: PropsWithChildren<{ className?: string }>) {
  return (
    <div className={`relative overflow-hidden rounded-[28px] border border-white/12 bg-[#07172d]/78 shadow-[0_34px_120px_rgba(0,0,0,0.34),inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-xl ${className}`}>
      <div aria-hidden="true" className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-200/70 to-transparent" />
      {children}
    </div>
  );
}

export function WindowDots() {
  return (
    <div className="flex gap-3" aria-hidden="true">
      <span className="size-4 rounded-full bg-rose-300/80" />
      <span className="size-4 rounded-full bg-amber-300/80" />
      <span className="size-4 rounded-full bg-emerald-300/80" />
    </div>
  );
}

export function StatusPill({ children, tone = "cyan" }: PropsWithChildren<{ tone?: "cyan" | "violet" | "green" | "slate" }>) {
  const toneClass = {
    cyan: "border-cyan-200/25 bg-cyan-200/12 text-cyan-100",
    violet: "border-violet-200/25 bg-violet-300/12 text-violet-100",
    green: "border-emerald-200/25 bg-emerald-300/12 text-emerald-100",
    slate: "border-white/12 bg-white/[0.06] text-slate-200",
  }[tone];

  return (
    <span className={`rounded-full border px-4 py-2 text-sm font-semibold ${toneClass}`}>
      {children}
    </span>
  );
}
