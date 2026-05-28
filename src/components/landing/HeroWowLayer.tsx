"use client";

import { useEffect, useRef } from "react";
import { useMotionMode } from "@/lib/motion";

const cards = [
  { label: "Landing", metric: "hook", className: "left-5 top-[38%]" },
  { label: "Telegram Bot", metric: "qualify", className: "right-6 top-[28%]" },
  { label: "CRM", metric: "score A/B", className: "right-6 bottom-[23%]" },
  { label: "AI Agent", metric: "summary", className: "left-[28%] top-[10%]" },
  { label: "RKO Leads", metric: "live", className: "left-[16%] bottom-[12%]" },
] as const;

const flow = [
  { label: "Пост", x: 16, y: 48 },
  { label: "Ленд", x: 31, y: 69 },
  { label: "Бот", x: 50, y: 47 },
  { label: "CRM", x: 70, y: 62 },
  { label: "Менеджер", x: 84, y: 42 },
] as const;

export function HeroWowLayer({ commands }: { commands: readonly string[] }) {
  const mode = useMotionMode();
  const layerRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<number | null>(null);
  const pointRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (mode !== "full") return;
    const layerElement = layerRef.current;
    if (!layerElement) return;
    const currentLayer: HTMLDivElement = layerElement;

    function flush() {
      const rect = currentLayer.getBoundingClientRect();
      const px = (pointRef.current.x - rect.left) / rect.width - 0.5;
      const py = (pointRef.current.y - rect.top) / rect.height - 0.5;
      currentLayer.style.setProperty("--parallax-x", `${px * 18}px`);
      currentLayer.style.setProperty("--parallax-y", `${py * 16}px`);
      frameRef.current = null;
    }

    function onMove(event: PointerEvent) {
      pointRef.current = { x: event.clientX, y: event.clientY };
      if (frameRef.current === null) frameRef.current = window.requestAnimationFrame(flush);
    }

    currentLayer.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      currentLayer.removeEventListener("pointermove", onMove);
      if (frameRef.current !== null) window.cancelAnimationFrame(frameRef.current);
    };
  }, [mode]);

  return (
    <div ref={layerRef} className="hero-wow-layer absolute inset-0 overflow-hidden rounded-[1.25rem]">
      <div className="hero-wow-grid absolute inset-0" />
      <svg aria-hidden="true" viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full">
        <defs>
          <linearGradient id="heroWowLine" x1="0" x2="1">
            <stop offset="0%" stopColor="var(--signal)" stopOpacity=".08" />
            <stop offset="45%" stopColor="var(--signal-bright)" stopOpacity=".88" />
            <stop offset="100%" stopColor="var(--signal-bright)" stopOpacity=".24" />
          </linearGradient>
        </defs>
        <polyline
          points={flow.map((item) => `${item.x},${item.y}`).join(" ")}
          fill="none"
          stroke="url(#heroWowLine)"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
          className="hero-wow-flow"
        />
      </svg>

      <div className="hero-wow-orb absolute left-1/2 top-[51%] grid size-48 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-signal/28 bg-[var(--surface-2)]/80 shadow-[0_0_80px_rgb(var(--signal-rgb)/0.36)] lg:size-56">
        <div className="hero-wow-ring absolute inset-3 rounded-full border border-signal/20" />
        <div className="hero-wow-ring hero-wow-ring-delay absolute inset-8 rounded-full border border-signal/18" />
        <div className="grid size-20 place-items-center rounded-full bg-signal text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-950 shadow-[0_0_46px_rgb(var(--signal-rgb)/0.9)]">
          AI
        </div>
      </div>

      {cards.map((card, index) => (
        <div
          key={card.label}
          className={`hero-wow-card absolute z-20 ${card.className} min-w-28 rounded-lg border border-white/12 bg-[var(--surface-2)]/90 px-3 py-2 text-xs text-white shadow-[0_16px_42px_rgba(0,0,0,0.28)] md:backdrop-blur-md`}
          style={{ animationDelay: `${index * 0.16}s` }}
        >
          <div className="mb-2 h-1 w-8 rounded-full bg-signal-strong/80" />
          <div className="font-semibold">{card.label}</div>
          <div className="mt-1 font-mono text-[10px] text-signal-bright/80">{card.metric}</div>
        </div>
      ))}

      <div className="hero-wow-terminal absolute inset-x-4 bottom-4 z-30 rounded-lg border border-signal/20 bg-black/48 px-4 py-3 font-mono text-xs text-signal-bright shadow-[0_0_32px_rgb(var(--signal-rgb)/0.16)]">
        <span className="text-signal-strong">vibecamp</span>
        <span className="text-slate-500"> $ </span>
        <span className="hero-wow-type inline-block align-bottom">{commands.join("  ")}</span>
      </div>
    </div>
  );
}
