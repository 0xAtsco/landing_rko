"use client";

import { ArrowRight } from "lucide-react";
import { motion, useMotionValue, useReducedMotion, useSpring } from "framer-motion";
import type { MouseEvent, PropsWithChildren } from "react";
import { cn } from "@/lib/utils";

type MagneticButtonProps = PropsWithChildren<{
  href: string;
  variant?: "primary" | "secondary";
  className?: string;
}>;

export function MagneticButton({
  href,
  variant = "primary",
  className,
  children,
}: MagneticButtonProps) {
  const reduceMotion = useReducedMotion();
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const glowX = useMotionValue("50%");
  const glowY = useMotionValue("50%");
  const springX = useSpring(x, { stiffness: 220, damping: 18 });
  const springY = useSpring(y, { stiffness: 220, damping: 18 });

  function onMouseMove(event: MouseEvent<HTMLAnchorElement>) {
    if (reduceMotion) return;
    const rect = event.currentTarget.getBoundingClientRect();
    x.set((event.clientX - rect.left - rect.width / 2) * 0.16);
    y.set((event.clientY - rect.top - rect.height / 2) * 0.16);
    glowX.set(`${event.clientX - rect.left}px`);
    glowY.set(`${event.clientY - rect.top}px`);
  }

  function reset() {
    x.set(0);
    y.set(0);
  }

  return (
    <motion.a
      href={href}
      onMouseMove={onMouseMove}
      onMouseLeave={reset}
      style={{ x: springX, y: springY }}
      className={cn(
        "group relative inline-flex min-h-12 shrink-0 items-center justify-center gap-2 overflow-hidden whitespace-nowrap rounded-lg px-5 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 sm:px-6",
        variant === "primary"
          ? "bg-cyan-300 text-slate-950 shadow-[0_0_34px_rgba(34,211,238,0.38),inset_0_1px_0_rgba(255,255,255,0.55)] hover:bg-white"
          : "border border-white/15 bg-white/[0.06] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-xl hover:border-cyan-200/50 hover:bg-white/[0.1]",
        className,
      )}
    >
      <motion.span
        aria-hidden="true"
        className="absolute size-32 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/35 opacity-0 blur-xl transition-opacity duration-300 group-hover:opacity-70"
        style={{ left: glowX, top: glowY }}
      />
      <span className="absolute inset-0 translate-x-[-120%] bg-gradient-to-r from-transparent via-white/45 to-transparent transition duration-700 group-hover:translate-x-[120%]" />
      <span className="relative z-10">{children}</span>
      <ArrowRight className="relative z-10 size-4 transition group-hover:translate-x-0.5" />
    </motion.a>
  );
}
