"use client";

import { motion, useReducedMotion } from "framer-motion";
import { casesSection } from "@/lib/content";
import { CasePreview } from "./PreviewWidgets";
import { SectionReveal } from "./SectionReveal";
import { GlassCard, SectionHeading } from "./SectionPrimitives";

export function Cases() {
  const reduceMotion = useReducedMotion();

  return (
    <SectionReveal id="cases" className="relative px-4 py-20 sm:px-6">
      <div aria-hidden="true" className="absolute left-0 top-24 h-72 w-full bg-[radial-gradient(circle_at_70%_35%,rgba(124,58,237,0.14),transparent_34rem)]" />
      <div className="mx-auto max-w-6xl">
        <SectionHeading {...casesSection.heading} tone="violet" className="mb-10" />

        <div className="grid gap-4 lg:grid-cols-5">
          {casesSection.items.map((item, index) => (
            <motion.div
              key={item.title}
              initial={reduceMotion ? false : { opacity: 0, y: 34, rotateX: 5 }}
              whileInView={reduceMotion ? undefined : { opacity: 1, y: 0, rotateX: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.55, delay: index * 0.06, ease: [0.22, 1, 0.36, 1] }}
              whileHover={reduceMotion ? undefined : { y: -8, scale: 1.01 }}
              className={index === 0 || index === 1 ? "lg:col-span-2" : undefined}
            >
              <GlassCard className="group min-h-[370px] bg-[#07172d]/82 p-4 shadow-[0_24px_90px_rgba(0,0,0,0.24)]">
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-300/10 via-transparent to-violet-400/14 opacity-70" />
                <div className="relative z-10 flex h-full flex-col">
                  <div className="mb-4 flex items-center justify-between">
                    <div className="flex gap-1.5" aria-hidden="true">
                      <span className="size-2.5 rounded-full bg-rose-300/80" />
                      <span className="size-2.5 rounded-full bg-amber-300/80" />
                      <span className="size-2.5 rounded-full bg-emerald-300/80" />
                    </div>
                    <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-slate-500">пример.0{index + 1}</span>
                  </div>
                  <div className="mb-5 rounded-lg border border-white/10 bg-black/24 p-3">
                    <CasePreview index={index} code={item.code} />
                  </div>
                  <div className="mt-auto">
                    <span className="rounded-lg border border-cyan-200/20 bg-cyan-200/10 px-2.5 py-1 text-[11px] uppercase tracking-[0.16em] text-cyan-100">
                      {item.artifact}
                    </span>
                    <h3 className="mt-4 text-xl font-semibold text-white">{item.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-300">{item.description}</p>
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </div>
      </div>
    </SectionReveal>
  );
}
