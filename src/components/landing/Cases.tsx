"use client";

import { motion, useReducedMotion } from "framer-motion";
import { cases } from "@/lib/content";
import { SectionReveal } from "./SectionReveal";

export function Cases() {
  const reduceMotion = useReducedMotion();

  return (
    <SectionReveal id="cases" className="relative px-4 py-20 sm:px-6">
      <div aria-hidden="true" className="absolute left-0 top-24 h-72 w-full bg-[radial-gradient(circle_at_70%_35%,rgba(124,58,237,0.14),transparent_34rem)]" />
      <div className="mx-auto max-w-6xl">
        <div className="mb-10 max-w-3xl">
          <p className="text-sm font-medium uppercase tracking-[0.22em] text-violet-200/80">
            артефакты вместо обещаний
          </p>
          <h2 className="mt-3 text-3xl font-semibold leading-[1.02] text-white sm:text-5xl">
            Что уже можно собрать на таком подходе
          </h2>
        </div>

        <div className="grid gap-4 lg:grid-cols-5">
          {cases.map((item, index) => (
            <motion.article
              key={item.title}
              initial={reduceMotion ? false : { opacity: 0, y: 34, rotateX: 5 }}
              whileInView={reduceMotion ? undefined : { opacity: 1, y: 0, rotateX: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.55, delay: index * 0.06, ease: [0.22, 1, 0.36, 1] }}
              whileHover={reduceMotion ? undefined : { y: -8, scale: 1.01 }}
              className={`group relative min-h-[370px] overflow-hidden rounded-lg border border-white/10 bg-[#07172d]/82 p-4 shadow-[0_24px_90px_rgba(0,0,0,0.24)] backdrop-blur-xl ${index === 0 || index === 1 ? "lg:col-span-2" : ""}`}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-300/10 via-transparent to-violet-400/14 opacity-70" />
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-violet-200/50 to-transparent opacity-0 transition group-hover:opacity-100" />
              <div className="relative z-10 flex h-full flex-col">
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex gap-1.5">
                  <span className="size-2.5 rounded-full bg-rose-300/80" />
                  <span className="size-2.5 rounded-full bg-amber-300/80" />
                  <span className="size-2.5 rounded-full bg-emerald-300/80" />
                  </div>
                  <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-slate-500">
                    artifact.0{index + 1}
                  </span>
                </div>
                <div className="mb-5 rounded-lg border border-white/10 bg-black/24 p-3">
                  <CaseWindow index={index} />
                </div>
                <div className="mt-auto">
                  <span className="rounded-lg border border-cyan-200/20 bg-cyan-200/10 px-2.5 py-1 text-[11px] uppercase tracking-[0.16em] text-cyan-100">
                    {item.artifact}
                  </span>
                  <h3 className="mt-4 text-xl font-semibold text-white">{item.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-300">{item.description}</p>
                </div>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </SectionReveal>
  );
}

function CaseWindow({ index }: { index: number }) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-[1fr_auto] gap-3 rounded-md border border-white/8 bg-white/[0.035] p-2 font-mono text-[10px] text-slate-400">
        <span>{["content.ops", "sales.agent", "shorts.flow", "rko.pipe", "crm.core"][index]}</span>
        <span className="text-cyan-200">active</span>
      </div>
      {Array.from({ length: 4 }).map((_, row) => (
        <div key={row} className="flex items-center gap-2">
          <span className={`size-7 rounded-lg ${row === index % 4 ? "bg-cyan-300 shadow-[0_0_20px_rgba(34,211,238,0.45)]" : "bg-white/10"}`} />
          <span className="h-2 flex-1 rounded bg-white/12" />
          <span className="h-2 w-10 rounded bg-violet-300/25" />
        </div>
      ))}
      <div className="grid grid-cols-5 gap-1.5 pt-2">
        {Array.from({ length: 15 }).map((_, i) => (
          <span
            key={i}
            className={`case-cell h-8 rounded ${i % (index + 2) === 0 ? "bg-cyan-300/55" : "bg-white/8"}`}
            style={{ animationDelay: `${i * 0.05}s` }}
          />
        ))}
      </div>
    </div>
  );
}
