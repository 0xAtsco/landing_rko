"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Bot, CalendarDays, LayoutDashboard, Rocket, Send, WalletCards } from "lucide-react";
import type { MouseEvent } from "react";
import { buildsSection } from "@/lib/content";
import { BuildPreview } from "./PreviewWidgets";
import { SectionReveal } from "./SectionReveal";
import { GlassCard, SectionHeading, TechPanel } from "./SectionPrimitives";

const icons = [Rocket, Send, LayoutDashboard, Bot, CalendarDays, Rocket, WalletCards, LayoutDashboard] as const;

export function BentoBuilds() {
  const reduceMotion = useReducedMotion();

  function trackPointer(event: MouseEvent<HTMLElement>) {
    if (reduceMotion) return;
    const rect = event.currentTarget.getBoundingClientRect();
    event.currentTarget.style.setProperty("--x", `${event.clientX - rect.left}px`);
    event.currentTarget.style.setProperty("--y", `${event.clientY - rect.top}px`);
  }

  return (
    <SectionReveal id="builds" className="relative px-4 py-20 sm:px-6">
      <div aria-hidden="true" className="absolute inset-x-0 top-8 h-40 skew-y-[-3deg] bg-cyan-300/[0.035]" />
      <div className="mx-auto max-w-6xl">
        <div className="mb-10 grid gap-4 lg:grid-cols-[0.9fr_0.55fr] lg:items-end">
          <SectionHeading {...buildsSection.heading} titleClassName="leading-[0.98]" />
          <TechPanel label={buildsSection.stats.label} value={buildsSection.stats.value} />
        </div>

        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          {buildsSection.items.map((item, index) => {
            const Icon = icons[index];
            const wide = index === 0 || index === 2 || index === 6;
            return (
              <motion.div
                key={item.title}
                whileHover={reduceMotion ? undefined : { y: -8, rotateX: wide ? 0 : 1.4, rotateY: wide ? 0 : -1.2 }}
                transition={{ type: "spring", stiffness: 220, damping: 22 }}
                onMouseMove={trackPointer}
                className={wide ? "lg:col-span-2" : undefined}
              >
                <GlassCard className="group min-h-[270px] bg-[#06162d]/86 [transform-style:preserve-3d]" interactive>
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_var(--x,50%)_var(--y,0%),rgba(34,211,238,0.28),transparent_32%)] opacity-0 transition duration-500 group-hover:opacity-100" />
                  <div className="relative z-10 flex h-full flex-col justify-between gap-6">
                    <div>
                      <div className="mb-4 grid size-11 place-items-center rounded-lg border border-cyan-200/20 bg-cyan-200/10 text-cyan-200">
                        <Icon className="size-5" />
                      </div>
                      <h3 className="text-xl font-semibold leading-tight text-white">{item.title}</h3>
                      <p className="mt-2 text-sm leading-6 text-slate-300">{item.description}</p>
                    </div>
                    <BuildPreview type={item.preview} />
                  </div>
                </GlassCard>
              </motion.div>
            );
          })}
        </div>
      </div>
    </SectionReveal>
  );
}
