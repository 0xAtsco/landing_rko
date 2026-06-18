"use client";

import { useEffect, useRef } from "react";
import { useMotionMode } from "@/lib/motion";

const cardPositions = [
  "left-5 top-[38%]",
  "right-6 top-[28%]",
  "right-6 bottom-[23%]",
  "left-[28%] top-[10%]",
  "left-[16%] bottom-[12%]",
] as const;

const flow = [
  { label: "Пост", x: 16, y: 48 },
  { label: "Ленд", x: 31, y: 69 },
  { label: "Бот", x: 50, y: 47 },
  { label: "CRM", x: 70, y: 62 },
  { label: "Менеджер", x: 84, y: 42 },
] as const;

export function HeroWowLayer() {
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
        <div className="size-20 rounded-full bg-signal shadow-[0_0_46px_rgb(var(--signal-rgb)/0.9)]" />
      </div>

      {cardPositions.map((position, index) => (
        <div
          key={position}
          className={`hero-wow-card absolute z-20 ${position} min-w-28 rounded-lg border border-white/12 bg-[var(--surface-2)]/90 px-3 py-3 shadow-[0_16px_42px_rgba(0,0,0,0.28)] md:backdrop-blur-md`}
          style={{ animationDelay: `${index * 0.16}s` }}
          aria-hidden="true"
        >
          <div className="mb-2 h-1 w-8 rounded-full bg-signal-strong/80" />
          <div className="h-2 rounded bg-white/18" />
          <div className="mt-2 h-2 w-2/3 rounded bg-signal/35" />
        </div>
      ))}

      <div className="hero-wow-terminal absolute inset-x-4 bottom-4 z-30 grid grid-cols-[1fr_0.6fr_0.9fr] gap-2 rounded-lg border border-signal/20 bg-black/48 px-4 py-3 shadow-[0_0_32px_rgb(var(--signal-rgb)/0.16)]" aria-hidden="true">
        <span className="h-2 rounded bg-signal-strong/70" />
        <span className="h-2 rounded bg-white/12" />
        <span className="h-2 rounded bg-signal/35" />
      </div>
    </div>
  );
}
