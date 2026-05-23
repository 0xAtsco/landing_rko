"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Bot, CalendarDays, LayoutDashboard, Rocket, Send, WalletCards } from "lucide-react";
import type { MouseEvent } from "react";
import { builds } from "@/lib/content";
import { SectionReveal } from "./SectionReveal";

const icons = [Rocket, Send, LayoutDashboard, Bot, CalendarDays, Rocket, WalletCards, LayoutDashboard];

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
          <div>
          <p className="text-sm font-medium uppercase tracking-[0.22em] text-cyan-200/80">
            что ты можешь собрать
          </p>
          <h2 className="mt-3 max-w-3xl text-3xl font-semibold leading-[0.98] text-white sm:text-5xl">
            Не конспект. Рабочий артефакт под твою задачу.
          </h2>
          </div>
          <div className="rounded-lg border border-cyan-200/14 bg-black/20 p-4 font-mono text-xs text-slate-300 backdrop-blur-xl">
            <div className="mb-3 flex justify-between text-cyan-100">
              <span>build matrix</span>
              <span>8 paths</span>
            </div>
            <div className="grid grid-cols-8 gap-1">
              {Array.from({ length: 32 }).map((_, index) => (
                <span key={index} className={`h-2 rounded-sm ${index % 5 === 0 ? "bg-cyan-300" : index % 3 === 0 ? "bg-violet-300/55" : "bg-white/10"}`} />
              ))}
            </div>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          {builds.map((item, index) => {
            const Icon = icons[index];
            const wide = index === 0 || index === 2 || index === 6;
            return (
              <motion.article
                key={item.title}
                whileHover={reduceMotion ? undefined : { y: -8, rotateX: wide ? 0 : 1.4, rotateY: wide ? 0 : -1.2 }}
                transition={{ type: "spring", stiffness: 220, damping: 22 }}
                onMouseMove={trackPointer}
                className={`group relative min-h-[270px] overflow-hidden rounded-lg border border-white/10 bg-[#06162d]/86 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_24px_80px_rgba(0,0,0,0.22)] backdrop-blur-xl [transform-style:preserve-3d] ${wide ? "lg:col-span-2" : ""}`}
              >
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_var(--x,50%)_var(--y,0%),rgba(34,211,238,0.28),transparent_32%)] opacity-0 transition duration-500 group-hover:opacity-100" />
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-200/50 to-transparent opacity-0 transition group-hover:opacity-100" />
                <div className="relative z-10 flex h-full flex-col justify-between gap-6">
                  <div>
                    <div className="mb-4 grid size-11 place-items-center rounded-lg border border-cyan-200/20 bg-cyan-200/10 text-cyan-200">
                      <Icon className="size-5" />
                    </div>
                    <h3 className="text-xl font-semibold leading-tight text-white">{item.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-300">{item.description}</p>
                  </div>
                  <MiniPreview type={item.preview} />
                </div>
              </motion.article>
            );
          })}
        </div>
      </div>
    </SectionReveal>
  );
}

function MiniPreview({ type }: { type: string }) {
  if (type === "bot") {
    return (
      <div className="space-y-2 rounded-lg border border-white/10 bg-black/28 p-3 shadow-[inset_0_0_28px_rgba(34,211,238,0.04)]">
        {["Привет. Какая задача?", "Нужен сайт + бот", "Принял. Отправил лид."].map((line, i) => (
          <div key={line} className={`chat-pop w-fit max-w-[88%] rounded-lg px-3 py-2 text-xs ${i === 1 ? "ml-auto bg-cyan-300 text-slate-950" : "bg-white/10 text-slate-200"}`} style={{ animationDelay: `${i * 0.18}s` }}>
            {line}
          </div>
        ))}
      </div>
    );
  }

  if (type === "crm" || type === "rko") {
    return (
      <div className="rounded-lg border border-white/10 bg-black/28 p-3">
        <div className="mb-3 grid grid-cols-3 gap-1.5">
          {["lead", "score", "next"].map((item, index) => (
            <span key={item} className={`rounded px-2 py-1 text-center font-mono text-[9px] uppercase tracking-[0.12em] ${index === 1 ? "bg-cyan-300/80 text-slate-950" : "bg-white/8 text-slate-300"}`}>
              {item}
            </span>
          ))}
        </div>
        {["Новый", "В работе", "Документы", "Готово"].map((status, i) => (
          <div key={status} className="pipeline-row mb-2 grid grid-cols-[1fr_54px] gap-2 text-xs last:mb-0" style={{ animationDelay: `${i * 0.12}s` }}>
            <span className="rounded bg-white/8 px-2 py-1.5 text-slate-200">{status}</span>
            <span className={`rounded px-2 py-1.5 text-center ${i === 0 ? "bg-cyan-300/80 text-slate-950" : "bg-violet-300/16 text-violet-100"}`}>
              {i + 2}
            </span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-white/10 bg-black/28 p-3">
      <div className="mb-3 grid h-20 grid-cols-5 gap-1.5 rounded-lg bg-gradient-to-br from-cyan-300/12 via-blue-400/8 to-violet-400/16 p-2">
        {Array.from({ length: 15 }).map((_, index) => (
          <span key={index} className={`matrix-cell rounded-sm ${index % 4 === 0 ? "bg-cyan-300/80" : index % 3 === 0 ? "bg-violet-300/45" : "bg-white/10"}`} style={{ animationDelay: `${index * 0.04}s` }} />
        ))}
      </div>
      <div className="space-y-2">
        <div className="h-2 rounded bg-white/18" />
        <div className="h-2 w-2/3 rounded bg-cyan-200/35" />
      </div>
    </div>
  );
}
